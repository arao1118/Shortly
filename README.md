# Shortly — Full-Stack URL Shortener

A single-package full-stack URL shortener built from the original **urlshortner backend** and the **Shortly React frontend**.

## Architecture

The project intentionally uses **one root `package.json`, one `package-lock.json`, and one `node_modules/`**. There are no separate frontend/backend npm projects.

```text
shortly/
├── src/                       # React + Vite frontend
│   ├── components/
│   ├── lib/
│   ├── pages/
│   ├── main.jsx
│   └── styles.css
├── configs/                   # MongoDB, Redis, Nodemailer
├── controllers/               # Express controllers
├── middlewares/               # JWT + rate limiting middleware
├── models/                    # Mongoose models
├── routes/                    # Express routes
├── server/
│   └── server.js              # Express entry point
├── docs/
│   └── API.md                 # Complete API reference
├── index.html                 # Vite entry HTML
├── vite.config.js
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

### Why this structure?

- `src/` is the frontend source, not a nested `public/` application.
- `server/` is only the Node/Express entry point; backend modules stay at the project root.
- MongoDB, Redis, email, authentication, URL management and React all belong to the same application.
- `npm install` from the root creates the only `node_modules/`.
- In development, Vite runs on `5173` and proxies `/api` to Express on `4000`.
- In production, Express serves the Vite `dist/` build, so the UI and API use the same origin.

## Tech stack

- React
- Vite
- React Router
- Lucide React
- Node.js
- Express 5
- MongoDB + Mongoose
- Redis
- JWT in an HTTP-only cookie
- bcryptjs
- Nodemailer
- nanoid
- CORS

## Setup

### 1. Create environment variables

```bash
cp .env.example .env
```

Fill in your MongoDB, JWT, SMTP and Redis values.

### 2. Install everything once

From the project root:

```bash
npm install
```

This creates **one** `node_modules/` directory.

### 3. Development

```bash
npm run dev
```

This starts:

- React/Vite: `http://localhost:5173`
- Express API: `http://localhost:4000`

Open `http://localhost:5173` in the browser.

### 4. Run only one side

```bash
npm run dev:client
npm run dev:server
```

### 5. Production

```bash
npm run build
npm start
```

Express serves the generated `dist/` directory and the API from the same server.

## Authentication

The backend issues a JWT in an HTTP-only cookie named `token`. The React API helper uses `credentials: 'include'` for every request, so protected endpoints automatically receive the cookie.

The frontend also stores the non-sensitive `userInfo` returned by authentication in `localStorage` for UI state. The JWT itself is **not** stored in localStorage.

## API

The complete endpoint reference, including request bodies, query/path parameters, authentication requirements, success responses, errors and current implementation quirks is in [`docs/API.md`](docs/API.md).

### Endpoint overview

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register a user and issue JWT cookie |
| POST | `/api/auth/login` | No | Log in a verified user |
| POST | `/api/auth/logout` | Yes | Clear JWT cookie |
| POST | `/api/auth/verify` | No | Send email-verification OTP |
| PUT | `/api/auth/verify` | No | Verify email OTP |
| POST | `/api/auth/forgot-password` | No | Send password-reset OTP |
| PATCH | `/api/auth/reset-password` | No | Reset password with OTP |
| DELETE | `/api/auth/delete-user` | Yes | Delete authenticated account |
| POST | `/api/url` | Yes | Create short URL |
| GET | `/api/url?originalURL=...` | Yes | Look up an owned URL by original URL |
| GET | `/api/url/:slug` | No | Public redirect to original URL |
| DELETE | `/api/url/:slug` | Yes | Delete an owned short URL |
| GET | `/api/user/urls` | Yes | List authenticated user's URLs |
| GET | `/api/test` | No | Rate-limit test endpoint |

## Important implementation details preserved from the original backend

- Short codes are 7-character `nanoid` values.
- URL ownership is enforced through the authenticated user's `_id`.
- Link expiration is calculated from `expirationDuration` in milliseconds.
- Public redirects are rate-limited by IP using Redis.
- Protected operations are rate-limited by user ID using Redis.
- Verification and password-reset OTPs expire after 5 minutes.
- JWTs expire after 30 minutes.
- Passwords are hashed with bcryptjs.

This merge keeps the backend behavior rather than silently replacing it with the separate backend that was bundled inside `shortly.zip`.
