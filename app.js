/**
 * app.js — Main entry point.
 * Boots the application, wires auth UI and global navigation.
 */
import { isAuthenticated, login, logout, getStoredUser } from "./auth.js";
import { obtenerSaldo } from "./wallet.js";
import { cargarProductos } from "./products.js";
import { wirePurchase } from "./purchase.js";
import { toastError, toastSuccess } from "./toast.js";

const els = {};

function cache() {
  els.authScreen = document.getElementById("authScreen");
  els.appMain = document.getElementById("appMain");
  els.authForm = document.getElementById("authForm");
  els.email = document.getElementById("emailInput");
  els.password = document.getElementById("passwordInput");
  els.togglePwd = document.getElementById("togglePassword");
  els.submitBtn = document.getElementById("authSubmit");
  els.logoutBtn = document.getElementById("logoutBtn");
  els.refreshWallet = document.getElementById("refreshWalletBtn");
  els.footerYear = document.getElementById("footerYear");
}

function showAuth() {
  els.authScreen.hidden = false;
  els.appMain.hidden = true;
  els.logoutBtn.hidden = true;
}

async function showApp() {
  els.authScreen.hidden = true;
  els.appMain.hidden = false;
  els.logoutBtn.hidden = false;
  // Load data in parallel
  await Promise.all([
    obtenerSaldo().catch(() => {}),
    cargarProductos().catch(() => {}),
  ]);
  wirePurchase();
}

function wireAuth() {
  els.togglePwd.addEventListener("click", () => {
    const isPwd = els.password.type === "password";
    els.password.type = isPwd ? "text" : "password";
    els.togglePwd.querySelector("i").className = isPwd
      ? "fa-regular fa-eye-slash"
      : "fa-regular fa-eye";
  });

  els.authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = els.email.value.trim();
    const password = els.password.value;
    if (!email || !password) {
      toastError("Completa email y contraseña");
      return;
    }
    els.submitBtn.dataset.loading = "true";
    try {
      const user = await login(email, password);
      toastSuccess(`Bienvenido, ${user.name}`);
      await showApp();
    } catch (err) {
      toastError(err.message || "Credenciales inválidas");
    } finally {
      els.submitBtn.dataset.loading = "false";
    }
  });

  els.logoutBtn.addEventListener("click", () => {
    logout();
    toastSuccess("Sesión cerrada");
    showAuth();
  });

  els.refreshWallet?.addEventListener("click", () => {
    obtenerSaldo().catch(() => {});
  });
}

function wireSmoothScroll() {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (href?.startsWith("#")) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  cache();
  els.footerYear.textContent = new Date().getFullYear();
  wireAuth();
  wireSmoothScroll();

  if (isAuthenticated()) {
    const user = getStoredUser();
    if (user) els.email.value = user.email;
    showApp();
  } else {
    showAuth();
  }
});
