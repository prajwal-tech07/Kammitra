const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ── Health Check ────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ── Routes ──────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/worker", require("./routes/worker"));
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/employer", require("./routes/employer"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/schemes", require("./routes/schemes"));

// ── Helper: start Express only once ─────────────────────────
const PORT = process.env.PORT || 5000;

function startServer(label) {
  const server = app.listen(PORT, () => {
    console.log(`${label} on http://localhost:${PORT}`);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use. Kill the other process or change PORT in .env`);
    } else {
      console.error(err);
    }
    process.exit(1);
  });
}

// ── Connect to DB & Start Server ────────────────────────────
connectDB()
  .then(() => {
    startServer("🚀 KaamMitra API running");
    // Start RSS cron job for scheme news
    require("./cron/schemeNews").start();
  })
  .catch(() => {
    // Start server even if MongoDB is unavailable (health check still works)
    startServer("⚠️  KaamMitra API running WITHOUT database");
  });
