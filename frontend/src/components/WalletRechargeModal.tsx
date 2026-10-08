import React, { useState } from 'react';
import { Wallet, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { ApiClient } from '../services/api';

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

  if (!isOpen) return null;

  const quickAmounts = [100, 500, 1000, 2000, 5000, 10000];
  const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
  const baseCredit = finalAmount > 0 ? finalAmount : 0;
  const gstAmount = Number((baseCredit * 0.18).toFixed(2));
  const totalPayable = Number((baseCredit + gstAmount).toFixed(2));

  // Dynamic Volume Tier lookup
  const getTier = (amt: number) => {
    if (amt >= 10000) return { rate: 0.60, name: 'Enterprise Tier', bracket: '₹10,000+' };
    if (amt >= 5000) return { rate: 0.64, name: 'Business Tier', bracket: '₹5,000 – ₹9,999' };
    if (amt >= 2000) return { rate: 0.68, name: 'Scale Tier', bracket: '₹2,000 – ₹4,999' };
    if (amt >= 500) return { rate: 0.72, name: 'Growth Tier', bracket: '₹500 – ₹1,999' };
    return { rate: 0.75, name: 'Starter Tier', bracket: '₹100 – ₹499' };
  };

  const unlockedTier = getTier(baseCredit);
  const estMessages = unlockedTier.rate > 0 ? Math.floor(baseCredit / unlockedTier.rate) : 0;

  const handleTopup = async () => {
    if (!baseCredit || baseCredit < 100) {
      alert('The minimum wallet top-up amount is ₹100.');
      return;
    }

    try {
      setLoading(true);
      setSuccessMessage(null);

      // 1. Create order on backend server (checks min ₹100 & calculates 18% GST)
      const orderData = await ApiClient.createOrder(baseCredit);

      if (typeof window.Razorpay === 'undefined') {
        alert('Payment gateway SDK is loading or unavailable. Please refresh the page and try again.');
        return;
      }

      // 2. Open standard Razorpay Checkout with total payable (topup + 18% GST)
      const options = {
        key: orderData.keyId,
        amount: orderData.amountInPaise,
        currency: 'INR',
        name: 'NexusOTP Platform',
        description: `Wallet Top-Up: ₹${baseCredit.toFixed(2)} (+18% GST ₹${gstAmount.toFixed(2)})`,
        order_id: orderData.orderId,
        prefill: {
          name: userName || 'Customer',
          email: userEmail || '',
        },
        theme: {
          color: '#3b82f6',
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
            }, 1500);
          } catch (err: any) {
            alert(err.message || 'Payment signature verification failed.');
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert(err.message || 'Payment initialization error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '32px', maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Wallet size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                Wallet Top-Up
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Minimum top-up: ₹100
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>

        {successMessage ? (
          <div style={{
            padding: '24px',
            backgroundColor: '#ecfdf5',
            borderRadius: '12px',
            border: '1px solid #a7f3d0',
            textAlign: 'center',
            color: '#065f46'
          }}>
            <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 12px auto' }} />
            <div style={{ fontSize: '16px', fontWeight: 700 }}>{successMessage}</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>Updating ledger balance...</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Suggested Amounts */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Suggested Top-Up Amounts
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomAmount('');
                    }}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: selectedAmount === amt && !customAmount ? '#3b82f6' : 'var(--border-subtle)',
                      backgroundColor: selectedAmount === amt && !customAmount ? '#eff6ff' : 'var(--bg-app)',
                      color: selectedAmount === amt && !customAmount ? '#1d4ed8' : 'var(--text-main)',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Or Custom Top-Up Amount (Min ₹100)
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '6px',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '10px 14px'
              }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-muted)' }}>₹</span>
                <input
                  type="number"
                  placeholder="Enter amount (min 100)"
                  min={100}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '15px',
                    fontWeight: 700,
                    width: '100%',
                    color: 'var(--text-main)'
                  }}
                />
              </div>
            </div>

            {/* Breakdown Specified in Prompt */}
            <div style={{
              backgroundColor: 'var(--bg-app)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Wallet Top-up:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>₹{baseCredit.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>GST (18%):</span>
                <span style={{ fontWeight: 600 }}>+₹{gstAmount.toFixed(2)}</span>
              </div>
              <div style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 800,
                fontSize: '14px',
                color: 'var(--text-main)'
              }}>
                <span>Total Payable:</span>
                <span style={{ color: '#10b981', fontSize: '15px' }}>₹{totalPayable.toFixed(2)}</span>
              </div>

              <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: '8px', marginTop: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>Applicable OTP Rate:</span>
                  <span style={{ fontWeight: 700, color: '#3b82f6' }}>
                    ₹{unlockedTier.rate.toFixed(2)} / OTP ({unlockedTier.name})
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <span>Message Capacity:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    ~{estMessages.toLocaleString('en-IN')} OTPs
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '11px',
              color: 'var(--text-muted)'
            }}>
              After successful payment, only <strong>₹{baseCredit.toFixed(2)}</strong> is credited to your wallet float. The GST amount (₹{gstAmount.toFixed(2)}) is remitted separately.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <ShieldCheck size={16} color="#10b981" />
              <span>256-bit encrypted checkout via Razorpay Payment Gateway</span>
            </div>

            <button
              onClick={handleTopup}
              disabled={loading || baseCredit < 100}
              style={{
                padding: '14px',
                backgroundColor: baseCredit < 100 ? '#9ca3af' : '#3b82f6',
                color: '#ffffff',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: baseCredit < 100 ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.25)',
                cursor: loading || baseCredit < 100 ? 'not-allowed' : 'pointer'
              }}
            >
              <span>{loading ? 'Initializing Secure Gateway...' : `Proceed to Pay ₹${totalPayable.toFixed(2)}`}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
