/**
 * server.js — Aurum Node/Express backend (production-grade equivalent of server.py).
 *
 * Same API surface as the FastAPI version. Run with:
 *   cd backend && npm install && npm start
 *
 * Endpoints
 *   POST /api/auth/login    → { token, user }
 *   GET  /api/wallet        → wallet snapshot + quick stats
 *   GET  /api/products      → catalogue
 *   POST /api/purchase      → mock purchase, debits wallet
 *   GET  /api/orders        → recent orders
 *   GET  /api/health        → service heartbeat
 */
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const walletRoutes = require("./routes/wallet");
const productRoutes = require("./routes/products");
const purchaseRoutes = require("./routes/purchase");
const orderRoutes = require("./routes/orders");
const { requireAuth } = require("./middleware/auth");

const app = express();

app.use(cors({ origin: (process.env.CORS_ORIGINS || "*").split(",") }));
app.use(express.json());
app.use(morgan("dev"));

// Public
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", service: "aurum-api", time: new Date().toISOString() })
);
app.use("/api/auth", authRoutes);

// Protected
app.use("/api/wallet", requireAuth, walletRoutes);
app.use("/api/products", requireAuth, productRoutes);
app.use("/api/purchase", requireAuth, purchaseRoutes);
app.use("/api/orders", requireAuth, orderRoutes);

// 404
app.use((req, res) => res.status(404).json({ message: "Ruta no encontrada" }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Error interno" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Aurum API listening on http://localhost:${PORT}`);
});
