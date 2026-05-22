/**
 * routes/orders.js — Recent orders.
 */
const express = require("express");
const { orders } = require("../data/state");

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({ orders: orders.slice(0, 50) });
});

module.exports = router;
