/**
 * data/state.js — Shared in-memory mock state for the Node/Express backend.
 * Replace with real provider calls and persistent storage in production.
 */
const crypto = require("crypto");

const hash = (plain) =>
  crypto.createHash("sha256").update(plain, "utf8").digest("hex");

const users = {
  "admin@premiumdigital.com": {
    id: "u_admin",
    name: "Admin",
    email: "admin@premiumdigital.com",
    passwordHash: hash("admin123"),
    role: "admin",
  },
};

const wallet = {
  balance: 1250.0,
  currency: "USD",
  updated_at: new Date().toISOString(),
};

const products = [
  { id: "ff-100",  name: "Free Fire 100 Diamantes",  description: "Recarga directa al ID del jugador.",     price: 1.50,  currency: "USD", category: "freefire" },
  { id: "ff-310",  name: "Free Fire 310 Diamantes",  description: "Diamantes + bonus por compra.",          price: 4.20,  currency: "USD", category: "freefire" },
  { id: "ff-520",  name: "Free Fire 520 Diamantes",  description: "Pack popular para skins y armas.",       price: 6.80,  currency: "USD", category: "freefire" },
  { id: "ff-1060", name: "Free Fire 1060 Diamantes", description: "Ideal para eventos y top-up rápido.",    price: 13.50, currency: "USD", category: "freefire" },
  { id: "ff-2180", name: "Free Fire 2180 Diamantes", description: "Pack premium con mayor bonus.",          price: 26.00, currency: "USD", category: "freefire" },
  { id: "ff-week", name: "Membresía Semanal FF",     description: "100 diamantes diarios por 7 días.",      price: 1.80,  currency: "USD", category: "membership" },
  { id: "ff-month",name: "Membresía Mensual FF",     description: "Diamantes diarios + bonos mensuales.",   price: 7.50,  currency: "USD", category: "membership" },
  { id: "gp-10",   name: "Google Play Gift Card $10",description: "Recarga universal para Play Store.",     price: 9.50,  currency: "USD", category: "giftcard" },
  { id: "gp-25",   name: "Google Play Gift Card $25",description: "Compras in-app y apps premium.",         price: 23.80, currency: "USD", category: "giftcard" },
  { id: "it-10",   name: "iTunes / App Store $10",   description: "Compras en App Store y Apple Music.",    price: 9.80,  currency: "USD", category: "giftcard" },
  { id: "az-25",   name: "Amazon Gift Card $25",     description: "Saldo Amazon listo para usar.",          price: 24.00, currency: "USD", category: "giftcard" },
  { id: "psn-20",  name: "PlayStation Store $20",    description: "Compras en PS Store y PS Plus.",         price: 19.50, currency: "USD", category: "giftcard" },
];

const orders = [];

const stats = {
  ordersToday: 0,
  successCount: 0,
  totalCount: 0,
};

module.exports = { hash, users, wallet, products, orders, stats };
