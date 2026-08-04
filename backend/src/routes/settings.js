import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/settings -> current settings (currently just the WhatsApp notify number)
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT whatsapp_notify_number FROM settings WHERE id = 1",
    );
    res.json({
      whatsappNotifyNumber: result.rows[0]?.whatsapp_notify_number || "",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// PUT /api/settings -> update the WhatsApp notify number
// Send { whatsappNotifyNumber: "" } (empty string) to turn the feature off.
router.put("/", requireAuth, async (req, res) => {
  const { whatsappNotifyNumber } = req.body;

  if (whatsappNotifyNumber === undefined) {
    return res.status(400).json({ error: "whatsappNotifyNumber is required" });
  }

  const cleaned = String(whatsappNotifyNumber).trim();

  if (cleaned && !/^\+?[0-9]{7,15}$/.test(cleaned)) {
    return res
      .status(400)
      .json({
        error:
          "Enter a valid phone number (digits only, optionally starting with +)",
      });
  }

  try {
    await pool.query(
      `INSERT INTO settings (id, whatsapp_notify_number, updated_at)
       VALUES (1, $1, now())
       ON CONFLICT (id) DO UPDATE SET whatsapp_notify_number = $1, updated_at = now()`,
      [cleaned || null],
    );
    res.json({ whatsappNotifyNumber: cleaned });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
