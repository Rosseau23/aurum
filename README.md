# Aurum — Premium Digital Reseller

Plataforma profesional para la reventa de productos digitales: **diamantes Free Fire**, **pines de juegos**, **gift cards** y memberships, con interfaz premium tipo dashboard SaaS y arquitectura modular lista para escalar.

## Stack

- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript ES6 (modular, sin frameworks pesados)
- **Backend (producción)**: Node.js + Express + JWT — `backend/server.js`
- **Backend (espejo)**: FastAPI — `backend/server.py` *(idéntico API surface, usado por el preview de Emergent)*
- **Auth**: JWT (HS256), credenciales hash SHA‑256
- **Datos**: mocks realistas (intercambiables por tu proveedor real vía proxy backend)

## Estructura

```
/
├── frontend/
│   ├── package.json            # yarn start → serve estático en :3000
│   └── public/
│       ├── index.html
│       ├── css/
│       │   ├── variables.css   # design tokens (negro mate, cobre, dorado)
│       │   ├── main.css        # base + navbar + layout
│       │   ├── components.css  # botones, cards, modal, toasts
│       │   └── responsive.css
│       └── js/
│           ├── config.js       # API_BASE resolver
│           ├── api.js          # cliente HTTP + JWT
│           ├── auth.js         # login/logout
│           ├── wallet.js       # obtenerSaldo()
│           ├── products.js     # cargarProductos() + filtros
│           ├── purchase.js     # procesarCompra() + modal
│           ├── toast.js        # notificaciones
│           └── app.js          # entry point
│
└── backend/
    ├── server.js               # Express principal (PRODUCCIÓN)
    ├── server.py               # FastAPI espejo (preview Emergent)
    ├── package.json
    ├── .env.example
    ├── routes/
    │   ├── auth.js
    │   ├── wallet.js
    │   ├── products.js
    │   ├── purchase.js
    │   └── orders.js
    ├── middleware/
    │   └── auth.js             # JWT verify
    └── data/
        └── state.js            # mocks + estado en memoria
```

## Endpoints

| Método | Ruta                | Auth | Descripción                              |
|--------|---------------------|------|------------------------------------------|
| GET    | `/api/health`       | —    | Heartbeat                                |
| POST   | `/api/auth/login`   | —    | `{ email, password } → { token, user }`  |
| GET    | `/api/wallet`       | JWT  | Saldo + stats (órdenes hoy, success, etc)|
| GET    | `/api/products`     | JWT  | Catálogo                                 |
| POST   | `/api/purchase`     | JWT  | `{ productId, playerId }` → orden        |
| GET    | `/api/orders`       | JWT  | Historial (últimas 50)                   |

## Quick start (local)

### 1) Backend — Node/Express

```bash
cd backend
cp .env.example .env
# edita JWT_SECRET
npm install        # o: yarn
npm start          # http://localhost:4000
```

### 2) Frontend

Servimos `frontend/public` como sitio estático.

```bash
cd frontend
npm install
npm start          # http://localhost:3000
```

Para apuntar el frontend al backend Node local en :4000, abre la consola del navegador y antes de cargar:

```js
window.__ENV__ = { API_BASE: "http://localhost:4000" };
```

O sirve ambos detrás del mismo proxy / mismo dominio en producción (recomendado).

## Credenciales de demostración

```
email:    admin@premiumdigital.com
password: admin123
```

## Diseño

Paleta inspirada en fintech/SaaS premium (Linear, Stripe, Vercel, Notion Dark):

| Token         | Valor       | Uso                                   |
|---------------|-------------|---------------------------------------|
| `--bg-0`      | `#0a0a0b`   | Fondo principal (negro mate)          |
| `--bg-2`      | `#16161a`   | Superficies / cards                   |
| `--copper`    | `#b87333`   | Acento metálico cobre                 |
| `--gold`      | `#d4a76a`   | Acento dorado tenue                   |
| `--titanium`  | `#8c8f96`   | Acento gris titanio                   |
| `--text-0`    | `#f5f5f5`   | Texto principal (blanco roto)         |

Tipografía: **Inter** + **Inter Tight** (Google Fonts) + **JetBrains Mono** para IDs.

## Seguridad

- La API Key del proveedor **NUNCA** se expone al frontend. Todas las llamadas al proveedor real deben hacerse en `backend/routes/*.js`, leyendo credenciales desde `.env`.
- JWT firmado con HS256, expira en 12h.
- CORS configurable vía `CORS_ORIGINS`.

## Roadmap

- Integrar proveedor real (sustituir mocks en `data/state.js` + llamadas en `routes/`)
- Persistencia (MongoDB/Postgres)
- Pasarela de pago (Stripe) para que clientes recarguen su wallet
- Roles (reseller / admin)
- Webhooks de confirmación

---

© Aurum Digital. Hecho con precisión.
