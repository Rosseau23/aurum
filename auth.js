/**
 * middleware/auth.js — JWT verification middleware.
 */
const jwt = require("jsonwebtoken");
const { users } = require("../data/state");

const SECRET = process.env.JWT_SECRET || "aurum-dev-secret-change-me";

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, SECRET);
    const user = users[payload.sub];
    if (!user) return res.status(401).json({ message: "Usuario no encontrado" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

function signToken(user) {
  return jwt.sign(
    { sub: user.email, name: user.name, role: user.role },
    SECRET,
    { expiresIn: "12h" }
  );
}

module.exports = { requireAuth, signToken, SECRET };
