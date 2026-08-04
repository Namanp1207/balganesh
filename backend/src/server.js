import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import memberRoutes from "./routes/members.js";
import expenseRoutes from "./routes/expenses.js";
import dashboardRoutes from "./routes/dashboard.js";
import settingsRoutes from "./routes/settings.js";

dotenv.config();

const app = express();

// Restrict cross-origin requests to your deployed frontend once FRONTEND_URL is set.
// Accepts a comma-separated list. Each entry can be either:
//   - An exact origin:      https://balganesh.vercel.app
//   - A wildcard suffix:    *.namanparmar74-2392s-projects.vercel.app
//     (matches every preview deployment under that Vercel team/project, since
//      Vercel gives each deployment a fresh random subdomain that changes every time)
// Trailing slashes are stripped so "https://site.com" and "https://site.com/"
// are treated as the same origin.
const stripTrailingSlash = (url) => url.replace(/\/+$/, "");

// Any localhost/127.0.0.1 origin (on any port) is always allowed, regardless of
// FRONTEND_URL — so local development never gets blocked by a production CORS setting.
const isLocalhostOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

const rawAllowedEntries = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const exactOrigins = rawAllowedEntries.filter((e) => !e.startsWith("*")).map(stripTrailingSlash);
const wildcardSuffixes = rawAllowedEntries
  .filter((e) => e.startsWith("*"))
  .map((e) => stripTrailingSlash(e.slice(1))); // "*-foo.vercel.app" -> "-foo.vercel.app", "*.foo.com" -> ".foo.com"

function matchesAllowedOrigin(origin) {
  const normalized = stripTrailingSlash(origin);
  if (exactOrigins.includes(normalized)) return true;
  try {
    const hostname = new URL(origin).hostname;
    return wildcardSuffixes.some((suffix) => hostname.endsWith(suffix));
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      // No FRONTEND_URL configured yet, or request with no origin (e.g. curl/Postman/health checks) -> allow.
      if (rawAllowedEntries.length === 0 || !origin) {
        return callback(null, true);
      }
      if (isLocalhostOrigin(origin) || matchesAllowedOrigin(origin)) {
        return callback(null, true);
      }
      console.warn(
        `⚠️  Blocked a request from origin "${origin}" — it doesn't match FRONTEND_URL (${rawAllowedEntries.join(", ")}). ` +
          `If this is your real frontend, update FRONTEND_URL to match this exact origin (check http vs https and www), or add a wildcard like *-your-team-slug.vercel.app.`
      );
      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

// ✅ Root route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Catches the CORS rejection (and any other unexpected error) and responds with
// clean JSON instead of a raw Express error page/stack trace.
app.use((err, req, res, next) => {
  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "This origin is not allowed to access this API. Check FRONTEND_URL in the backend's environment variables.",
    });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🟠 Bal Ganesh Mitra Mandal backend running on port ${PORT}`);
});
