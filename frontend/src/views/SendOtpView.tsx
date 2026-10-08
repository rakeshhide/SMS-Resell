import React, { useState, useEffect } from 'react';
import { Send, KeyRound, Smartphone, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { ApiClient } from '../services/api';
import { ApiKey } from '../types';

interface SendOtpViewProps {
  onSuccessDispatch?: () => void;
  onOpenWalletModal: () => void;
}

export const SendOtpView: React.FC<SendOtpViewProps> = ({ onSuccessDispatch, onOpenWalletModal }) => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [otpRate, setOtpRate] = useState<number>(0.75);
  const [tierName, setTierName] = useState<string>('Starter Tier');

  useEffect(() => {
    ApiClient.listApiKeys().then((res) => {
      if (res?.keys && res.keys.length > 0) {
        setKeys(res.keys);
      }
    }).catch(() => {});

    ApiClient.getWalletBalance().then((res) => {
      if (res?.otpRate) {
        setOtpRate(res.otpRate);
      }
      if (res?.tierName) {
        setTierName(res.tierName);
      }
    }).catch(() => {});
  }, []);

  const handleGenerateRandomOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(code);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !otp) return;

    try {
      setSending(true);
      setResult(null);

      // Clean phone number
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);

      // Dispatch request
      const activeKey = selectedKey || (keys[0] ? keys[0].key_prefix + '...' : '');
      const response = await ApiClient.testSendOTP(activeKey, cleanPhone, otp);

      setResult(response);
      if (response.status === 200 && onSuccessDispatch) {
        onSuccessDispatch();
      }
    } catch (err: any) {
      setResult({ status: 500, data: { success: false, message: err.message } });
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', padding: '32px' }}>
      
      {/* Banner */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Dispatch Message
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Send real-time verification codes through primary high-priority carrier channels.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
        
        {/* Form Card */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Select API Key Channel
              </label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <input
                  type="text"
                  placeholder="Paste your secret key (sk_live_...)"
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-main)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px'
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Tip: Enter the secret key created under the "API Keys" section.
              </span>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Mobile Number (India 10-digit)
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
                <Smartphone size={16} color="var(--text-muted)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>+91</span>
                <input
                  type="text"
                  required
                  placeholder="9876543210"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '14px',
                    fontWeight: 600,
                    width: '100%',
                    color: 'var(--text-main)',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  OTP Code (4 to 8 Digits)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateRandomOtp}
                  style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}
                >
                  Generate Random
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="482910"
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-main)',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>

            <div style={{
              backgroundColor: 'var(--bg-app)',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Tariff per Dispatch:</span>
              <span style={{ fontWeight: 700, color: '#3b82f6' }}>
                ₹{otpRate.toFixed(2)} / OTP ({tierName} - Deducted from float)
              </span>
            </div>

            <button
              type="submit"
              disabled={sending}
              style={{
                marginTop: '10px',
                padding: '12px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
              }}
            >
              <Send size={16} />
              <span>{sending ? 'Dispatching to Telecom Route...' : 'Send OTP Message'}</span>
            </button>
          </form>
        </div>

        {/* Live Carrier Terminal Output */}
        <div style={{
          backgroundColor: '#090d16',
          borderRadius: 'var(--radius-xl)',
          padding: '28px',
          border: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Gateway Terminal Monitor
              </span>
              {result && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: result.status === 200 ? '#064e3b' : '#450a0a',
                  color: result.status === 200 ? '#34d399' : '#f87171'
                }}>
                  HTTP {result.status}
                </span>
              )}
            </div>

            {result ? (
              <pre style={{
                margin: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: '#38bdf8',
                lineHeight: 1.6,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            ) : (
              <div style={{ color: '#475569', fontSize: '13px', lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}>
                // Ready for dispatch...
                <br />
                // Waiting for customer request
                <br />
                // End-to-end delivery reports and carrier latency will be printed here
              </div>
            )}
          </div>

          <div style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#64748b'
          }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>High priority transactional route with delivery verification</span>
          </div>
        </div>
      </div>
    </div>
  );
};
