import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { streamTablePDF } from "../utils/tablePdf.js";

const router = Router();

// GET /api/expenses -> list all expenses
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM expenses ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// POST /api/expenses -> add a new expense
router.post("/", requireAuth, async (req, res) => {
  const { expense_name, amount, date } = req.body;

  if (!expense_name || !amount || !date) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO expenses (expense_name, amount, expense_date) VALUES ($1,$2,$3) RETURNING *`,
      [expense_name, amount, date],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add expense" });
  }
});

// GET /api/expenses/export/pdf -> export the full expenses list as one PDF
router.get("/export/pdf", requireAuth, async (req, res) => {
  const { generatedAt } = req.query;
  try {
    const result = await pool.query(
      "SELECT * FROM expenses ORDER BY created_at ASC, id ASC",
    );

    const rows = result.rows.map((e) => ({
      expense_name: e.expense_name,
      amount: `Rs. ${Number(e.amount).toFixed(2)}`,
      expense_date: new Date(e.expense_date).toLocaleDateString("en-IN"),
    }));

    streamTablePDF(res, {
      title: "All Expenses Details",
      subtitle: "Expenses Report",
      filename: "expenses.pdf",
      columns: [
        { key: "expense_name", label: "Expenses Name", width: 2 },
        { key: "amount", label: "Amount", width: 1 },
        { key: "expense_date", label: "Date", width: 1 },
      ],
      rows,
      generatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export expenses" });
  }
});

export default router;
