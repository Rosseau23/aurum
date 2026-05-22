"""
Aurum Backend — FastAPI mirror of the Node/Express server.

This server is what runs under supervisor inside Emergent so the live preview works.
The production-grade Node/Express version lives in `server.js` (same endpoints,
same JSON shape) — pick whichever stack you prefer when deploying.

Endpoints
  POST /api/auth/login    → { token, user }
  GET  /api/wallet        → wallet snapshot + quick stats
  GET  /api/products      → catalogue (Free Fire diamonds, gift cards, memberships)
  POST /api/purchase      → mock purchase, debits wallet, returns order
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import uuid4
import os
import hashlib
import hmac
import json
import base64
import threading

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

# --------------------------------------------------------------------
# Config & in-memory state
# --------------------------------------------------------------------
JWT_SECRET = os.environ.get("JWT_SECRET", "aurum-dev-secret-change-me")
JWT_EXPIRES_SECONDS = 60 * 60 * 12  # 12h

# Seed users (single demo admin). Passwords are hashed at boot.
def _hash_password(plain: str) -> str:
    return hashlib.sha256(plain.encode("utf-8")).hexdigest()

USERS = {
    "admin@premiumdigital.com": {
        "id": "u_admin",
        "name": "Admin",
        "email": "admin@premiumdigital.com",
        "password_hash": _hash_password("admin123"),
        "role": "admin",
    }
}

WALLET = {
    "balance": 1250.00,
    "currency": "USD",
    "updated_at": datetime.now(timezone.utc).isoformat(),
}

PRODUCTS = [
    {"id": "ff-100",  "name": "Free Fire 100 Diamantes",  "description": "Recarga directa al ID del jugador.", "price": 1.50,  "currency": "USD", "category": "freefire"},
    {"id": "ff-310",  "name": "Free Fire 310 Diamantes",  "description": "Diamantes + bonus por compra.",      "price": 4.20,  "currency": "USD", "category": "freefire"},
    {"id": "ff-520",  "name": "Free Fire 520 Diamantes",  "description": "Pack popular para skins y armas.",    "price": 6.80,  "currency": "USD", "category": "freefire"},
    {"id": "ff-1060", "name": "Free Fire 1060 Diamantes", "description": "Ideal para eventos y top-up rápido.", "price": 13.50, "currency": "USD", "category": "freefire"},
    {"id": "ff-2180", "name": "Free Fire 2180 Diamantes", "description": "Pack premium con mayor bonus.",        "price": 26.00, "currency": "USD", "category": "freefire"},
    {"id": "ff-week", "name": "Membresía Semanal FF",     "description": "100 diamantes diarios por 7 días.",    "price": 1.80,  "currency": "USD", "category": "membership"},
    {"id": "ff-month","name": "Membresía Mensual FF",     "description": "Diamantes diarios + bonos mensuales.", "price": 7.50,  "currency": "USD", "category": "membership"},
    {"id": "gp-10",   "name": "Google Play Gift Card $10","description": "Recarga universal para Play Store.",   "price": 9.50,  "currency": "USD", "category": "giftcard"},
    {"id": "gp-25",   "name": "Google Play Gift Card $25","description": "Compras in-app y apps premium.",       "price": 23.80, "currency": "USD", "category": "giftcard"},
    {"id": "it-10",   "name": "iTunes / App Store $10",   "description": "Compras en App Store y Apple Music.",  "price": 9.80,  "currency": "USD", "category": "giftcard"},
    {"id": "az-25",   "name": "Amazon Gift Card $25",     "description": "Saldo Amazon listo para usar.",        "price": 24.00, "currency": "USD", "category": "giftcard"},
    {"id": "psn-20",  "name": "PlayStation Store $20",    "description": "Compras en PS Store y PS Plus.",       "price": 19.50, "currency": "USD", "category": "giftcard"},
]

ORDERS: list[dict] = []

# Aggregate stats counters
STATS = {
    "orders_today": 0,
    "success_count": 0,
    "total_count": 0,
}

LOCK = threading.Lock()

# --------------------------------------------------------------------
# Minimal HS256 JWT (no external deps)
# --------------------------------------------------------------------
def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _b64url_decode(s: str) -> bytes:
    padding = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + padding)

def sign_token(payload: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    h_b64 = _b64url(json.dumps(header, separators=(",", ":")).encode())
    p_b64 = _b64url(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{h_b64}.{p_b64}".encode()
    sig = hmac.new(JWT_SECRET.encode(), signing_input, hashlib.sha256).digest()
    return f"{h_b64}.{p_b64}.{_b64url(sig)}"

def verify_token(token: str) -> dict:
    try:
        h_b64, p_b64, s_b64 = token.split(".")
    except ValueError:
        raise HTTPException(status_code=401, detail="Token inválido")
    signing_input = f"{h_b64}.{p_b64}".encode()
    expected = hmac.new(JWT_SECRET.encode(), signing_input, hashlib.sha256).digest()
    given = _b64url_decode(s_b64)
    if not hmac.compare_digest(expected, given):
        raise HTTPException(status_code=401, detail="Firma de token inválida")
    payload = json.loads(_b64url_decode(p_b64))
    if payload.get("exp") and payload["exp"] < int(datetime.now(timezone.utc).timestamp()):
        raise HTTPException(status_code=401, detail="Token expirado")
    return payload

def require_auth(authorization: Optional[str] = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    token = authorization.split(" ", 1)[1]
    payload = verify_token(token)
    user = USERS.get(payload.get("sub", ""))
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

# --------------------------------------------------------------------
# FastAPI app
# --------------------------------------------------------------------
app = FastAPI(title="Aurum API", version="1.0.0")

cors_origins = os.environ.get("CORS_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins.split(",")] if cors_origins != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------
# Schemas
# --------------------------------------------------------------------
class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)

class PurchaseIn(BaseModel):
    productId: str
    playerId: str = Field(min_length=1, max_length=64)

# --------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "aurum-api", "time": datetime.now(timezone.utc).isoformat()}

@app.post("/api/auth/login")
def login(body: LoginIn):
    user = USERS.get(body.email.lower())
    if not user or user["password_hash"] != _hash_password(body.password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    now = int(datetime.now(timezone.utc).timestamp())
    token = sign_token({
        "sub": user["email"],
        "name": user["name"],
        "role": user["role"],
        "iat": now,
        "exp": now + JWT_EXPIRES_SECONDS,
    })
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]},
    }

@app.get("/api/wallet")
def get_wallet(_user=Depends(require_auth)):
    with LOCK:
        success_rate = (
            round((STATS["success_count"] / STATS["total_count"]) * 100, 1)
            if STATS["total_count"] > 0 else 100.0
        )
        return {
            "balance": round(WALLET["balance"], 2),
            "currency": WALLET["currency"],
            "updated_at": WALLET["updated_at"],
            "stats": {
                "orders_today": STATS["orders_today"],
                "success_rate": success_rate,
                "active_products": len(PRODUCTS),
            },
        }

@app.get("/api/products")
def get_products(_user=Depends(require_auth)):
    return {"products": PRODUCTS}

@app.post("/api/purchase")
def purchase(body: PurchaseIn, _user=Depends(require_auth)):
    product = next((p for p in PRODUCTS if p["id"] == body.productId), None)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    with LOCK:
        if WALLET["balance"] < product["price"]:
            raise HTTPException(status_code=402, detail="Saldo insuficiente para esta compra")

        WALLET["balance"] = round(WALLET["balance"] - product["price"], 2)
        WALLET["updated_at"] = datetime.now(timezone.utc).isoformat()

        STATS["orders_today"] += 1
        STATS["total_count"] += 1
        STATS["success_count"] += 1

        order = {
            "id": uuid4().hex,
            "product_id": product["id"],
            "product_name": product["name"],
            "player_id": body.playerId,
            "amount": product["price"],
            "currency": product["currency"],
            "status": "success",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        ORDERS.insert(0, order)

    return {"order": order, "wallet": {"balance": WALLET["balance"], "currency": WALLET["currency"]}}

@app.get("/api/orders")
def list_orders(_user=Depends(require_auth)):
    return {"orders": ORDERS[:50]}
