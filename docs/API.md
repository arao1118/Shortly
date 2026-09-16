# Shortly API Reference

This document describes the **actual routes and response shapes implemented by the retained `urlshortner` backend**. It is intentionally based on the controllers and route definitions rather than on what the frontend happens to call.

## Base URL

Development API:

```text
http://localhost:4000/api
```

When using the Vite development server, the frontend calls `/api/...` and Vite proxies those requests to the API server.

In production, Express serves the React build and the API from the same origin.

## Authentication

Protected routes require the JWT stored in the HTTP-only `token` cookie.

The browser client sends credentials automatically:

```js
fetch('/api/url', {
  credentials: 'include'
});
```

### JWT middleware responses

No cookie:

```json
{
  "error": "Access denied"
}
```

Status: `401 Unauthorized`

Invalid/expired JWT:

```json
{
  "error": "Invalid token"
}
```

Status: `403 Forbidden`

A valid JWT adds the decoded user to `req.user` and continues to the controller.

---

# 1. Authentication

## POST `/api/auth/register`

Creates a user, hashes the password, issues a JWT cookie and returns public user information.

**Auth:** No

### Request body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

| Field | Type | Required | Behavior |
|---|---|---:|---|
| `name` | string | Yes | Trimmed; cannot be empty |
| `email` | string | Yes | Trimmed and lowercased |
| `password` | string | Yes | Minimum 6 characters |

### Success — `201 Created`

```json
{
  "success": true,
  "message": "User registered successfully.",
  "userInfo": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

Also sets the HTTP-only `token` cookie.

### Common errors

`400` for missing/invalid fields.

`409`:

```json
{
  "success": false,
  "message": "User already exists."
}
```

`500` for an internal server error.

---

## POST `/api/auth/login`

Authenticates a user. The account must already be email-verified.

**Auth:** No

### Request body

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

### Success — `200 OK`

```json
{
  "success": true,
  "message": "Logged in successfully.",
  "userInfo": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

Also sets the `token` cookie.

### Errors

- `400` — missing/invalid email or password
- `401` — invalid email or password
- `403` — account email is not verified
- `500` — internal server error

---

## POST `/api/auth/logout`

Clears the authentication cookie.

**Auth:** Yes

### Request

No request body.

### Success — `200 OK`

```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

### Errors

- `401` — missing token cookie
- `403` — invalid token
- `500` — internal server error

---

## POST `/api/auth/verify`

Generates and emails a 6-digit email-verification OTP.

**Auth:** No

### Request body

```json
{
  "email": "john@example.com"
}
```

### Success — `200 OK`

```json
{
  "success": true,
  "message": "OTP has been sent to your registered email account."
}
```

The OTP is not returned in the HTTP response. It is sent by email.

### OTP behavior

- 6 digits
- Expires after 5 minutes
- Stored with `otpContext: "VERIFICATION"`
- Cannot be requested for an already verified account

### Errors

- `400` — missing/invalid email
- `400` — email does not exist
- `400` — account already verified
- `500` — internal server error

---

## PUT `/api/auth/verify`

Verifies the email using the verification OTP.

**Auth:** No

### Request body

The implementation accepts either `otp` or `OTP`. Use `otp` from the frontend.

```json
{
  "email": "john@example.com",
  "otp": 123456
}
```

### Success — `200 OK`

```json
{
  "success": true,
  "message": "Account verification successful."
}
```

### Errors

- `400` — invalid email
- `400` — OTP is not an integer
- `400` — OTP context is not `VERIFICATION`
- `400` — OTP is missing or expired
- `400` — OTP does not match
- `500` — internal server error

---

## POST `/api/auth/forgot-password`

Generates and emails a password-reset OTP.

**Auth:** No

### Request body

```json
{
  "email": "john@example.com"
}
```

### Success — `200 OK`

```json
{
  "success": true,
  "message": "OTP has been sent to your registered email account."
}
```

The OTP is emailed, not returned in the response.

The OTP is stored with `otpContext: "RESET"` and expires after 5 minutes.

### Errors

- `400` — missing/invalid email
- `400` — email does not exist
- `500` — internal server error

---

## PATCH `/api/auth/reset-password`

Validates the password-reset OTP and changes the password.

**Auth:** No

### Request body

```json
{
  "email": "john@example.com",
  "otp": 123456,
  "newPassword": "newSecret123"
}
```

The implementation also accepts `OTP` instead of `otp`.

| Field | Type | Required | Notes |
|---|---|---:|---|
| `email` | string | Yes | Trimmed/lowercased |
| `otp` or `OTP` | number-like | Yes | Must convert to an integer |
| `newPassword` | string | Yes | Must be a non-empty string; the controller's error text says 6+ but it does not explicitly enforce length here |

### Success — `200 OK`

```json
{
  "success": true,
  "message": "Password updated successfully. You can now log in."
}
```

The authentication cookie is cleared after the password change.

### Errors

- `400` — missing email
- `400` — missing/non-string new password
- `400` — invalid OTP
- `400` — user does not exist
- `400` — OTP is not a reset OTP
- `400` — OTP expired
- `400` — OTP does not match
- `500` — internal server error

---

## DELETE `/api/auth/delete-user`

Deletes the currently authenticated account after checking the supplied email and password.

**Auth:** Yes

### Request body

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

### Success — `200 OK`

The current controller returns:

```json
{
  "success": false,
  "message": "User successfully deleted."
}
```

**Important:** the deletion itself succeeds, but `success` is incorrectly set to `false` in the current backend. The frontend treats a successful HTTP response as success and clears local user state.

### Errors

The intended validation paths return `400` for:

- missing email
- missing password
- user not found
- email not matching the authenticated account
- incorrect password

Authentication failures are `401`/`403` from the JWT middleware. Unexpected errors return `500`.

---

# 2. URL Management

## POST `/api/url`

Creates a short URL owned by the authenticated user.

**Auth:** Yes

### Request body

```json
{
  "originalURL": "https://example.com/very/long/path",
  "expirationDuration": 86400000
}
```

| Field | Type | Required | Meaning |
|---|---|---:|---|
| `originalURL` | string | Yes | Trimmed original destination URL |
| `expirationDuration` | number-like | Yes | Duration in milliseconds from creation |

The current controller checks that the duration can be converted to a number. It does not itself reject negative or zero durations, and it does not use a full URL parser.

### Success — `201 Created`

```json
{
  "success": true,
  "message": "Short URL created successfully",
  "data": {
    "_id": "...",
    "originalURL": "https://example.com/very/long/path",
    "slug": "aB3xYz9",
    "user": "...",
    "expiresAt": "2026-09-17T00:00:00.000Z",
    "status": "active",
    "createdAt": "2026-09-16T00:00:00.000Z",
    "updatedAt": "2026-09-16T00:00:00.000Z"
  }
}
```

The exact dates and IDs depend on the database.

### Errors

- `400` — original URL or expiration duration missing
- `400` — expiration duration is not numeric
- `404` — authenticated user does not exist
- `500` — database/other server error

---

## GET `/api/url?originalURL=...`

Looks up an URL owned by the authenticated user using its original URL.

**Auth:** Yes

### Query parameter

```text
originalURL=https%3A%2F%2Fexample.com
```

### Success — `200 OK`

```json
{
  "originalURL": "https://example.com",
  "slug": "aB3xYz9",
  "status": "active"
}
```

### Not found — `400 Bad Request`

```json
{
  "success": false,
  "message": "The URL \"https://example.com\" does not exist for this user."
}
```

### Other error

`500` with `{ "success": false, "message": "..." }`.

---

## GET `/api/url/:slug`

Publicly resolves a short slug and redirects the browser to the original URL.

**Auth:** No

**Rate limit:** Public/IP limiter runs before the controller.

### Path parameter

```text
slug=aB3xYz9
```

### Success — `302 Found`

The response is an HTTP redirect to the value stored in `originalURL`.

There is normally no JSON success body because Express sends a `302` redirect response.

### Expiration behavior

If an active link has passed `expiresAt`, the controller changes its status to `expired` and returns:

`410 Gone`

```json
{
  "success": false,
  "message": "Link has expired"
}
```

An already expired link also returns `410`.

A disabled link returns `403`:

```json
{
  "success": false,
  "message": "Link is temporarily deactivated"
}
```

Unknown slug:

`404`

```json
{
  "success": false,
  "message": "Invalid URL"
}
```

Other non-active states return `400` with the current status.

### Rate-limit response

If the public Redis token bucket has no token:

`429 Too Many Requests`

```json
{
  "success": false,
  "message": "Too many requests. Rate limit exceeded."
}
```

---

## DELETE `/api/url/:slug`

Deletes a short URL only if it belongs to the authenticated user.

**Auth:** Yes

**Rate limit:** Authorized/user limiter runs before the controller.

### Path parameter

```text
slug=aB3xYz9
```

### Request body

None.

### Success — `200 OK`

```json
{
  "success": true,
  "message": "The URL associated with aB3xYz9 has now been deleted."
}
```

### Errors

If the slug is not owned by the authenticated user:

`400`

```json
{
  "success": false,
  "message": "The URL for slug \"aB3xYz9\" does not exist for this user."
}
```

Also possible:

- `401` — missing JWT
- `403` — invalid JWT
- `429` — user rate limit exceeded
- `500` — internal server error

---

# 3. User Resources

## GET `/api/user/urls`

Returns all short URLs belonging to the authenticated user.

**Auth:** Yes

**Rate limit:** Authorized/user limiter runs before the controller.

### Request

No body and no query parameters.

### Success — `200 OK`

```json
[
  {
    "_id": "...",
    "originalURL": "https://example.com",
    "slug": "aB3xYz9",
    "user": "...",
    "expiresAt": "2026-09-17T00:00:00.000Z",
    "status": "active",
    "createdAt": "2026-09-16T00:00:00.000Z",
    "updatedAt": "2026-09-16T00:00:00.000Z"
  }
]
```

The endpoint returns the raw Mongoose documents as a JSON array.

### No links

The current implementation returns `400`:

```json
{
  "message": "User has not created any short links"
}
```

A `200` response with `[]` would be more conventional, but this documentation reflects the current code.

### Other errors

- `401` — missing JWT
- `403` — invalid JWT
- `429` — user rate limit exceeded
- `500` — internal server error

---

# 4. Test Endpoint

## GET `/api/test`

Simple endpoint used to test the public Redis rate limiter.

**Auth:** No

**Rate limit:** Public/IP limiter.

### Request

No body.

### Success — `200 OK`

```json
{
  "success": true,
  "message": "Request accepted"
}
```

### Rate-limit failure — `429`

```json
{
  "success": false,
  "message": "Too many requests. Rate limit exceeded."
}
```

---

# Rate limiting

The retained backend has two Redis-backed token buckets.

### Public limiter

Used by:

- `GET /api/url/:slug`
- `GET /api/test`

The bucket key is based on the request IP. Current settings are:

- maximum tokens: `100`
- refill rate: `0.001` token/ms
- equivalent refill rate: `1` token/second

### Authorized limiter

Used by protected URL/user operations:

- `POST /api/url`
- `GET /api/url?originalURL=...`
- `DELETE /api/url/:slug`
- `GET /api/user/urls`

The bucket key is based on the authenticated user ID.

Current settings are:

- maximum tokens: `5`
- refill rate: `0` token/ms
- no refill in the current implementation

Therefore the current authorized limiter behaves as a 5-request bucket that does not refill until its Redis state is removed/reset. This is the behavior of the supplied backend code.

---

# Data models

## User

```text
_id            ObjectId
name           String, required
email          String, required, unique, lowercase, trimmed
password       String, required (bcrypt hash)
verified       Boolean, default false
verifiedAt     Date|null
otp            Number|null
otpContext     "" | "VERIFICATION" | "RESET"
otpExpiredAt   Date|null
createdAt      Date
updatedAt      Date
```

## URL

```text
_id            ObjectId
originalURL    String, required, trimmed
slug           String, required, unique, indexed
user           ObjectId -> User, nullable
expiresAt      Date|null
status         "active" | "expired" | "disabled"
createdAt      Date
updatedAt      Date
```

---

# Frontend-to-API mapping

The merged React frontend currently calls these backend endpoints:

| Frontend action | API request |
|---|---|
| Register | `POST /api/auth/register` |
| Send verification OTP | `POST /api/auth/verify` |
| Verify account | `PUT /api/auth/verify` |
| Login | `POST /api/auth/login` |
| Forgot password | `POST /api/auth/forgot-password` |
| Reset password | `PATCH /api/auth/reset-password` |
| Load dashboard links | `GET /api/user/urls` |
| Create short link | `POST /api/url` |
| Delete short link | `DELETE /api/url/:slug` |
| Open short link | `GET /api/url/:slug` |
| Copy short link | No API call; copies the generated `/api/url/:slug` URL locally |
| Logout | `POST /api/auth/logout` |
| Delete account | `DELETE /api/auth/delete-user` |

The frontend does not currently call `GET /api/url?originalURL=...` or `/api/test`, but those backend endpoints remain available.
