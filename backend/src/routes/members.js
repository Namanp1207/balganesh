import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { generateReceiptNo, streamReceiptPDF } from "../utils/pdf.js";
import { streamTablePDF } from "../utils/tablePdf.js";
import { sendReceiptOnWhatsApp } from "../utils/whatsapp.js";

const router = Router();

const VALID_WINGS = ["A", "B", "C", "Others"];

// GET /api/members?wing=A  -> list members, optionally filtered by wing
router.get("/", requireAuth, async (req, res) => {
  const { wing } = req.query;
  try {
    let result;
    if (wing && VALID_WINGS.includes(wing)) {
      result = await pool.query(
        "SELECT * FROM members WHERE wing = $1 ORDER BY created_at DESC",
        [wing]
      );
    } else {
      result = await pool.query("SELECT * FROM members ORDER BY created_at DESC");
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

// POST /api/members -> add a new member and generate a downloadable PDF receipt
router.post("/", requireAuth, async (req, res) => {
  const { name, surname, phone, flat_no, wing, date, amount, payment_mode } = req.body;

  if (!name || !surname || !phone || !flat_no || !wing || !date || !amount || !payment_mode) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (!VALID_WINGS.includes(wing)) {
    return res.status(400).json({ error: "Wing must be A, B, C or Others" });
  }
  if (!["Cash", "Online"].includes(payment_mode)) {
    return res.status(400).json({ error: "Payment mode must be Cash or Online" });
  }

  try {
    const insertResult = await pool.query(
      `INSERT INTO members (name, surname, phone, flat_no, wing, contribution_date, amount, payment_mode)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, surname, phone, flat_no, wing, date, amount, payment_mode]
    );
    const member = insertResult.rows[0];

    const receiptNo = generateReceiptNo(member.id);
    await pool.query("UPDATE members SET receipt_no = $1 WHERE id = $2", [receiptNo, member.id]);
    member.receipt_no = receiptNo;

    // Every receipt gets copied to ONE fixed number (set in Settings), not to the
    // donor's own phone — the donor's phone on the form is just their contact info.
    const settingsResult = await pool.query("SELECT whatsapp_notify_number FROM settings WHERE id = 1");
    const notifyNumber = settingsResult.rows[0]?.whatsapp_notify_number;

    let whatsappResult = { sent: false, reason: "No WhatsApp notify number set in Settings" };
    if (notifyNumber) {
      whatsappResult = await sendReceiptOnWhatsApp({
        phone: notifyNumber,
        receiptNo,
        memberName: `${member.name} ${member.surname}`,
      });
    }

    res.status(201).json({
      member,
      receiptUrl: `/api/members/receipt/${receiptNo}`,
      whatsapp: whatsappResult,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add member" });
  }
});

// GET /api/members/receipt/:receiptNo -> generate and stream a member's receipt PDF on demand
router.get("/receipt/:receiptNo", async (req, res) => {
  const { receiptNo } = req.params;
  try {
    const result = await pool.query("SELECT * FROM members WHERE receipt_no = $1", [receiptNo]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Receipt not found" });
    }
    streamReceiptPDF(res, result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate receipt" });
  }
});

// GET /api/members/export/pdf?wing=A -> export the full member list (or a wing) as one PDF
router.get("/export/pdf", requireAuth, async (req, res) => {
  const { wing, generatedAt } = req.query;
  try {
    let result;
    if (wing && VALID_WINGS.includes(wing)) {
      result = await pool.query(
        "SELECT * FROM members WHERE wing = $1 ORDER BY contribution_date ASC, id ASC",
        [wing]
      );
    } else {
      result = await pool.query("SELECT * FROM members ORDER BY contribution_date ASC, id ASC");
    }

    const rows = result.rows.map((m) => ({
      name: m.name,
      surname: m.surname,
      phone: m.phone,
      flat_no: m.flat_no,
      wing: m.wing,
      contribution_date: new Date(m.contribution_date).toLocaleDateString("en-IN"),
      amount: `Rs. ${Number(m.amount).toFixed(2)}`,
      payment_mode: m.payment_mode,
    }));

    streamTablePDF(res, {
      title: wing && wing !== "All" ? `Member Details — Wing ${wing}` : "All Member Details",
      subtitle: "Member Contribution Report",
      filename: `members${wing && wing !== "All" ? `-wing-${wing}` : ""}.pdf`,
      columns: [
        { key: "name", label: "Name", width: 1.1 },
        { key: "surname", label: "Surname", width: 1.1 },
        { key: "phone", label: "Phone No.", width: 1.2 },
        { key: "flat_no", label: "Flat No.", width: 0.9 },
        { key: "wing", label: "Wing", width: 0.6 },
        { key: "contribution_date", label: "Date", width: 1 },
        { key: "amount", label: "Amount", width: 1.1 },
        { key: "payment_mode", label: "Mode", width: 0.9 },
      ],
      rows,
      generatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export members" });
  }
});

export default router;
