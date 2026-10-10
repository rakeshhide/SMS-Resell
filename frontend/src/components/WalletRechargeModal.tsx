import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  X,
  Lock,
  Info,
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react';
import { ApiClient } from '../services/api';
import { PricingTier } from '../types';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface WalletRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
  userEmail?: string;
  userName?: string;
}

export const WalletRechargeModal: React.FC<WalletRechargeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userEmail,
  userName,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [minTopup, setMinTopup] = useState<number>(1);
  const [defaultGst, setDefaultGst] = useState<number>(18);
  const [defaultServiceFee, setDefaultServiceFee] = useState<number>(3);

  useEffect(() => {
    if (isOpen) {
      ApiClient.getPublicPricing()
        .then((res) => {
          if (res?.tiers && res.tiers.length > 0) {
            setPricingTiers(res.tiers);
          }
          if (res?.settings) {
            const min = res.settings.minTopup ?? 1;
            setMinTopup(min);
            if (res.settings.defaultGst !== undefined) setDefaultGst(res.settings.defaultGst);
            if (res.settings.defaultServiceFee !== undefined) setDefaultServiceFee(res.settings.defaultServiceFee);
            setSelectedAmount((prev) => (prev < min ? min : prev));
          }
        })
        .catch((err) => {
          console.error('Failed to fetch public pricing in modal', err);
        });
    }
  }, [isOpen]);

  const presets = useMemo(() => {
    if (pricingTiers.length > 0) {
      return pricingTiers.map((t, idx) => {
        let badge: string | undefined = undefined;
        if (t.minTopup === 1000 || idx === 2) badge = 'POPULAR';
        else if (t.minTopup === 5000) badge = 'BEST VALUE';
        else if (t.minTopup >= 10000) badge = 'MAX SAVINGS';
        return {
          amt: Math.max(t.minTopup, minTopup),
          rate: t.otpPrice,
          tier: t.name?.replace(' Tier', '') || `Tier ${idx + 1}`,
          badge
        };
      });
    }
    return [
      { amt: Math.max(minTopup, 100), rate: 0.75, tier: 'Starter' },
      { amt: Math.max(minTopup, 500), rate: 0.72, tier: 'Growth' },
      { amt: Math.max(minTopup, 1000), rate: 0.72, tier: 'Growth', badge: 'POPULAR' },
      { amt: Math.max(minTopup, 2000), rate: 0.68, tier: 'Scale' },
      { amt: Math.max(minTopup, 5000), rate: 0.64, tier: 'Business', badge: 'BEST VALUE' },
      { amt: Math.max(minTopup, 10000), rate: 0.60, tier: 'Enterprise', badge: 'MAX SAVINGS' },
    ];
  }, [pricingTiers, minTopup]);

  const MAX_TOPUP = 100000; // ₹1,00,000 (1 Lakh) max topup limit
  const parsedCustom = parseFloat(customAmount);
  const finalAmount = customAmount ? (isNaN(parsedCustom) ? 0 : parsedCustom) : selectedAmount;
  const baseCredit = finalAmount > 0 ? finalAmount : 0;
  const gstAmount = Number((baseCredit * (defaultGst / 100)).toFixed(2));
  const serviceFeeAmount = Number((baseCredit * (defaultServiceFee / 100)).toFixed(2));
  const totalPayable = Number((baseCredit + gstAmount + serviceFeeAmount).toFixed(2));

  // Dynamic Volume Tier lookup
  const getTier = (amt: number) => {
    if (pricingTiers.length > 0) {
      const sorted = [...pricingTiers].sort((a, b) => b.minTopup - a.minTopup);
      for (const t of sorted) {
        if (amt >= t.minTopup) {
          const bracket = t.maxTopup ? `₹${t.minTopup.toLocaleString('en-IN')} – ₹${t.maxTopup.toLocaleString('en-IN')}` : `₹${t.minTopup.toLocaleString('en-IN')}+`;
          return { rate: t.otpPrice, name: t.name || 'Volume Tier', bracket };
        }
      }
      const lowest = [...pricingTiers].sort((a, b) => a.minTopup - b.minTopup)[0];
      return { rate: lowest.otpPrice, name: lowest.name || 'Starter Tier', bracket: lowest.label || `₹${lowest.minTopup}+` };
    }
    if (amt >= 10000) return { rate: 0.60, name: 'Enterprise Tier', bracket: '₹10,000+' };
    if (amt >= 5000) return { rate: 0.64, name: 'Business Tier', bracket: '₹5,000 – ₹9,999' };
    if (amt >= 2000) return { rate: 0.68, name: 'Scale Tier', bracket: '₹2,000 – ₹4,999' };
    if (amt >= 500) return { rate: 0.72, name: 'Growth Tier', bracket: '₹500 – ₹1,999' };
    return { rate: 0.75, name: 'Starter Tier', bracket: `₹${minTopup} – ₹499` };
  };

  const unlockedTier = getTier(baseCredit);
  const estMessages = unlockedTier.rate > 0 ? Math.floor(baseCredit / unlockedTier.rate) : 0;
  const isOverMax = baseCredit > MAX_TOPUP;
  const isValidAmount = baseCredit >= minTopup && baseCredit <= MAX_TOPUP;

  if (!isOpen) return null;

  const handleTopup = async () => {
    setErrorMessage(null);
    if (baseCredit < minTopup) {
      setErrorMessage(`The minimum wallet top-up amount is ₹${minTopup.toLocaleString('en-IN')}.`);
      return;
    }
    if (baseCredit > MAX_TOPUP) {
      setErrorMessage(`The maximum wallet top-up limit is ₹${MAX_TOPUP.toLocaleString('en-IN')} (1 Lakh).`);
      return;
    }

    try {
      setLoading(true);
      setSuccessMessage(null);

      // 1. Create order on backend server (checks min dynamic topup & calculates dynamic GST + service fee)
      const orderData = await ApiClient.createOrder(baseCredit);

      if (typeof window.Razorpay === 'undefined') {
        setErrorMessage('Payment gateway SDK is loading or unavailable. Please refresh the page and try again.');
        return;
      }

      // 2. Open standard Razorpay Checkout with total payable (topup + GST + service fee)
      const options = {
        key: orderData.keyId,
        amount: orderData.amountInPaise,
        currency: 'INR',
        name: 'turfsyOTPs Platform',
        description: `Wallet Top-Up: ₹${baseCredit.toFixed(2)} (+${defaultGst}% GST ₹${gstAmount.toFixed(2)} + ${defaultServiceFee}% Service Fee ₹${serviceFeeAmount.toFixed(2)})`,
        order_id: orderData.orderId,
        prefill: {
          name: userName || 'Customer',
          email: userEmail || '',
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        },
        handler: async function (response: any) {
          try {
            // 3. Server-side signature verification & exact base balance credit
            const verifyRes = await ApiClient.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            setSuccessMessage(`Success! ₹${baseCredit.toFixed(2)} has been credited to your wallet.`);
            setTimeout(() => {
              onSuccess(verifyRes.newBalance);
              onClose();
              window.location.reload();
            }, 1200);
          } catch (err: any) {
            setErrorMessage(err.message || 'Payment signature verification failed.');
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setErrorMessage(resp?.error?.description || 'Payment was unsuccessful or cancelled.');
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment initialization error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          padding: '28px',
          borderRadius: '20px'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '22px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)'
            }}>
              <Wallet size={22} />
            </div>
            <div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--text-main)',
                margin: 0,
                letterSpacing: '-0.02em'
              }}>
                Wallet Top-Up
              </h3>
              <p style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                margin: '3px 0 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>Instant balance credit</span>
                <span>•</span>
                <span>Min ₹{minTopup.toLocaleString('en-IN')} – Max ₹1,00,000</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Close"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {successMessage ? (
          <div style={{
            padding: '36px 20px',
            backgroundColor: '#ecfdf5',
            borderRadius: '16px',
            border: '1px solid #a7f3d0',
            textAlign: 'center',
            color: '#065f46'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#d1fae5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <CheckCircle2 size={32} color="#10b981" />
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>Payment Successful</div>
            <div style={{ fontSize: '14px', marginTop: '6px', color: '#047857' }}>{successMessage}</div>
            <div style={{ fontSize: '12px', marginTop: '12px', color: '#059669' }}>
              Updating your real-time wallet ledger...
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Error Notification Banner */}
            {errorMessage && (
              <div style={{
                padding: '12px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                borderRadius: '12px',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#ef4444',
                fontSize: '13px',
                fontWeight: 600,
                lineHeight: 1.45
              }}>
                <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>{errorMessage}</div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '6px'
                  }}
                  aria-label="Dismiss error"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Presets Grid */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Select Top-Up Amount
                </span>
                <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>
                  Larger top-ups unlock lower OTP rates
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px'
              }}>
                {presets.map((preset) => {
                  const isSelected = selectedAmount === preset.amt && !customAmount;
                  return (
                    <button
                      key={preset.amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(preset.amt);
                        setCustomAmount('');
                        setErrorMessage(null);
                      }}
                      style={{
                        position: 'relative',
                        padding: '12px 10px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #3b82f6' : '1px solid var(--border-subtle)',
                        backgroundColor: isSelected
                          ? 'rgba(59, 130, 246, 0.08)'
                          : 'var(--bg-app)',
                        color: isSelected ? '#3b82f6' : 'var(--text-main)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        boxShadow: isSelected
                          ? '0 4px 12px rgba(59, 130, 246, 0.18)'
                          : 'none'
                      }}
                    >
                      {preset.badge && (
                        <span style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '8px',
                          fontSize: '9px',
                          fontWeight: 800,
                          backgroundColor: preset.badge === 'POPULAR' ? '#3b82f6' : '#8b5cf6',
                          color: '#ffffff',
                          padding: '2px 6px',
                          borderRadius: '8px',
                          letterSpacing: '0.03em',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
                        }}>
                          {preset.badge}
                        </span>
                      )}

                      <span style={{
                        fontSize: '16px',
                        fontWeight: 800,
                        color: isSelected ? '#3b82f6' : 'var(--text-main)'
                      }}>
                        ₹{preset.amt.toLocaleString('en-IN')}
                      </span>

                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: isSelected ? '#2563eb' : 'var(--text-muted)'
                      }}>
                        ₹{preset.rate.toFixed(2)} / OTP
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px'
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Or Custom Amount (Max ₹1,00,000)
                </span>
                {customAmount && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isOverMax ? '#ef4444' : isValidAmount ? '#10b981' : '#ef4444'
                  }}>
                    {isOverMax
                      ? 'Maximum ₹1,00,000 (1 Lakh) allowed'
                      : !isValidAmount
                      ? `Minimum ₹${minTopup.toLocaleString('en-IN')} required`
                      : `${unlockedTier.name} (₹${unlockedTier.rate.toFixed(2)}/OTP)`}
                  </span>
                )}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid',
                borderColor: customAmount
                  ? (isValidAmount ? '#3b82f6' : '#ef4444')
                  : 'var(--border-subtle)',
                borderRadius: '12px',
                padding: '10px 14px',
                gap: '8px',
                transition: 'border-color 0.15s ease'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: isOverMax ? '#ef4444' : '#3b82f6',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  ₹
                </div>
                <input
                  type="number"
                  placeholder={`Enter amount (₹${minTopup.toLocaleString('en-IN')} – ₹1,00,000)`}
                  min={minTopup}
                  max={MAX_TOPUP}
                  value={customAmount}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val === '') {
                      setCustomAmount('');
                      setErrorMessage(null);
                      return;
                    }
                    val = val.replace(/[^0-9.]/g, '');
                    const parts = val.split('.');
                    if (parts.length > 2) return;
                    if (parts[1] && parts[1].length > 2) {
                      val = `${parts[0]}.${parts[1].slice(0, 2)}`;
                    }
                    if (parts[0].length > 1 && parts[0].startsWith('0')) {
                      parts[0] = parts[0].replace(/^0+/, '') || '0';
                      val = parts[1] !== undefined ? `${parts[0]}.${parts[1]}` : parts[0];
                    }
                    if (parts[0].length > 6) {
                      setCustomAmount(MAX_TOPUP.toString());
                      setErrorMessage('Maximum wallet top-up limit is ₹1,00,000 (1 Lakh).');
                      return;
                    }
                    const num = parseFloat(val);
                    if (!isNaN(num) && num > MAX_TOPUP) {
                      setCustomAmount(MAX_TOPUP.toString());
                      setErrorMessage('Maximum wallet top-up limit is ₹1,00,000 (1 Lakh).');
                      return;
                    }
                    setCustomAmount(val);
                    setErrorMessage(null);
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '15px',
                    fontWeight: 700,
                    width: '100%',
                    color: isOverMax ? '#ef4444' : 'var(--text-main)'
                  }}
                />
                {customAmount && isValidAmount && (
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#dbeafe',
                    color: '#1d4ed8',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap'
                  }}>
                    ₹{unlockedTier.rate.toFixed(2)}/OTP
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary Card */}
            <div style={{
              backgroundColor: 'var(--bg-app)',
              padding: '16px 18px',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Wallet Float Credit:
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                  ₹{baseCredit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  GST ({defaultGst}% Statutory Levy):
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  +₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Service Fee ({defaultServiceFee}% Platform Charge):
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  +₹{serviceFeeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{
                borderTop: '1px dashed var(--border-subtle)',
                paddingTop: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                    Total Payable:
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Inclusive of {defaultGst}% GST + {defaultServiceFee}% service fee
                  </div>
                </div>
                <div style={{
                  fontSize: '19px',
                  fontWeight: 900,
                  color: isOverMax ? '#ef4444' : '#3b82f6',
                  letterSpacing: '-0.02em'
                }}>
                  ₹{totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Dynamic Rate & Capacity Pill */}
              <div style={{
                marginTop: '4px',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.06)',
                border: '1px solid rgba(59, 130, 246, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="#3b82f6" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#3b82f6' }}>
                    {unlockedTier.name}
                  </span>
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>₹{unlockedTier.rate.toFixed(2)} / OTP</span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span>~{estMessages.toLocaleString('en-IN')} OTPs</span>
                </div>
              </div>
            </div>

            {/* Transparency Note */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              lineHeight: 1.45
            }}>
              <Info size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                100% of your <strong>₹{baseCredit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> top-up is credited directly to your wallet float. {defaultGst}% GST (₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) and {defaultServiceFee}% platform service fee (₹{serviceFeeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) are remitted separately.
              </div>
            </div>

            {/* Security Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '11px',
              color: 'var(--text-muted)'
            }}>
              <Lock size={12} color="#10b981" />
              <span>256-bit encrypted checkout via Razorpay Payment Gateway</span>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleTopup}
              disabled={loading || !isValidAmount}
              style={{
                width: '100%',
                padding: '14px',
                background: !isValidAmount
                  ? '#9ca3af'
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#ffffff',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: !isValidAmount
                  ? 'none'
                  : '0 6px 20px rgba(59, 130, 246, 0.35)',
                cursor: loading || !isValidAmount ? 'not-allowed' : 'pointer',
                border: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span>
                {loading
                  ? 'Opening Secure Razorpay Gateway...'
                  : isOverMax
                  ? 'Maximum Limit ₹1,00,000 Exceeded'
                  : !isValidAmount
                  ? `Enter Valid Amount (Min ₹${minTopup})`
                  : `Proceed to Pay ₹${totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

