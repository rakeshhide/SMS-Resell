import React, { useState, useEffect } from 'react';
import {
  Lock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
  ShieldAlert,
  Clock,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { TurfsyLogo } from '../components/TurfsyLogo';
import { ApiClient } from '../services/api';

interface ResetPasswordViewProps {
  onGoToLogin: () => void;
  onForgotPassword?: () => void;
  onGoHome: () => void;
  darkMode?: boolean;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({
  onGoToLogin,
  onForgotPassword,
  onGoHome,
  darkMode = false,
}) => {
  const [token, setToken] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(true);
  const [tokenStatus, setTokenStatus] = useState<'valid' | 'used' | 'expired' | 'invalid'>('valid');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Extract token from URL search parameters (?token=...)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (!urlToken || urlToken.trim().length < 16) {
      setVerifying(false);
      setTokenStatus('invalid');
      setStatusMessage('No valid password reset token provided. Please request a new reset link.');
      return;
    }

    const cleanToken = urlToken.trim();
    setToken(cleanToken);

    // Actively verify token validity, expiration, and used status against DB
    ApiClient.verifyResetToken(cleanToken)
      .then((res) => {
        if (!res.valid) {
          setTokenStatus(res.reason || 'invalid');
          setStatusMessage(res.message);
        } else {
          setTokenStatus('valid');
        }
      })
      .catch((err) => {
        setTokenStatus('invalid');
        setStatusMessage(err.message || 'Unable to verify reset link security. Please request a new link.');
      })
      .finally(() => {
        setVerifying(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token || tokenStatus !== 'valid') {
      setError('This password reset link is no longer valid. Please request a new reset link.');
      return;
    }

    if (password.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your entries.');
      return;
    }

    setLoading(true);

    try {
      await ApiClient.resetPassword(token, password);

      // Instantly erase the token from the browser address bar for security
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {}

      // Immediately invalidate local token state
      setToken('');
      setTokenStatus('used');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNewLink = () => {
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      onGoToLogin();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          padding: '36px 32px',
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '14px' }}>
            <TurfsyLogo size={42} />
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
              margin: '0 0 6px 0',
            }}
          >
            Reset Password
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            TurfsyOTPs Cryptographic Account Recovery
          </p>
        </div>

        {/* State 1: Verifying Token Screen */}
        {verifying ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px auto',
              }}
            >
              <Loader2 size={28} className="animate-spin" />
            </div>
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: '0 0 6px 0',
              }}
            >
              Verifying Security Token...
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Checking reset link validity and 15-minute expiration window.
            </p>
          </div>
        ) : tokenStatus !== 'valid' && !success ? (
          /* State 2: Expired / Already Used / Invalid Link Screen */
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: tokenStatus === 'used' ? '#fef3c7' : '#fee2e2',
                color: tokenStatus === 'used' ? '#d97706' : '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px auto',
              }}
            >
              {tokenStatus === 'used' ? (
                <ShieldAlert size={32} />
              ) : tokenStatus === 'expired' ? (
                <Clock size={32} />
              ) : (
                <AlertCircle size={32} />
              )}
            </div>

            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: '0 0 10px 0',
              }}
            >
              {tokenStatus === 'used'
                ? 'Reset Link Already Used'
                : tokenStatus === 'expired'
                ? 'Reset Link Expired'
                : 'Invalid Reset Link'}
            </h2>

            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: '0 0 24px 0',
              }}
            >
              {tokenStatus === 'used'
                ? 'This password reset link has already been used to change your password and is permanently expired. Each security link can only be used once.'
                : tokenStatus === 'expired'
                ? 'This password reset link has expired. Password reset links are strictly active for 15 minutes to keep your developer account protected.'
                : statusMessage || 'This password reset link is invalid or malformed. Please request a new link.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={handleRequestNewLink}
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
                <RotateCcw size={16} />
                <span>Request New Reset Link</span>
              </button>

              <button
                type="button"
                onClick={onGoToLogin}
                style={{
                  width: '100%',
                  padding: '11px 20px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : success ? (
          /* State 3: Password Updated Success Screen */
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
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
                margin: '0 auto 20px auto',
              }}
            >
              <CheckCircle size={32} />
            </div>

            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: '0 0 8px 0',
              }}
            >
              Password Updated Successfully
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                margin: '0 0 28px 0',
              }}
            >
              Your account password has been updated. This reset link is now permanently expired. You can sign in immediately.
            </p>

            <button
              onClick={onGoToLogin}
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
              <span>Sign In to Dashboard</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          /* State 4: Valid Token - Form Screen */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fee2e2',
                  color: '#b91c1c',
                  fontSize: '13px',
                  lineHeight: 1.4,
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

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
                New Password
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
              >
                <Lock size={16} color="var(--text-muted)" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '13px',
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
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
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
                Confirm New Password
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
              >
                <KeyRound size={16} color="var(--text-muted)" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '13px',
                    width: '100%',
                    color: 'var(--text-main)',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              style={{
                marginTop: '8px',
                padding: '12px 20px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading || !token ? 'not-allowed' : 'pointer',
                opacity: loading || !token ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              }}
            >
              <span>{loading ? 'Updating Password...' : 'Save New Password'}</span>
              <ArrowRight size={16} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <button
                type="button"
                onClick={onGoHome}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ArrowLeft size={14} />
                <span>Home</span>
              </button>

              <button
                type="button"
                onClick={onGoToLogin}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
