# URL Shortener API

A backend-only URL shortener built with Node.js, Express.js, MongoDB and Redis.

The project provides user authentication, URL management, expiration, email verification, password reset and Redis-based rate limiting.

## Features

- JWT authentication using HttpOnly cookies
- User registration, login and logout
- Email verification with OTP
- Password reset with OTP
- Create, view and delete shortened URLs
- Unique short URL generation
- URL expiration
- User-based URL ownership
- Redis token-bucket rate limiting
- Public short URL redirection
- REST API

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- Redis
- JWT
- bcrypt
- Nodemailer
- nanoid
- Postman

## Project Structure

```text
src/
├── configs/
├── controllers/
├── middlewares/
├── models/
├── routes/
└── server/
```

## Setup

Clone the repository:

```bash
git clone <repository-url>
cd urlshortner
npm install
```

Create a `.env` file:

```env
PORT=4000
MONGODB_URI=<mongodb-uri>
REDIS_URI=<redis-uri>
JWT_SECRET=<jwt-secret>
EMIAL_FROM=<your-verified-email>
EMAIL_HOST=<smtp-host>
EMAIL_USER=<smtp-user>
EMAIL_PASS=<smtp-password>
```

Run the development server:

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:4000
```

## Main API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/verify` | Request verification OTP |
| PUT | `/api/auth/verify` | Verify email |
| POST | `/api/auth/forgot-password` | Request password reset OTP |
| PATCH | `/api/auth/reset-password` | Reset password |
| POST | `/api/url` | Create short URL |
| GET | `/api/user/urls` | Get user's URLs |
| GET | `/api/url/:slug` | Redirect to original URL |
| DELETE | `/api/url/:slug` | Delete short URL |

## Future Improvements

- Search, filtering and pagination
- URL analytics
- Automated API tests
- Swagger/OpenAPI documentation
- Docker deployment
