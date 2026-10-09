-- Enterprise OTP & SMS Messaging API Platform Database Schema
-- Scalable for high-volume transactions with proper partitioning-friendly indexes

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'user' | 'admin'
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active' | 'suspended'
    email_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 2. Wallets Table (Strict non-negative constraint)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance NUMERIC(14, 4) NOT NULL DEFAULT 0.0000 CHECK (balance >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    otp_rate NUMERIC(8, 4) NOT NULL DEFAULT 0.7500,
    active_tier VARCHAR(50) NOT NULL DEFAULT 'TIER_1',
    highest_topup NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    version BIGINT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- 3. Immutable Financial Ledger (Wallet Transactions)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'CREDIT' | 'DEBIT' | 'REFUND' | 'ADJUSTMENT'
    amount NUMERIC(14, 4) NOT NULL,
    balance_before NUMERIC(14, 4) NOT NULL,
    balance_after NUMERIC(14, 4) NOT NULL,
    reference_type VARCHAR(50) NOT NULL, -- 'PAYMENT' | 'OTP_DEDUCTION' | 'OTP_REFUND' | 'ADMIN_ADJUSTMENT'
    reference_id VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_ref_id ON wallet_transactions(reference_id);

-- 4. API Keys Table (Stores SHA-256 hash of secret key)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(30) NOT NULL, -- e.g. 'sk_live_a1b2'
    key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' | 'revoked'
    rate_limit_per_min INT NOT NULL DEFAULT 120,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

-- 5. OTP Transactions Table
CREATE TABLE IF NOT EXISTS otp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    phone_masked VARCHAR(30) NOT NULL,
    phone_hash VARCHAR(64) NOT NULL,
    cost_incurred NUMERIC(10, 4) NOT NULL,
    gst_amount NUMERIC(10, 4) NOT NULL,
    service_fee NUMERIC(10, 4) NOT NULL,
    total_charged NUMERIC(10, 4) NOT NULL,
    provider_name VARCHAR(50) NOT NULL DEFAULT 'primary_gateway',
    provider_ref_id VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'SENT', -- 'SENT' | 'DELIVERED' | 'FAILED' | 'REFUNDED'
    delivery_code VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_tx_user_created ON otp_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_tx_phone_hash_created ON otp_transactions(phone_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_tx_status ON otp_transactions(status);

-- 6. Payments Table (Razorpay Orders & Transactions)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
    razorpay_payment_id VARCHAR(100) UNIQUE,
    razorpay_signature VARCHAR(255),
    amount NUMERIC(14, 4) NOT NULL, -- Total payable via gateway
    credit_amount NUMERIC(14, 4) NOT NULL DEFAULT 0.0000, -- Amount added to wallet balance
    gst_amount NUMERIC(14, 4) NOT NULL DEFAULT 0.0000, -- 18% GST
    service_fee_amount NUMERIC(14, 4) NOT NULL DEFAULT 0.0000, -- 2.5% Service Fee
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'SUCCESS' | 'FAILED'
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    raw_webhook_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_created ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(razorpay_order_id);

-- 7. Pricing Configuration (Dynamic Rules)
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_base_cost NUMERIC(8, 4) NOT NULL DEFAULT 0.1500,
    gst_percentage NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
    service_charge_percentage NUMERIC(5, 2) NOT NULL DEFAULT 2.50,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Audit Logs Table (Mandatory for Compliance & Financial Operations)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(100),
    reason TEXT,
    metadata JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- 9. Notifications Table (Scalable, multi-tenant, dynamic server notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'system', -- 'system' | 'wallet' | 'warning' | 'security' | 'otp'
    action_url VARCHAR(255),
    action_label VARCHAR(100),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Billion-scale indexes: Fast retrieval of active notifications per user
CREATE INDEX IF NOT EXISTS idx_notifications_user_active_created 
ON notifications(user_id, is_dismissed, created_at DESC);

-- Fast partial index for unread count badge
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, is_read) 
WHERE is_dismissed = FALSE;
