import crypto from 'crypto';

/**
 * Generate a cryptographically secure API key
 * Format: sk_live_<32_bytes_hex>
 */
export function generateApiKey(): { rawKey: string; keyPrefix: string; keyHash: string } {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  const rawKey = `sk_live_${randomBytes}`;
  const keyPrefix = rawKey.substring(0, 12);
  const keyHash = hashApiKey(rawKey);

  return { rawKey, keyPrefix, keyHash };
}

/**
 * Compute SHA-256 hash of an API key for secure storage and constant-time lookup
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Mask phone number for dashboard and privacy compliance
 * Example: "9876543210" -> "98******10"
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 6) return '******';
  const start = phone.slice(0, 2);
  const end = phone.slice(-2);
  return `${start}${'*'.repeat(Math.max(phone.length - 4, 4))}${end}`;
}

/**
 * Generate SHA-256 hash of phone number for anti-abuse & rate limiting without storing raw data
 */
export function hashPhoneNumber(phone: string): string {
  return crypto.createHash('sha256').update(phone).digest('hex');
}

/**
 * Verify Razorpay payment signature
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  try {
    const text = `${orderId}|${paymentId}`;
    const generated = crypto.createHmac('sha256', secret).update(text).digest('hex');
    const genBuf = Buffer.from(generated);
    const sigBuf = Buffer.from(signature);
    if (genBuf.length !== sigBuf.length) return false;
    return crypto.timingSafeEqual(genBuf, sigBuf);
  } catch {
    return false;
  }
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  secret: string
): boolean {
  try {
    const generated = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const genBuf = Buffer.from(generated);
    const sigBuf = Buffer.from(signature);
    if (genBuf.length !== sigBuf.length) return false;
    return crypto.timingSafeEqual(genBuf, sigBuf);
  } catch {
    return false;
  }
}
