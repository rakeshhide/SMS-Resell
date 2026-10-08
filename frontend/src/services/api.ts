import { PricingTier, SystemSettings, WalletBalanceResponse, WalletTransaction } from '../types';

export interface ServerNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'system' | 'wallet' | 'warning' | 'security' | 'otp';
  actionUrl?: string | null;
  actionLabel?: string | null;
  isRead: boolean;
  isDismissed: boolean;
  metadata?: any;
  createdAt: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://apinexusotp.vercel.app/api/v1';

export class ApiClient {
  private static getToken(): string | null {
    return localStorage.getItem('nexus_auth_token');
  }

  public static setToken(token: string) {
    localStorage.setItem('nexus_auth_token', token);
  }

  public static clearToken() {
    localStorage.removeItem('nexus_auth_token');
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  // Authentication
  public static login(email: string, password: string) {
    return this.request<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  public static register(fullName: string, email: string, password: string, companyName?: string) {
    return this.request<{ success: boolean; token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, companyName }),
    });
  }

  public static getMe() {
    return this.request<{ success: boolean; user: any }>('/auth/me');
  }

  // Wallet
  public static getWalletBalance() {
    return this.request<{
      success: boolean;
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
    }>('/wallet/balance');
  }

  public static getWalletLedger(page = 1, limit = 15) {
    return this.request<{ success: boolean; data: WalletTransaction[]; pagination: any }>(`/wallet/ledger?page=${page}&limit=${limit}`);
  }

  public static createOrder(amount: number) {
    return this.request<{
      success: boolean;
      orderId: string;
      creditAmount: number;
      gstAmount: number;
      serviceFeeAmount?: number;
      totalPayable: number;
      amount: number;
      amountInPaise: number;
      keyId: string;
      targetTier?: {
        id: string;
        name: string;
        otpPrice: number;
        label: string;
      };
    }>('/wallet/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  public static verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    return this.request<{
      success: boolean;
      message: string;
      newBalance: number;
      creditedAmount: number;
      totalPaid: number;
      applicableRate?: number;
    }>('/wallet/verify-payment', {
      method: 'POST',
      body: JSON.stringify({ razorpayOrderId, razorpayPaymentId, razorpaySignature }),
    });
  }

  // Transactions & Analytics
  public static getTransactions(page = 1, limit = 15, status = 'ALL', search = '') {
    return this.request<{ success: boolean; data: any[]; pagination: any }>(
      `/otp/transactions?page=${page}&limit=${limit}&status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`
    );
  }

  public static getAnalytics() {
    return this.request<{ success: boolean; stats: any; trend: any[] }>('/otp/analytics');
  }

  public static getPublicPricing() {
    return this.request<{ success: boolean; pricing: any; tiers?: PricingTier[]; settings?: SystemSettings }>('/pricing');
  }

  // API Keys
  public static listApiKeys() {
    return this.request<{ success: boolean; keys: any[] }>('/api-keys');
  }

  public static createApiKey(name: string, rateLimitPerMin = 120) {
    return this.request<{ success: boolean; message: string; apiKey: any }>('/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, rateLimitPerMin }),
    });
  }

  public static revokeApiKey(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api-keys/${id}`, {
      method: 'DELETE',
    });
  }

  // Server-driven dynamic notifications
  public static getNotifications(limit = 30, offset = 0) {
    return this.request<{
      success: boolean;
      data: ServerNotification[];
      unreadCount: number;
      total: number;
    }>(`/notifications?limit=${limit}&offset=${offset}`);
  }

  public static markNotificationRead(id: string) {
    return this.request<{ success: boolean; message: string }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  public static markAllNotificationsRead() {
    return this.request<{ success: boolean; message: string; markedCount: number }>('/notifications/read-all', {
      method: 'POST',
    });
  }

  public static dismissNotification(id: string) {
    return this.request<{ success: boolean; message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  public static dismissAllNotifications() {
    return this.request<{ success: boolean; message: string; clearedCount: number }>('/notifications', {
      method: 'DELETE',
    });
  }

  // Direct Developer API Call (for Playground in frontend)
  public static testSendOTP(apiKey: string, phone: string, otp: string) {
    return fetch(`${API_BASE}/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ phone, otp }),
    }).then(async (res) => {
      const data = await res.json();
      return { status: res.status, data };
    });
  }

  // Admin API
  public static getAdminOverview() {
    return this.request<{ success: boolean; stats: any }>('/admin/overview');
  }

  public static listUsers(page = 1, limit = 20, search = '') {
    return this.request<{ success: boolean; users: any[]; total: number }>(`/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  }

  public static toggleUserStatus(userId: string, status: 'active' | 'suspended') {
    return this.request<{ success: boolean; message: string }>('/admin/users/status', {
      method: 'POST',
      body: JSON.stringify({ userId, status }),
    });
  }

  public static getPricing() {
    return this.request<{ success: boolean; pricing: any }>('/admin/pricing');
  }

  public static updatePricing(providerBaseCost: number, gstPercentage: number, serviceChargePercentage: number) {
    return this.request<{ success: boolean; message: string; pricing: any }>('/admin/pricing', {
      method: 'POST',
      body: JSON.stringify({ providerBaseCost, gstPercentage, serviceChargePercentage }),
    });
  }

  // Admin Tier & Settings API
  public static listAdminPricingTiers() {
    return this.request<{ success: boolean; tiers: PricingTier[]; settings: SystemSettings }>('/admin/pricing-tiers');
  }

  public static createAdminPricingTier(tier: {
    minTopup: number;
    maxTopup: number | null;
    otpPrice: number;
    gstPercentage?: number;
    isActive?: boolean;
  }) {
    return this.request<{ success: boolean; message: string; tier: PricingTier }>('/admin/pricing-tiers', {
      method: 'POST',
      body: JSON.stringify(tier),
    });
  }

  public static updateAdminPricingTier(id: string, tier: {
    minTopup: number;
    maxTopup: number | null;
    otpPrice: number;
    gstPercentage: number;
    isActive: boolean;
  }) {
    return this.request<{ success: boolean; message: string; tier: PricingTier }>(`/admin/pricing-tiers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tier),
    });
  }

  public static deleteAdminPricingTier(id: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/pricing-tiers/${id}`, {
      method: 'DELETE',
    });
  }

  public static toggleAdminPricingTier(id: string, isActive: boolean) {
    return this.request<{ success: boolean; message: string }>(`/admin/pricing-tiers/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  public static getAdminSettings() {
    return this.request<{ success: boolean; settings: SystemSettings }>('/admin/settings');
  }

  public static updateAdminSettings(minTopup: number, defaultGst: number) {
    return this.request<{ success: boolean; message: string; settings: SystemSettings }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ minTopup, defaultGst }),
    });
  }

  public static manualWalletAdjustment(targetUserId: string, amount: number, reason: string) {
    return this.request<{ success: boolean; message: string; newBalance: number }>('/admin/wallet/adjust', {
      method: 'POST',
      body: JSON.stringify({ targetUserId, amount, reason }),
    });
  }

  public static getAuditLogs() {
    return this.request<{ success: boolean; logs: any[] }>('/admin/audit-logs');
  }
}
