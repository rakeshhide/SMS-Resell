import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  Building,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  ShieldCheck,
  Wallet,
  Loader2,
} from 'lucide-react';
import { TurfsyLogo } from '../components/TurfsyLogo';
import { ApiClient } from '../services/api';
import { User } from '../types';

export type AuthMode = 'signin' | 'signup' | 'forgot';

interface AuthViewProps {
  initialMode?: AuthMode;
  onSuccess: (user: User, token: string) => void;
  onGoHome: () => void;
  darkMode?: boolean;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'signin',
  onSuccess,
  onGoHome,
  darkMode = false,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setForgotSuccess(false);
  }, [initialMode]);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setForgotSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await ApiClient.register(fullName, email, password, companyName);
        ApiClient.setToken(res.token);
        onSuccess(res.user, res.token);
      } else if (mode === 'signin') {
        const res = await ApiClient.login(email, password);
        ApiClient.setToken(res.token);
        onSuccess(res.user, res.token);
      } else if (mode === 'forgot') {
        await ApiClient.forgotPassword(email);
        setForgotSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-main)',
        fontFamily: 'inherit',
      }}
    >
      {/* LEFT COLUMN: Modern Branded Infrastructure Showcase (Desktop Only, Responsive) */}
      <div
        className="auth-showcase-column"
        style={{
          flex: '1 1 50%',
          background: 'linear-gradient(145deg, #090d16 0%, #0f172a 60%, #172554 100%)',
          color: '#ffffff',
          padding: '56px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Subtle Ambient Glows */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            left: '-10%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.22) 0%, rgba(37, 99, 235, 0) 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-10%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.16) 0%, rgba(14, 165, 233, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top Header */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <button
            type="button"
            onClick={onGoHome}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#e2e8f0',
              padding: '9px 18px',
              borderRadius: '999px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              marginBottom: '40px',
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to TurfsyOTPs Home</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
            <TurfsyLogo size={50} />
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                TurfsyOTPs
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
                High-Throughput Telecom Gateway
              </div>
            </div>
          </div>

          <h2
            style={{
              fontSize: '32px',
              fontWeight: 800,
              lineHeight: 1.25,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              maxWidth: '520px',
              margin: '0 0 16px 0',
            }}
          >
            Enterprise SMS & OTP Infrastructure Built for Developers
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: '#94a3b8',
              lineHeight: 1.6,
              maxWidth: '480px',
              margin: 0,
            }}
          >
            Reliable, carrier-grade SMS dispatch with sub-second latency, multi-route fallback, and real-time ledger accounting.
          </p>
        </div>

        {/* Core Value Pillars */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            margin: '40px 0',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Zap size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '3px' }}>
                Ultra-Low Latency Delivery
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.4 }}>
                Sub-second OTP verification speeds backed by enterprise tier-1 carrier routes.
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '3px' }}>
                Bank-Grade Cryptographic Security
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.4 }}>
                Secure SHA-256 hashed API keys, automated brute-force defense, and strict ledger auditing.
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Wallet size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '3px' }}>
                Flexible Developer Wallet
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.4 }}>
                Transparent pay-as-you-go pricing with instant Razorpay top-ups and zero recurring monthly fees.
              </div>
            </div>
          </div>
        </div>

        {/* Metric Badges */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>99.98% Gateway SLA</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>Zero Monthly Minimums</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>Instant API Activation</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Dedicated Seamless Authentication Section (Spacious, No boxed card) */}
      <div
        className="auth-form-column"
        style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px 36px',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Seamless Inner Container (Expanded to 480px, no artificial card border) */}
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Top Brand / Home Navigation Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TurfsyLogo size={36} />
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                TurfsyOTPs
              </span>
            </div>

            <button
              type="button"
              onClick={onGoHome}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '6px',
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </button>
          </div>

          {/* Seamless Mode Switcher (Sign In vs Create Account) */}
          {mode !== 'forgot' && (
            <div
              style={{
                display: 'flex',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '10px',
                padding: '4px',
                marginBottom: '32px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => switchMode('signin')}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: mode === 'signin' ? 700 : 500,
                  color: mode === 'signin' ? '#ffffff' : 'var(--text-muted)',
                  backgroundColor: mode === 'signin' ? '#2563eb' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: mode === 'signin' ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: mode === 'signup' ? 700 : 500,
                  color: mode === 'signup' ? '#ffffff' : 'var(--text-muted)',
                  backgroundColor: mode === 'signup' ? '#2563eb' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: mode === 'signup' ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none',
                }}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Form Title & Subtitle */}
          <div style={{ marginBottom: '24px' }}>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--text-main)',
                letterSpacing: '-0.02em',
                margin: '0 0 8px 0',
              }}
            >
              {mode === 'signin'
                ? 'Welcome Back'
                : mode === 'signup'
                ? 'Create Your Developer Account'
                : 'Recover Your Account'}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              {mode === 'signin'
                ? 'Enter your credentials to access your API keys, SMS balance, and telemetry.'
                : mode === 'signup'
                ? 'Sign up to generate instant API keys and dispatch high-speed OTPs.'
                : 'Enter your registered email address and we will dispatch a password reset link.'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                color: '#b91c1c',
                fontSize: '13px',
                lineHeight: 1.4,
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Forgot Password Success Message */}
          {mode === 'forgot' && forgotSuccess ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                <CheckCircle2 size={30} />
              </div>

              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  margin: '0 0 8px 0',
                }}
              >
                Recovery Link Dispatched
              </h2>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  margin: '0 0 28px 0',
                }}
              >
                If an account exists for <strong>{email}</strong>, we have dispatched a password reset link. The link is valid for 15 minutes.
              </p>

              <button
                type="button"
                onClick={() => switchMode('signin')}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                }}
              >
                <ArrowLeft size={16} />
                <span>Back to Sign In</span>
              </button>
            </div>
          ) : (
            /* Main Form (Spacious inputs, no small boxed border) */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Full Name & Company Name (Sign Up only) */}
              {mode === 'signup' && (
                <>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginBottom: '6px',
                      }}
                    >
                      Full Name
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '12px 14px',
                      }}
                    >
                      <UserIcon size={17} color="var(--text-muted)" />
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          outline: 'none',
                          fontSize: '14px',
                          width: '100%',
                          color: 'var(--text-main)',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginBottom: '6px',
                      }}
                    >
                      Company / Organization (Optional)
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '12px 14px',
                      }}
                    >
                      <Building size={17} color="var(--text-muted)" />
                      <input
                        type="text"
                        placeholder="Acme Corp"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          outline: 'none',
                          fontSize: '14px',
                          width: '100%',
                          color: 'var(--text-main)',
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '6px',
                  }}
                >
                  Work Email Address
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                  }}
                >
                  <Mail size={17} color="var(--text-muted)" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '14px',
                      width: '100%',
                      color: 'var(--text-main)',
                    }}
                  />
                </div>
              </div>

              {/* Password (Sign In & Sign Up) */}
              {mode !== 'forgot' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                    }}
                  >
                    <Lock size={17} color="var(--text-muted)" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter account password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        fontSize: '14px',
                        width: '100%',
                        color: 'var(--text-main)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: 'var(--text-muted)',
                      }}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '8px',
                  padding: '13px 20px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Please wait...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'signin'
                        ? 'Sign In to Developer Console'
                        : mode === 'signup'
                        ? 'Create Developer Account'
                        : 'Send Password Reset Link'}
                    </span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Bottom Mode Switcher */}
              <div style={{ textAlign: 'center', marginTop: '14px' }}>
                {mode === 'signin' ? (
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '14px',
                      }}
                    >
                      Create account free
                    </button>
                  </p>
                ) : mode === 'signup' ? (
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '14px',
                      }}
                    >
                      Sign In
                    </button>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Sign In</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Security & Compliance Notice */}
          <div style={{ marginTop: '36px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Protected with TLS 1.3 & AES-256 encryption. By continuing you accept the{' '}
              <a
                href="#terms"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = 'terms';
                }}
                style={{ color: '#2563eb', textDecoration: 'none' }}
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="#privacy"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = 'privacy';
                }}
                style={{ color: '#2563eb', textDecoration: 'none' }}
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Embedded CSS for seamless mobile responsiveness */}
      <style>{`
        @media (max-width: 1024px) {
          .auth-showcase-column {
            display: none !important;
          }
          .auth-form-column {
            flex: 1 1 100% !important;
            padding: 36px 20px !important;
          }
        }
      `}</style>
    </div>
  );
};
