/**
 * routes/products.js — Catalogue listing.
 */
const express = require("express");
const { products } = require("../data/state");

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({ products });
});

module.exports = router;
