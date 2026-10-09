export interface User {
  id: string;
  fullName: string;
  email: string;
  companyName?: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  createdAt?: string;
  balance?: number;
  currency?: string;
  otpRate?: number;
  activeTier?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  status: 'active' | 'revoked';
  rate_limit_per_min: number;
  last_used_at?: string;
  created_at: string;
}

export interface OtpTransaction {
  id: string;
  phone_masked: string;
  total_charged: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'REFUNDED';
  delivery_code?: string;
  provider_ref_id?: string;
  api_key_name?: string;
  key_prefix?: string;
  created_at: string;
}

export type WalletTxType = 'TOPUP' | 'OTP_DEBIT' | 'REFUND' | 'ADMIN_CREDIT' | 'ADMIN_DEBIT' | 'PAYMENT_REVERSAL' | 'CREDIT' | 'DEBIT' | 'ADJUSTMENT';

export interface WalletTransaction {
  id: string;
  type: WalletTxType;
  amount: string | number;
  balance_before: string | number;
  balance_after: string | number;
  applicable_rate?: number | string;
  payment_id?: string;
  razorpay_order_id?: string;
  reference_type?: string;
  reference_id?: string;
  status?: string;
  description: string;
  created_at: string;
}

export interface PricingTier {
  id: string;
  minTopup: number;
  maxTopup: number | null;
  otpPrice: number;
  gstPercentage: number;
  isActive: boolean;
  name?: string;
  label?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemSettings {
  minTopup: number;
  defaultGst: number;
}

export interface WalletBalanceResponse {
  balance: number;
  currency: string;
  otpRate: number;
  activeTier: string;
  tierName?: string;
  highestTopup: number;
  nextTier?: {
    otpPrice: number;
    minTopup: number;
    amountRequired: number;
    progressPercentage: number;
    tierName: string;
  } | null;
}

export interface PricingRule {
  providerBaseCost: number;
  gstPercentage: number;
  gstAmount: number;
  serviceChargePercentage: number;
  serviceFee: number;
  totalCharged: number;
}

export interface AnalyticsStats {
  total_sent: string;
  delivered: string;
  failed: string;
  total_spent: string;
  today_sent: string;
  month_sent: string;
}

export interface DailyTrend {
  date_label: string;
  count: string;
  success_count: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  subject: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
  latestMessage?: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName?: string;
  senderEmail?: string;
  senderRole: 'user' | 'admin';
  message: string;
  isRead: boolean;
  createdAt: string;
}
