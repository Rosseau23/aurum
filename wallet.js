/**
 * routes/wallet.js — Wallet snapshot.
 */
const express = require("express");
const { wallet, products, stats } = require("../data/state");

const router = express.Router();

router.get("/", (_req, res) => {
  const successRate = stats.totalCount > 0
    ? Math.round((stats.successCount / stats.totalCount) * 1000) / 10
    : 100.0;
  res.json({
    balance: Math.round(wallet.balance * 100) / 100,
    currency: wallet.currency,
    updated_at: wallet.updated_at,
    stats: {
      orders_today: stats.ordersToday,
      success_rate: successRate,
      active_products: products.length,
    },
  });
});

module.exports = router;
