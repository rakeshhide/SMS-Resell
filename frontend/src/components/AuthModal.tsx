import React, { useState, useEffect } from 'react';
import { Lock, Mail, User as UserIcon, Building, ArrowRight, ArrowLeft, CheckCircle2, X } from 'lucide-react';
import { ApiClient } from '../services/api';
import { User } from '../types';
import { TurfsyLogo } from './TurfsyLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSignUpDefault?: boolean;
  initialMode?: 'signin' | 'signup' | 'forgot';
  onSuccess: (user: User, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  isSignUpDefault = false,
  initialMode,
  onSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>(
    initialMode || (isSignUpDefault ? 'signup' : 'signin')
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode || (isSignUpDefault ? 'signup' : 'signin'));
      setError(null);
      setForgotSuccess(false);
    }
  }, [isOpen, isSignUpDefault, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authMode === 'signup') {
        const res = await ApiClient.register(fullName, email, password, companyName);
        ApiClient.setToken(res.token);
        onSuccess(res.user, res.token);
        onClose();
      } else if (authMode === 'signin') {
        const res = await ApiClient.login(email, password);
        ApiClient.setToken(res.token);
        onSuccess(res.user, res.token);
        onClose();
      } else if (authMode === 'forgot') {
        await ApiClient.forgotPassword(email);
        setForgotSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TurfsyLogo size={32} />
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
              {authMode === 'signup'
                ? 'Create Account'
                : authMode === 'forgot'
                ? 'Reset Password'
                : 'Sign In to turfsyOTPs'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {authMode === 'forgot' && forgotSuccess ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <CheckCircle2 size={28} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px 0' }}>
              Check Your Inbox
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              If an account exists for <strong>{email}</strong>, a secure password recovery link has been dispatched. The link is valid for 15 minutes.
            </p>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setForgotSuccess(false);
              }}
              style={{
                width: '100%',
                padding: '11px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {authMode === 'forgot' && (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
                Enter the email address registered with your account. We'll send you an encrypted recovery link.
              </p>
            )}

            {authMode === 'signup' && (
              <>
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Full Name
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '4px',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                  >
                    <UserIcon size={16} color="var(--text-muted)" />
                    <input
                      type="text"
                      required
                      placeholder="Alex Morgan"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
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

                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Company Name (Optional)
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '4px',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                  >
                    <Building size={16} color="var(--text-muted)" />
                    <input
                      type="text"
                      placeholder="Acme Payments Inc."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
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
              </>
            )}

            <div>
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                Work Email
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '4px',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
              >
                <Mail size={16} color="var(--text-muted)" />
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
                    fontSize: '13px',
                    width: '100%',
                    color: 'var(--text-main)',
                  }}
                />
              </div>
            </div>

            {authMode !== 'forgot' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Password
                  </label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setError(null);
                        setForgotSuccess(false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#3b82f6',
                        fontSize: '12px',
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
                    gap: '8px',
                    marginTop: '4px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                >
                  <Lock size={16} color="var(--text-muted)" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
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
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '10px',
                padding: '12px',
                backgroundColor: '#3b82f6',
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
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
              }}
            >
              <span>
                {loading
                  ? 'Processing...'
                  : authMode === 'signup'
                  ? 'Create Developer Account'
                  : authMode === 'forgot'
                  ? 'Send Recovery Link'
                  : 'Sign In'}
              </span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {authMode === 'forgot' ? (
            <button
              onClick={() => {
                setAuthMode('signin');
                setError(null);
                setForgotSuccess(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Sign In</span>
            </button>
          ) : authMode === 'signup' ? (
            <span>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setError(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setError(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Create One
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
