import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/dashboard -> summary stats + recently added members/expenses
router.get("/", requireAuth, async (req, res) => {
  try {
    const [memberCount, memberTotal, expenseTotal] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM members"),
      pool.query("SELECT COALESCE(SUM(amount), 0) AS total FROM members"),
      pool.query("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses"),
    ]);

    const recentMembers = await pool.query(
      `SELECT id, name, surname, phone, flat_no, wing, amount, payment_mode, created_at,
              'member' AS type
       FROM members ORDER BY created_at DESC LIMIT 5`
    );
    const recentExpenses = await pool.query(
      `SELECT id, expense_name, amount, expense_date, created_at,
              'expense' AS type
       FROM expenses ORDER BY created_at DESC LIMIT 5`
    );

    const recentlyAdded = [...recentMembers.rows, ...recentExpenses.rows]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6);

    const totalAmount = Number(memberTotal.rows[0].total);
    const totalExpenses = Number(expenseTotal.rows[0].total);

    res.json({
      totalMembers: memberCount.rows[0].count,
      totalAmount,
      totalExpenses,
      balance: totalAmount - totalExpenses,
      recentlyAdded,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

export default router;
