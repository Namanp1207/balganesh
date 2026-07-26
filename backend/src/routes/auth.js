import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

/**
 * Builds the list of valid admin logins from environment variables.
 * Supports the original single-admin vars (ADMIN_EMAIL / ADMIN_PASSWORD)
 * plus any number of additional numbered pairs:
 *   ADMIN_EMAIL_2 / ADMIN_PASSWORD_2
 *   ADMIN_EMAIL_3 / ADMIN_PASSWORD_3
 *   ...and so on.
 * All of them can be logged in with at the same time — there's no limit
 * on how many people can be signed in simultaneously.
 */
function getAdminAccounts() {
  const accounts = [];

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    accounts.push({
      email: process.env.ADMIN_EMAIL.trim().toLowerCase(),
      password: process.env.ADMIN_PASSWORD,
    });
  }

  let i = 2;
  while (process.env[`ADMIN_EMAIL_${i}`] && process.env[`ADMIN_PASSWORD_${i}`]) {
    accounts.push({
      email: process.env[`ADMIN_EMAIL_${i}`].trim().toLowerCase(),
      password: process.env[`ADMIN_PASSWORD_${i}`],
    });
    i++;
  }

  return accounts;
}

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const accounts = getAdminAccounts();
  const match = accounts.find(
    (acc) => acc.email === email.trim().toLowerCase() && acc.password === password
  );

  if (!match) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign({ email: match.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
  res.json({ token, email: match.email });
});

export default router;
