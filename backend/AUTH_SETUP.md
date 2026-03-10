# Authentication System Setup Guide

This guide explains how to set up and use the JWT-based authentication system with email OTP verification.

## Features

- User registration (signup) with email and username
- User login (signin) with JWT token generation
- Email verification via OTP (One-Time Password)
- Password hashing using bcrypt
- JWT token-based authentication
- Resend OTP functionality

## Database Setup

### 1. Configure Database Connection

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration (PostgreSQL)
POSTGRES_SERVER=localhost
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DB=kuantra
POSTGRES_PORT=5432

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email SMTP Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_EMAIL=your-email@gmail.com
OTP_EXPIRE_MINUTES=10
```

**Note:** If you're using Gmail, you'll need to:
1. Enable 2-factor authentication
2. Generate an "App Password" from your Google Account settings
3. Use that app password as `SMTP_PASSWORD`

### 2. Run Database Migrations

After configuring your database, run the Alembic migrations:

```bash
# Create the database tables
alembic upgrade head
```

If you need to create a new migration after making model changes:

```bash
# Generate a new migration
alembic revision --autogenerate -m "description of changes"

# Apply the migration
alembic upgrade head
```

## API Endpoints

### 1. Sign Up

**Endpoint:** `POST /api/v1/auth/signup`

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for verification code.",
  "user_id": 1,
  "email": "john.doe@example.com"
}
```

### 2. Sign In

**Endpoint:** `POST /api/v1/auth/signin`

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john.doe@example.com",
    "is_verified": true
  }
}
```

**Note:** Users must verify their email before they can sign in.

### 3. Verify Email

**Endpoint:** `POST /api/v1/auth/verify-email`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "otp_code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### 4. Resend OTP

**Endpoint:** `POST /api/v1/auth/resend-otp`

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP code resent successfully. Please check your email."
}
```

## Using JWT Tokens

After signing in, you'll receive a JWT access token. Include this token in the `Authorization` header for protected endpoints:

```
Authorization: Bearer <your-access-token>
```

## Architecture

The authentication system follows a clean architecture pattern:

- **Models** (`app/db/models.py`): SQLAlchemy models for User and OTP
- **Schemas** (`app/api/v1/schemas/auth.py`): Pydantic models for request/response validation
- **Services** (`app/services/auth_service.py`): Business logic for authentication operations
- **Endpoints** (`app/api/v1/endpoints/auth.py`): FastAPI route handlers that call service methods
- **Utilities**:
  - `app/utils/jwt.py`: JWT token creation and verification
  - `app/utils/password.py`: Password hashing and verification
  - `app/utils/otp.py`: OTP generation and validation
- **Email Service** (`app/services/email_service.py`): SMTP email sending functionality

## Development Notes

- If SMTP is not configured, the system will log email content to console instead of sending
- The system falls back to SQLite if PostgreSQL is not configured (for development)
- OTP codes expire after 10 minutes (configurable via `OTP_EXPIRE_MINUTES`)
- JWT tokens expire after 30 minutes (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)

## Testing

You can test the endpoints using curl, Postman, or any HTTP client:

```bash
# Sign up
curl -X POST "http://localhost:8000/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "testpass123"}'

# Verify email (use OTP from email or console)
curl -X POST "http://localhost:8000/api/v1/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "otp_code": "123456"}'

# Sign in
curl -X POST "http://localhost:8000/api/v1/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass123"}'
```
