import React, { useState, useEffect } from 'react';
import { Wallet, PlusCircle, ArrowDownLeft, ArrowUpRight, ShieldCheck, CheckCircle2, RefreshCw, FileText } from 'lucide-react';
import { WalletTransaction, PricingTier } from '../types';
import { ApiClient } from '../services/api';

interface WalletViewProps {
  onOpenWalletModal: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({ onOpenWalletModal }) => {
  const [balance, setBalance] = useState<number>(0);
  const [ledger, setLedger] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [otpRate, setOtpRate] = useState<number>(0.75);
  const [activeTier, setActiveTier] = useState<string>('TIER_1');
  const [tierName, setTierName] = useState<string>('Starter Tier');
  const [nextTier, setNextTier] = useState<any>(null);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);

  useEffect(() => {
    fetchWalletData();
  }, [page]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [balRes, ledgerRes, pricingRes] = await Promise.all([
        ApiClient.getWalletBalance().catch(() => ({ success: false, balance: 0, currency: 'INR', otpRate: 0.75, activeTier: 'TIER_1', tierName: 'Starter Tier', highestTopup: 0, nextTier: null })),
        ApiClient.getWalletLedger(page, 15).catch(() => ({ success: false, data: [], pagination: {} })),
        ApiClient.getPublicPricing().catch(() => ({ success: false, pricing: null, tiers: [] }))
      ]);

      if (balRes?.balance !== undefined) setBalance(balRes.balance);
      if (balRes?.otpRate !== undefined) setOtpRate(balRes.otpRate);
      if (balRes?.activeTier !== undefined) setActiveTier(balRes.activeTier);
      if (balRes?.tierName !== undefined) setTierName(balRes.tierName);
      if (balRes?.nextTier !== undefined) setNextTier(balRes.nextTier);

      if (pricingRes?.tiers && pricingRes.tiers.length > 0) {
        setPricingTiers(pricingRes.tiers);
      } else {
        // Fallback default tiers
        setPricingTiers([
          { id: 't1', minTopup: 100, maxTopup: 499, otpPrice: 0.75, gstPercentage: 18, isActive: true, name: 'Starter Tier', label: '₹100 – ₹499' },
          { id: 't2', minTopup: 500, maxTopup: 1999, otpPrice: 0.72, gstPercentage: 18, isActive: true, name: 'Growth Tier', label: '₹500 – ₹1,999' },
          { id: 't3', minTopup: 2000, maxTopup: 4999, otpPrice: 0.68, gstPercentage: 18, isActive: true, name: 'Scale Tier', label: '₹2,000 – ₹4,999' },
          { id: 't4', minTopup: 5000, maxTopup: 9999, otpPrice: 0.64, gstPercentage: 18, isActive: true, name: 'Business Tier', label: '₹5,000 – ₹9,999' },
          { id: 't5', minTopup: 10000, maxTopup: null, otpPrice: 0.60, gstPercentage: 18, isActive: true, name: 'Enterprise Tier', label: '₹10,000+' },
        ]);
      }

      if (ledgerRes?.data) {
        setLedger(ledgerRes.data);
        if ('pagination' in ledgerRes && (ledgerRes as any).pagination) {
          setTotalPages((ledgerRes as any).pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load wallet data', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'TOPUP':
      case 'CREDIT':
        return { label: 'TOPUP', bg: '#ecfdf5', color: '#047857', isCredit: true };
      case 'OTP_DEBIT':
      case 'DEBIT':
        return { label: 'OTP DEBIT', bg: '#eff6ff', color: '#1d4ed8', isCredit: false };
      case 'REFUND':
        return { label: 'REFUND', bg: '#fef3c7', color: '#b45309', isCredit: true };
      case 'ADMIN_CREDIT':
      case 'ADJUSTMENT':
        return { label: 'ADMIN CREDIT', bg: '#f0fdf4', color: '#15803d', isCredit: true };
      case 'ADMIN_DEBIT':
        return { label: 'ADMIN DEBIT', bg: '#fef2f2', color: '#b91c1c', isCredit: false };
      case 'PAYMENT_REVERSAL':
        return { label: 'REVERSAL', bg: '#fef2f2', color: '#b91c1c', isCredit: false };
      default:
        return { label: type, bg: 'var(--bg-app)', color: 'var(--text-main)', isCredit: true };
    }
  };

  return (
    <div className="page-container">
      
      {/* Wallet Balance Hero Banner */}
      <div className="surface-card" style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            backgroundColor: '#eff6ff',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
          }}>
            <Wallet size={26} />
          </div>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Available Wallet Balance
            </span>
            <div style={{ fontSize: 'clamp(26px, 5vw, 32px)', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px', letterSpacing: '-0.02em' }}>
              ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Current Active Volume Rate Pill */}
        <div style={{
          backgroundColor: 'var(--bg-app)',
          padding: '12px 18px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Your Active OTP Rate
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#3b82f6', marginTop: '2px' }}>
              ₹{otpRate.toFixed(2)} / OTP
            </div>
          </div>
          <div style={{
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            fontSize: '11px',
            fontWeight: 700,
            padding: '4px 8px',
            borderRadius: '6px'
          }}>
            {tierName}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => fetchWalletData()}
            style={{
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
            title="Refresh Ledger"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={onOpenWalletModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '11px 20px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
              cursor: 'pointer'
            }}
          >
            <PlusCircle size={18} />
            <span>Top Up Wallet (Min ₹100)</span>
          </button>
        </div>
      </div>

      {/* Pricing Tiers Matrix */}
      <div className="surface-card">
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
            Wallet Top-Up Volume Pricing
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Pricing is determined by your top-up amount. The purchased amount is fully credited to your wallet float. All prices are exclusive of 18% GST.
          </p>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '500px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Top-up Bracket</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>OTP Rate</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Yield per ₹100</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {pricingTiers.map((tier) => {
                const isCurrent = activeTier === tier.id || Math.abs(otpRate - tier.otpPrice) < 0.001;
                const label = tier.label || (tier.maxTopup ? `₹${tier.minTopup.toLocaleString()} – ₹${tier.maxTopup.toLocaleString()}` : `₹${tier.minTopup.toLocaleString()}+`);
                const yieldPer100 = tier.otpPrice > 0 ? Math.floor(100 / tier.otpPrice) : 0;
                return (
                  <tr
                    key={tier.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: isCurrent ? 'rgba(59, 130, 246, 0.04)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {label}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#3b82f6', fontSize: '14px' }}>
                      ₹{tier.otpPrice.toFixed(2)} / OTP
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      ~{yieldPer100} OTPs
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {isCurrent ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: '#ecfdf5',
                          color: '#065f46',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}>
                          <CheckCircle2 size={12} color="#10b981" />
                          <span>Active Tier</span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          Unlock on top-up
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Financial Ledger Table */}
      <div className="surface-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
              Immutable Financial Ledger
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Every wallet credit and debit operation creates an immutable audit ledger entry.
            </p>
          </div>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '6px',
            backgroundColor: '#ecfdf5',
            color: '#047857',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <ShieldCheck size={14} />
            Server-Side Audited
          </span>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Timestamp</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rate</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Before</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>After</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading financial ledger...
                  </td>
                </tr>
              ) : ledger.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No wallet transactions recorded yet.
                  </td>
                </tr>
              ) : (
                ledger.map((entry) => {
                  const badge = getTypeBadge(entry.type);
                  const numAmount = typeof entry.amount === 'string' ? parseFloat(entry.amount) : entry.amount;
                  const numBefore = typeof entry.balance_before === 'string' ? parseFloat(entry.balance_before) : entry.balance_before;
                  const numAfter = typeof entry.balance_after === 'string' ? parseFloat(entry.balance_after) : entry.balance_after;
                  const applicableRateNum = entry.applicable_rate ? (typeof entry.applicable_rate === 'string' ? parseFloat(entry.applicable_rate) : entry.applicable_rate) : null;

                  return (
                    <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: badge.bg,
                          color: badge.color
                        }}>
                          {badge.isCredit ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                          <span>{badge.label}</span>
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>
                        {applicableRateNum !== null ? `₹${applicableRateNum.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-main)', maxWidth: '280px' }}>
                        <div>{entry.description}</div>
                        {entry.payment_id && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            Ref: {entry.payment_id}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        ₹{numBefore.toFixed(2)}
                      </td>
                      <td style={{
                        padding: '14px 16px',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: badge.isCredit ? '#10b981' : '#ef4444',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {badge.isCredit ? '+' : '-'}₹{numAmount.toFixed(2)}
                      </td>
                      <td style={{
                        padding: '14px 16px',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        textAlign: 'right',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        ₹{numAfter.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
