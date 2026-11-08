# Platform Overview & System Specification: NexusOTP (turfsyOTPs)

High-performance, enterprise-grade transactional messaging and OTP delivery infrastructure engineered for Indian developers, startups, and high-volume platforms.

---

## 1. Executive Summary

NexusOTP (branded in interface as turfsyOTPs) is a developer-first Communication Platform as a Service (CPaaS) designed for high-throughput, low-latency One-Time Password (OTP) dispatches and transactional SMS delivery. The system provides a unified HTTP REST API that bridges customer applications directly to Tier-1 telecom routes while handling real-time micro-billing, cryptographic API key authentication, dynamic tiered volume pricing, Razorpay payment processing, and immutable ledger accounting.

---

## 2. Technical Architecture & Tech Stack

### Frontend Architecture
- **Framework**: React 19 with TypeScript.
- **Build Tool**: Vite with production tree-shaking, fast HMR, and optimized static asset packaging.
- **Iconography**: Lucide Icons (clean, context-appropriate iconography; zero emojis used anywhere across the user interface).
- **Design System**: Bespoke, high-contrast typography and layout system adhering to professional UI/UX standards:
  - Responsive layouts supporting desktop, tablet, and mobile devices.
  - Dedicated mobile bottom navigation bar and slide-out navigation drawer.
  - Skeletons and zero-layout-shift loading placeholders for all views.
  - Accessible focus outlines, explicit hover/active states, and error handling.

### Backend Architecture
- **Runtime**: Node.js with TypeScript in strict mode.
- **Web Framework**: Express with modular router separation and centralized error handling.
- **Validation**: Zod schema parsing for runtime request verification and input sanitization.
- **Security Infrastructure**:
  - Helmet for HTTP response security headers.
  - Cross-Origin Resource Sharing (CORS) with strict domain whitelisting.
  - Express Rate Limiting: dual-layer throttling (global window limit + strict brute-force protection on authentication routes).
  - Cryptographic verification via Node.js native `crypto` module (HMAC SHA-256 for payment signatures, SHA-256 for API keys).

### Database & Storage Architecture
- **Engine**: PostgreSQL hosted on Neon Serverless.
- **Connection Management**: `pg.Pool` connection pooling with resilient public DNS fallback resolver to avoid cloud endpoint connection drops.
- **Transaction Safety**: Strict ACID compliance using `BEGIN / COMMIT / ROLLBACK` transactions and row-level locks (`SELECT ... FOR UPDATE`) to guarantee zero balance double-spending during concurrent API dispatches.
- **Indexing Strategy**: Scalable B-Tree composite and partial indexes built to maintain sub-millisecond query performance as datasets scale into hundreds of millions of records.

### External Integrations
- **SMS Carrier Network**: Direct telecom route integration via Fast2SMS with sub-second dispatch latency, delivery verification, and automated failure handling.
- **Payment Processing**: Live Razorpay Payment Gateway integration supporting UPI, Net Banking, Credit/Debit cards, and Corporate Banking.

---

## 3. Database Schema & Data Modeling

### 1. `users` Table
Stores registered platform accounts:
- `id` (UUID, Primary Key, auto-generated via `gen_random_uuid()`)
- `email` (VARCHAR(255), UNIQUE, indexed)
- `password_hash` (VARCHAR(255), bcrypt salted hash)
- `full_name` (VARCHAR(255))
- `company_name` (VARCHAR(255), optional)
- `status` (VARCHAR(50), default 'active', indexed)
- `email_verified` (BOOLEAN, default TRUE)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2. `wallets` Table
Maintains real-time user credit balances with strict integrity constraints:
- `id` (UUID, Primary Key)
- `user_id` (UUID, UNIQUE, references `users.id` with CASCADE delete)
- `balance` (NUMERIC(14, 4), default 0.0000, `CHECK (balance >= 0)` constraint preventing negative float)
- `currency` (VARCHAR(10), default 'INR')
- `otp_rate` (NUMERIC(8, 4), default 0.7500, active cost per OTP)
- `active_tier` (VARCHAR(50), default 'TIER_1', currently unlocked pricing tier)
- `highest_topup` (NUMERIC(14, 4), default 0.0000, tracks lifetime highest top-up for tier retention)
- `version` (BIGINT, default 1, optimistic locking identifier)
- `updated_at` (TIMESTAMPTZ)

### 3. `wallet_transactions` Table
Immutable, append-only financial ledger of every balance change:
- `id` (UUID, Primary Key)
- `wallet_id` (UUID, references `wallets.id`)
- `user_id` (UUID, references `users.id`)
- `type` (VARCHAR(50), 'TOPUP', 'OTP_DEBIT', 'OTP_REFUND', 'CREDIT', 'DEBIT')
- `amount` (NUMERIC(14, 4), transaction value)
- `balance_before` (NUMERIC(14, 4), snapshot before atomic operation)
- `balance_after` (NUMERIC(14, 4), snapshot after atomic operation)
- `applicable_rate` (NUMERIC(8, 4), active rate applied to transaction)
- `reference_type` (VARCHAR(50), 'PAYMENT', 'OTP_DEDUCTION', 'OTP_REFUND')
- `reference_id` (VARCHAR(255), payment ID or dispatch transaction ID)
- `description` (TEXT, audit explanation)
- `created_at` (TIMESTAMPTZ, indexed with `user_id` in descending order)

### 4. `api_keys` Table
Manages developer API authentication credentials:
- `id` (UUID, Primary Key)
- `user_id` (UUID, references `users.id`)
- `name` (VARCHAR(100), user-defined key label)
- `key_prefix` (VARCHAR(30), public identifier, e.g., `sk_live_a1b2`)
- `key_hash` (VARCHAR(64), UNIQUE, SHA-256 hash of secret key)
- `status` (VARCHAR(20), default 'active', 'revoked')
- `rate_limit_per_min` (INT, default 120)
- `last_used_at` (TIMESTAMPTZ, null until first API call)
- `created_at` (TIMESTAMPTZ)

### 5. `otp_transactions` Table
Logs all transactional OTP requests:
- `id` (UUID, Primary Key)
- `user_id` (UUID, references `users.id`)
- `api_key_id` (UUID, nullable, references `api_keys.id`)
- `phone_masked` (VARCHAR(30), privacy-compliant representation, e.g., `98******10`)
- `phone_hash` (VARCHAR(64), SHA-256 hash for repeat fraud detection)
- `cost_incurred` (NUMERIC(10, 4), base carrier cost)
- `gst_amount` (NUMERIC(10, 4), 18% GST component)
- `service_fee` (NUMERIC(10, 4), service surcharge component)
- `total_charged` (NUMERIC(10, 4), total amount deducted from wallet)
- `provider_name` (VARCHAR(50), carrier pipeline descriptor)
- `provider_ref_id` (VARCHAR(150), upstream carrier tracking reference)
- `status` (VARCHAR(30), default 'SENT', 'DELIVERED', 'FAILED', 'REFUNDED')
- `delivery_code` (VARCHAR(50))
- `error_message` (TEXT, carrier response upon delivery failure)
- `created_at` (TIMESTAMPTZ, indexed with `user_id`)

### 6. `payments` Table
Tracks all Razorpay top-up transactions:
- `id` (UUID, Primary Key)
- `user_id` (UUID, references `users.id`)
- `razorpay_order_id` (VARCHAR(100), UNIQUE)
- `razorpay_payment_id` (VARCHAR(100), UNIQUE, populated upon verification)
- `razorpay_signature` (VARCHAR(255), HMAC SHA-256 signature)
- `amount` (NUMERIC(14, 4), total payable amount charged via gateway)
- `credit_amount` (NUMERIC(14, 4), net wallet top-up added to balance)
- `gst_amount` (NUMERIC(14, 4), 18% GST)
- `service_fee_amount` (NUMERIC(14, 4), 2% service charge)
- `currency` (VARCHAR(10), default 'INR')
- `status` (VARCHAR(30), 'PENDING', 'SUCCESS', 'FAILED')
- `idempotency_key` (VARCHAR(100), UNIQUE)
- `raw_webhook_data` (JSONB)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 7. `notifications` Table
Powers the persistent server-side notification feed:
- `id` (UUID, Primary Key)
- `user_id` (UUID, references `users.id`)
- `title` (VARCHAR(150))
- `message` (TEXT)
- `type` (VARCHAR(50), 'system', 'wallet', 'warning', 'security', 'otp')
- `action_url` (VARCHAR(255), nullable)
- `action_label` (VARCHAR(100), nullable)
- `is_read` (BOOLEAN, default FALSE)
- `is_dismissed` (BOOLEAN, default FALSE)
- `metadata` (JSONB, nullable)
- `created_at` (TIMESTAMPTZ)
- Indexes:
  - `idx_notifications_user_active_created` on `(user_id, is_dismissed, created_at DESC)`
  - Partial index `idx_notifications_user_unread` on `(user_id, is_read)` where `is_dismissed = FALSE`

### 8. `support_tickets` & `support_messages` Tables
In-app customer support desk:
- `support_tickets`:
  - `id` (UUID, Primary Key)
  - `ticket_number` (VARCHAR(20), UNIQUE, formatted as `TKT-XXXXXX`)
  - `user_id` (UUID, references `users.id`)
  - `subject` (VARCHAR(255))
  - `category` (VARCHAR(50), 'billing', 'otp_delivery', 'api_integration', 'account', 'general')
  - `status` (VARCHAR(30), 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')
  - `priority` (VARCHAR(20), 'LOW', 'MEDIUM', 'HIGH', 'URGENT')
  - `last_message_at`, `created_at`, `updated_at` (TIMESTAMPTZ)
- `support_messages`:
  - `id` (UUID, Primary Key)
  - `ticket_id` (UUID, references `support_tickets.id`)
  - `sender_id` (UUID, references `users.id`)
  - `sender_role` (VARCHAR(20), 'user')
  - `message` (TEXT)
  - `is_read` (BOOLEAN, default FALSE)
  - `created_at` (TIMESTAMPTZ)

---

## 4. Pricing System & Dynamic Tiers

The platform operates on a volume-based discount model where top-up amounts unlock lower rates per dispatched OTP. 100% of the top-up amount is credited directly to the user's wallet.

### Tier Structure:
1. **Starter Tier**:
   - Top-up range: ₹100 – ₹499
   - Rate: ₹0.75 per OTP
   - Designed for prototyping and small-scale testing.
2. **Growth Tier**:
   - Top-up range: ₹500 – ₹1,999
   - Rate: ₹0.72 per OTP
   - Designed for emerging applications and active user acquisition.
3. **Scale Tier**:
   - Top-up range: ₹2,000 – ₹4,999
   - Rate: ₹0.68 per OTP
   - Designed for production SaaS platforms and web shops.
4. **Business Tier**:
   - Top-up range: ₹5,000 – ₹9,999
   - Rate: ₹0.64 per OTP
   - Designed for established digital companies with steady traffic.
5. **Enterprise Tier**:
   - Top-up range: ₹10,000+
   - Rate: ₹0.60 per OTP
   - Lowest rate per OTP for mission-critical operations and large user bases.

### Billing Formula at Checkout:
- Net Top-up Amount: 100% added to wallet float (e.g., ₹1,000.00).
- GST: 18% statutory tax (₹180.00).
- Service Fee: 2% gateway processing charge (₹20.00).
- Total Payable: Net Amount + GST + Service Fee (₹1,200.00).

---

## 5. Core Platform Features & User Pages

### 1. Landing Page (`LandingPageView.tsx`)
- High-impact hero section showcasing real product value and platform SLA (99.8% delivery SLA, sub-second latency).
- Live interactive cURL code preview with one-click clipboard copying.
- Tiered volume pricing matrix highlighting savings per tier.
- Step-by-step onboarding walkthrough ("Create Account", "Add Wallet Float", "Generate API Key", "Send OTPs in 3 Lines of Code").
- Live system status badge confirming carrier network health.
- Footer with direct links to Legal Terms, Privacy Policy, Acceptable Use, and Refund Policy.

### 2. User Authentication (`AuthView.tsx`, `ResetPasswordView.tsx`, `AuthModal.tsx`)
- Registration with Full Name, Email, Password, and optional Company Name.
- Login with password hashing verification via bcrypt.
- Password reset request and confirmation workflows.
- Stateless authentication using JSON Web Tokens (JWT) stored in browser storage.
- Automatic session hydration on app load.

### 3. Dashboard (`DashboardView.tsx`)
- Real-time balance card displaying available funds, currency, and active rate per OTP.
- Tier progression widget showing the exact amount needed in the next recharge to unlock a cheaper rate.
- KPI summary cards: Total Dispatched OTPs, Delivery Success Rate, and Monthly Spend.
- Recent OTP dispatch log preview with live delivery statuses.
- Quick actions: Top Up Wallet, Copy API Key, and Launch Interactive Testing Playground.

### 4. Wallet & Recharge (`WalletView.tsx`, `WalletRechargeModal.tsx`, `InvoiceModal.tsx`)
- Minimum recharge: ₹100.
- Interactive recharge modal with preset buttons (₹100, ₹500, ₹2,000, ₹5,000, ₹10,000) and custom input.
- Real-time tax and fee breakdown (Base Credit, 18% GST, 2% Service Fee, Total Payable).
- Seamless Razorpay Checkout modal supporting UPI QR, Google Pay, PhonePe, Net Banking, and Cards.
- Server-side cryptographic payment verification (`/api/v1/wallet/verify-payment`) using HMAC SHA-256 signatures before crediting funds.
- Complete immutable transaction ledger with pagination, type filtering (`TOPUP`, `OTP_DEBIT`, `OTP_REFUND`), date formatting, and reference IDs.
- Tax Invoice generator (`InvoiceModal.tsx`): Generates GST-compliant tax invoices with SAC Code 9984, GSTIN placeholder, bill-to details, line items, and print/download capabilities.

### 5. Interactive OTP Playground (`SendOtpView.tsx`)
- Built-in developer testing console for live dispatches.
- Inputs for 10-digit Indian recipient mobile number and custom OTP code.
- Interactive API key selector from active user keys.
- Real-time execution output showing carrier response, latency in milliseconds, debited balance, and recipient mask.
- Pre-built code samples in cURL, Node.js (Axios / Fetch), Python (Requests), PHP (cURL), and Go.

### 6. API Key Management (`ApiKeysView.tsx`)
- Create new API keys with custom labels and per-minute rate limits (10 to 600 req/min).
- Secure key generation: Raw secret key (`sk_live_...`) is generated with high entropy and presented strictly once at creation time.
- SHA-256 hash storage: Secret keys are never stored in plain text.
- Key prefix visibility (`sk_live_xxxx...`) for identification and audits.
- Instant permanent key revocation button.

### 7. Delivery Logs & Transactions (`TransactionsView.tsx`)
- Full audit log of every OTP dispatch initiated from API or web console.
- Search by transaction ID or masked recipient phone number.
- Filter by status (`ALL`, `SENT`, `DELIVERED`, `FAILED`, `REFUNDED`).
- Detailed metadata drawer showing dispatch timestamp, latency in ms, cost deducted, carrier delivery status code, and error details if rejected.

### 8. Analytics & SLA Monitoring (`AnalyticsView.tsx`)
- Graphical volume trends over time.
- Delivery success vs. failure ratios.
- Average carrier dispatch latency.
- Daily credit consumption metrics.

### 9. Dynamic Notification Center (`Header.tsx`)
- Server-backed persistent alert feed.
- Automatic system alerts triggered on wallet recharges, low balance thresholds (< ₹50), API key creation, and API key revocation.
- Real-time unread notification badge on the bell icon.
- Read / unread toggle and individual item dismissal.
- "Clear all" action permanently sets `is_dismissed = TRUE` in the database, ensuring cleared notifications never reappear upon reload or logout.

### 10. Support Desk (`SupportView.tsx`)
- Submit support tickets categorized under Billing, OTP Delivery, API Integration, Account, or General.
- Set priority level (Low, Medium, High, Urgent).
- Threaded conversational message view with real-time refresh.
- Ticket status tracking (Open, In Progress, Resolved, Closed).

### 11. Legal & Regulatory Center (`LegalView.tsx`)
- **Terms of Service**: Commercial terms, payment terms, account obligations, and limitation of liability.
- **Privacy Policy**: DPDP Act compliance, data retention periods, phone number hashing, and encryption policies.
- **Acceptable Use Policy (AUP)**: Strict prohibition of unsolicited marketing, phishing, gambling, abusive traffic, or spam; mandatory consent requirements.
- **Refund Policy**: Terms regarding failed dispatches (automatic real-time wallet float refunds) and account termination.

---

## 6. Public REST API Specification

Base Production URL: `https://apinexusotp.vercel.app/api/v1`

### 1. Authentication Headers
All developer API requests require standard Bearer token authorization:
```http
Authorization: Bearer sk_live_your_secret_api_key
Content-Type: application/json
```

### 2. Dispath OTP (`POST /otp/send`)
Dispatches a one-time password to an Indian mobile number.
- **Endpoint**: `POST /api/v1/otp/send`
- **Request Body**:
```json
{
  "phone": "9876543210",
  "otp": "482910"
}
```
- **Validation Rules**:
  - `phone`: 10-digit Indian mobile number (optionally prefixed with `+91` or `91`).
  - `otp`: 4 to 8 digit numeric or alphanumeric code.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "transaction_id": "TXN_1711234567890_a1b2c3d4",
  "message": "OTP request accepted and dispatched to carrier network.",
  "recipient": "98******10",
  "latency_ms": 138,
  "rate_charged": 0.72,
  "remaining_balance": 1428.56
}
```
- **Error Codes**:
  - `400 Bad Request`: `INVALID_PHONE_NUMBER`, `INVALID_OTP_FORMAT`
  - `401 Unauthorized`: `INVALID_API_KEY`, `REVOKED_API_KEY`
  - `402 Payment Required`: `INSUFFICIENT_WALLET_BALANCE` (Top-up required)
  - `429 Too Many Requests`: `RATE_LIMIT_EXCEEDED`
  - `502 Bad Gateway`: `CARRIER_DISPATCH_FAILED` (Balance automatically refunded)

### 3. Public Pricing & Tier Data (`GET /pricing`)
Returns current system pricing rules, active volume tiers, and platform settings.
- **Endpoint**: `GET /api/v1/pricing`
- **No authentication required**.
- **Response**:
```json
{
  "success": true,
  "pricing": {
    "provider_base_cost": 0.15,
    "gst_percentage": 18,
    "service_charge_percentage": 2
  },
  "tiers": [
    { "name": "Starter Tier", "minTopup": 100, "maxTopup": 499, "otpPrice": 0.75, "label": "₹100 – ₹499" },
    { "name": "Growth Tier", "minTopup": 500, "maxTopup": 1999, "otpPrice": 0.72, "label": "₹500 – ₹1,999" },
    { "name": "Scale Tier", "minTopup": 2000, "maxTopup": 4999, "otpPrice": 0.68, "label": "₹2,000 – ₹4,999" },
    { "name": "Business Tier", "minTopup": 5000, "maxTopup": 9999, "otpPrice": 0.64, "label": "₹5,000 – ₹9,999" },
    { "name": "Enterprise Tier", "minTopup": 10000, "maxTopup": null, "otpPrice": 0.60, "label": "₹10,000+" }
  ],
  "settings": {
    "minTopup": 100,
    "defaultGst": 18
  }
}
```

---

## 7. Security, Compliance & Resiliency Measures

1. **Race Condition Prevention**:
   - Every wallet debit runs inside a PostgreSQL transaction using `SELECT id, balance, otp_rate FROM wallets WHERE user_id = $1 FOR UPDATE`. This row-level lock ensures that concurrent dispatches across multiple threads or servers cannot cause negative balances or double-spend conditions.
2. **Cryptographic Integrity**:
   - Razorpay orders and webhook dispatches are validated using SHA-256 HMAC digest comparisons (`crypto.createHmac('sha256', secret)`).
   - API keys are hashed with SHA-256 before storage; the raw key is never stored in any database table or log file.
3. **Data Privacy & Telephony Masking**:
   - Customer phone numbers are masked (`98******10`) in database logs and interface tables to satisfy Indian DPDP and privacy standards.
   - A separate cryptographic SHA-256 hash (`phone_hash`) is indexed to allow duplicate detection without persisting raw telephone numbers.
4. **Automated Refund on Failure**:
   - If an upstream carrier gateway returns a non-200 code or rejects an accepted payload, the platform initiates an automated balance refund (`OTP_REFUND`) back to the user's wallet with ledger entry logging.
5. **Multi-Region & Cloud Failover**:
   - Neon serverless connection with resilient DNS resolution (`8.8.8.8`, `1.1.1.1`, `8.8.4.4`) to prevent local DNS timeouts on cloud servers.

