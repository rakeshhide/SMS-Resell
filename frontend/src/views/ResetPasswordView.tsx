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
  const [loadingCheck, setLoadingCheck] = useState<boolean>(true);
  const [isValid, setIsValid] = useState<boolean>(false);

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (!urlToken || urlToken.trim().length < 16) {
      setLoadingCheck(false);
      setIsValid(false);
      return;
    }

    const cleanToken = urlToken.trim();
    setToken(cleanToken);

    // Verify token status
    ApiClient.verifyResetToken(cleanToken)
      .then((res) => {
        setIsValid(!!res.valid);
      })
      .catch(() => {
        setIsValid(false);
      })
      .finally(() => {
        setLoadingCheck(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token || !isValid) {
      setError('This reset link has expired. Please request a new one.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      await ApiClient.resetPassword(token, password);

      // Clean the URL
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {}

      setToken('');
      setIsValid(false);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Link expired. Please request a new one.');
    } finally {
      setSubmitting(false);
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
          maxWidth: '440px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          padding: '36px 32px',
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '12px' }}>
            <TurfsyLogo size={40} />
          </div>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
              margin: '0 0 4px 0',
            }}
          >
            Reset Password
          </h1>
        </div>

        {/* State 1: Simple Loading */}
        {loadingCheck ? (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <Loader2
              size={28}
              className="animate-spin"
              style={{ margin: '0 auto 12px auto', color: '#2563eb' }}
            />
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Loading...
            </p>
          </div>
        ) : !isValid && !success ? (
          /* State 2: Clean Simple Link Expired Screen */
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <Clock size={28} />
            </div>

            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: '0 0 8px 0',
              }}
            >
              Link Expired
            </h2>

            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                margin: '0 0 24px 0',
              }}
            >
              This password reset link is invalid or has expired.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={handleRequestNewLink}
                style={{
                  width: '100%',
                  padding: '11px 18px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                }}
              >
                <RotateCcw size={15} />
                <span>Request New Link</span>
              </button>

              <button
                type="button"
                onClick={onGoToLogin}
                style={{
                  width: '100%',
                  padding: '10px 18px',
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
          /* State 3: Clean Success Screen */
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <CheckCircle size={28} />
            </div>

            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: '0 0 6px 0',
              }}
            >
              Password Updated
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                margin: '0 0 24px 0',
              }}
            >
              Your password has been changed successfully.
            </p>

            <button
              onClick={onGoToLogin}
              style={{
                width: '100%',
                padding: '11px 18px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              }}
            >
              <span>Sign In</span>
              <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          /* State 4: Clean Form */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fee2e2',
                  color: '#b91c1c',
                  fontSize: '12px',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
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
                Confirm Password
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
              disabled={submitting || !token}
              style={{
                marginTop: '4px',
                padding: '11px 18px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: submitting || !token ? 'not-allowed' : 'pointer',
                opacity: submitting || !token ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              }}
            >
              <span>{submitting ? 'Updating...' : 'Save Password'}</span>
              <ArrowRight size={15} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
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
                <ArrowLeft size={13} />
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
