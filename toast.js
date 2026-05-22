/**
 * toast.js — Minimal toast notification system.
 */

const ICONS = {
  success: "fa-circle-check",
  error: "fa-circle-exclamation",
  info: "fa-circle-info",
};

const TITLES = {
  success: "Listo",
  error: "Ups…",
  info: "Aviso",
};

function getStack() {
  return document.getElementById("toastStack");
}

export function toast({ type = "info", title, message, duration = 3800 }) {
  const stack = getStack();
  if (!stack) return;

  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.setAttribute("data-testid", `toast-${type}`);
  el.innerHTML = `
    <span class="toast__icon"><i class="fa-solid ${ICONS[type] || ICONS.info}"></i></span>
    <div class="toast__body">
      <div class="toast__title">${title || TITLES[type] || ""}</div>
      <div class="toast__msg"></div>
    </div>
    <button class="toast__close" aria-label="Cerrar">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  el.querySelector(".toast__msg").textContent = message || "";

  const close = () => {
    el.classList.add("toast--out");
    setTimeout(() => el.remove(), 240);
  };

  el.querySelector(".toast__close").addEventListener("click", close);
  stack.appendChild(el);

  if (duration > 0) setTimeout(close, duration);
}

export const toastSuccess = (message, title) => toast({ type: "success", message, title });
export const toastError = (message, title) => toast({ type: "error", message, title });
export const toastInfo = (message, title) => toast({ type: "info", message, title });
