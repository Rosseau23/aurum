/**
 * routes/purchase.js — Mock purchase flow.
 */
const express = require("express");
const crypto = require("crypto");
const { products, wallet, orders, stats } = require("../data/state");

const router = express.Router();

router.post("/", (req, res) => {
  const { productId, playerId } = req.body || {};
  if (!productId || !playerId) {
    return res.status(400).json({ message: "productId y playerId son requeridos" });
  }
  const product = products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ message: "Producto no encontrado" });

  if (wallet.balance < product.price) {
    return res.status(402).json({ message: "Saldo insuficiente para esta compra" });
  }

  wallet.balance = Math.round((wallet.balance - product.price) * 100) / 100;
  wallet.updated_at = new Date().toISOString();

  stats.ordersToday += 1;
  stats.totalCount += 1;
  stats.successCount += 1;

  const order = {
    id: crypto.randomUUID().replace(/-/g, ""),
    product_id: product.id,
    product_name: product.name,
    player_id: playerId,
    amount: product.price,
    currency: product.currency,
    status: "success",
    created_at: new Date().toISOString(),
  };
  orders.unshift(order);

  res.json({
    order,
    wallet: { balance: wallet.balance, currency: wallet.currency },
  });
});

module.exports = router;
