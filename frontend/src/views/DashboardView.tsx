import React, { useEffect, useState } from 'react';
import {
  Send,
  PlusCircle,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Zap,
  Layers,
  Inbox,
  TrendingUp
} from 'lucide-react';
import { User, OtpTransaction } from '../types';
import { ApiClient } from '../services/api';

interface DashboardViewProps {
  user: User | null;
  onNavigate: (tab: string) => void;
  onOpenWalletModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onNavigate,
  onOpenWalletModal,
}) => {
  const [balance, setBalance] = useState<number>(user?.balance ?? 0);
  const [walletInfo, setWalletInfo] = useState<{
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
  } | null>(null);
  const [transactions, setTransactions] = useState<OtpTransaction[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [balRes, txRes, anaRes, priceRes] = await Promise.all([
        ApiClient.getWalletBalance().catch(() => ({ balance: user?.balance ?? 0, currency: 'INR', otpRate: 0.75, activeTier: 'TIER_1', highestTopup: 0 })),
        ApiClient.getTransactions(1, 6).catch(() => ({ data: [] })),
        ApiClient.getAnalytics().catch(() => ({ stats: null, trend: [] })),
        ApiClient.getPublicPricing().catch(() => ({ pricing: null }))
      ]);

      if (balRes?.balance !== undefined) {
        setBalance(balRes.balance);
        setWalletInfo(balRes);
      }
      if (txRes?.data) setTransactions(txRes.data);
      if (anaRes?.stats) setAnalytics(anaRes.stats);
      if (priceRes?.pricing) setPricing(priceRes.pricing);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const totalSentCount = parseInt(analytics?.total_sent || '0');
  const deliveredCount = parseInt(analytics?.delivered || '0');
  const successPercentage = totalSentCount > 0 
    ? ((deliveredCount / totalSentCount) * 100).toFixed(1) + '%' 
    : '100%';

  const activeOtpRate = walletInfo?.otpRate 
    ? parseFloat(walletInfo.otpRate.toString()).toFixed(2)
    : (user?.otpRate ? parseFloat(user.otpRate.toString()).toFixed(2) : '0.75');
  const activeTierName = walletInfo?.tierName || 'Starter Tier';

  return (
    <div className="page-container">
      
      {/* Total Balance Hero Card (Reference: Flowa Top Balance Banner) */}
      <div className="surface-card" style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div>
          <span style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            Available Wallet Balance
          </span>
          <div style={{
            fontSize: 'clamp(26px, 5vw, 36px)',
            fontWeight: 800,
            color: 'var(--text-main)',
            marginTop: '4px',
            letterSpacing: '-0.03em',
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span>₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>Active Float</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('send-otp')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
            }}
          >
            <Send size={16} />
            <span>Send OTP</span>
          </button>

          <button
            onClick={onOpenWalletModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            <PlusCircle size={16} />
            <span>Add Funds</span>
          </button>

          <button
            onClick={() => onNavigate('api-keys')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            <KeyRound size={16} />
            <span>API Keys</span>
          </button>
        </div>
      </div>

      {/* Tier Pricing Progression Card */}
      <div className="surface-card" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pricing Tier Status
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
                padding: '2px 10px',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.25)'
              }}>
                {walletInfo?.tierName || 'Starter Tier'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginTop: '6px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Current OTP Rate: </span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
                  ₹{(walletInfo?.otpRate ?? 0.75).toFixed(2)} / OTP
                </span>
              </div>
              {walletInfo?.nextTier && (
                <>
                  <span style={{ color: 'var(--border-subtle)' }}>|</span>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Next Pricing Tier: </span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>
                      ₹{walletInfo.nextTier.otpPrice.toFixed(2)} / OTP
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {walletInfo?.nextTier && (
            <button
              onClick={onOpenWalletModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <TrendingUp size={14} />
              <span>Unlock ₹{walletInfo.nextTier.otpPrice.toFixed(2)} Rate</span>
            </button>
          )}
        </div>

        {/* Visual Progress Bar to Next Tier */}
        {walletInfo?.nextTier ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
              <span>
                Top up <strong style={{ color: 'var(--text-main)' }}>₹{walletInfo.nextTier.amountRequired.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> more to unlock the next pricing tier.
              </span>
              <span style={{ fontWeight: 600, color: '#3b82f6' }}>
                {walletInfo.nextTier.progressPercentage}% Progress
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: '999px',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{
                width: `${Math.min(100, Math.max(5, walletInfo.nextTier.progressPercentage))}%`,
                height: '100%',
                backgroundColor: '#3b82f6',
                borderRadius: '999px',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} />
            <span>Highest Enterprise Volume Tier Unlocked (Maximum discount applied: ₹0.60 / OTP)</span>
          </div>
        )}
      </div>

      {/* 3 Metric Cards */}
      <div className="grid-stats">
        {/* Card 1: Deliveries & Volume */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Zap size={18} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Total OTPs Sent
              </span>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: '#ecfdf5',
              color: '#059669'
            }}>
              High Throughput
            </span>
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--text-main)',
            marginTop: '14px',
            letterSpacing: '-0.02em'
          }}>
            {analytics?.total_sent || '0'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Today: {analytics?.today_sent || '0'} messages dispatched
          </div>
        </div>

        {/* Card 2: Carrier Success Rate */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#ecfdf5',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={18} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Delivery Performance
              </span>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: '#ecfdf5',
              color: '#047857'
            }}>
              {successPercentage} Success
            </span>
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--text-main)',
            marginTop: '14px',
            letterSpacing: '-0.02em'
          }}>
            {analytics?.delivered || '0'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Auto-refunded reversals: {analytics?.failed || '0'}
          </div>
        </div>

        {/* Card 3: Dynamic Rate per OTP */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#f5f3ff',
                color: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Layers size={18} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Active OTP Rate
              </span>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8'
            }}>
              {activeTierName}
            </span>
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--text-main)',
            marginTop: '14px',
            letterSpacing: '-0.02em'
          }}>
            ₹{activeOtpRate}
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '6px' }}>/ OTP</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Top-up volume discount tier
          </div>
        </div>
      </div>

      {/* Transactions Section (Reference: Clean Flowa Table Style) */}
      <div className="surface-card">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-main)',
            letterSpacing: '-0.01em'
          }}>
            Recent Dispatches
          </h2>
          {transactions.length > 0 && (
            <button
              onClick={() => onNavigate('transactions')}
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>View All</span>
              <ArrowUpRight size={14} />
            </button>
          )}
        </div>

        {/* Table Content */}
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '580px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recipient</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>API Key / Channel</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date & Time</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    Loading real-time user dispatches...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Inbox size={22} />
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                        No message dispatches yet
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: 0, lineHeight: 1.5 }}>
                        You have not dispatched any OTP messages from this account. Generate an API credential or send a test OTP message to see real-time delivery telemetry here.
                      </p>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                        <button
                          onClick={() => onNavigate('send-otp')}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#3b82f6',
                            color: '#ffffff',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600
                          }}
                        >
                          Send Test OTP
                        </button>
                        <button
                          onClick={() => onNavigate('api-keys')}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: 'var(--bg-app)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--text-main)'
                          }}
                        >
                          Create API Key
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      {tx.phone_masked}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {tx.api_key_name || (tx.key_prefix ? `${tx.key_prefix}...` : 'Primary Channel')}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      OTP Dispatch
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {new Date(tx.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: tx.status === 'DELIVERED' ? '#ecfdf5' : (tx.status === 'REFUNDED' ? '#fffbeb' : '#fef2f2'),
                        color: tx.status === 'DELIVERED' ? '#047857' : (tx.status === 'REFUNDED' ? '#b45309' : '#b91c1c')
                      }}>
                        {tx.status === 'DELIVERED' ? 'Success' : (tx.status === 'REFUNDED' ? 'Refunded' : tx.status)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', textAlign: 'right' }}>
                      ₹{parseFloat(tx.total_charged).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
