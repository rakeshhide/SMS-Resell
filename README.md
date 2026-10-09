# NexusOTP - Enterprise SMS & OTP Reseller Platform

High-performance, enterprise-grade OTP and transactional messaging infrastructure with wallet-based billing, tiered volume pricing, Razorpay payment gateway integration, and carrier API dispatch.

---

## Architecture Overview

NexusOTP is built as a distributed, developer-first communication platform:

- **Frontend**: React 19, TypeScript, Vite, Lucide Icons, Vanilla CSS Design System.
- **Backend**: Node.js, Express, TypeScript, Zod schema validation, REST API.
- **Database**: PostgreSQL (Neon Serverless), Atomic transactions with row-level locking (`SELECT ... FOR UPDATE`), immutable financial ledgers.
- **Payment Gateway**: Live Razorpay integration with server-side HMAC SHA-256 signature verification.
- **SMS Gateway**: Carrier integration via Fast2SMS with retry mechanisms and automatic failure reversals.

---

## Core Capabilities

1. **Wallet-Based Billing & Tiered Pricing**:
   - Minimum top-up: ₹100 (+ 18% GST calculated server-side).
   - Dynamic tier rates based on top-up amount:
     - ₹100 – ₹499: ₹0.75 / OTP (Starter Tier)
     - ₹500 – ₹1,999: ₹0.72 / OTP (Growth Tier)
     - ₹2,000 – ₹4,999: ₹0.68 / OTP (Scale Tier)
     - ₹5,000 – ₹9,999: ₹0.64 / OTP (Business Tier)
     - ₹10,000+: ₹0.60 / OTP (Enterprise Tier)
   - 100% of top-up amount credited directly to wallet float.
   - Atomic debit on successful carrier acceptance; automated refund if delivery fails.

2. **Cryptographic API Key Management**:
   - High-entropy API keys (`sk_live_...`) hashed with SHA-256 in the database.
   - Prefix tracking (`sk_live_xxxx...`) for audit trails.
   - Instant revocation and roll capabilities.

3. **Administration Center**:
   - Comprehensive system analytics, transaction audits, and real-time ledger monitoring.
   - Global tier adjustments and user float management.

---

## Project Structure

```
SMS-Resell/
├── backend/
│   ├── api/index.ts            # Vercel serverless entrypoint
│   ├── src/
│   │   ├── config/             # Database connection & pooling
│   │   ├── controllers/        # OTP, Wallet, Auth, Admin controllers
│   │   ├── database/           # Schema definitions and migrations
│   │   ├── middlewares/        # JWT auth, API key verification, Admin guard
│   │   ├── providers/          # Carrier providers (Fast2SMS)
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # WalletService, BillingService
│   │   ├── utils/              # Cryptographic utilities (HMAC SHA-256, hash)
│   │   └── server.ts           # Core server bootstrap
│   ├── .env.example
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Modals, Header, Sidebar
│   │   ├── services/           # API Client service layer
│   │   ├── views/              # Dashboard, Wallet, Send OTP, Admin, Docs
│   │   └── App.tsx             # Root application orchestrator
│   └── vite.config.ts
└── .gitignore
```

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure your NEON_DB, JWT_SECRET, FAST2SMS_API_KEY, and RAZORPAY credentials in .env
npm run build
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## API Reference

### Send OTP
```http
POST /api/v1/otp/send
Authorization: Bearer sk_live_your_api_key
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "482910"
}
```

### Response
```json
{
  "success": true,
  "transaction_id": "TXN_1711234567890_a1b2c3d4",
  "message": "OTP request accepted and dispatched to carrier network.",
  "recipient": "98******10",
  "latency_ms": 142
}
```

---

## Security Best Practices
- Environment credentials and API secret keys must never be committed to source control.
- All webhook events require cryptographic HMAC signature validation.
- Database access utilizes TLS with SSL mode enforcement.

---

## License
MIT License.
