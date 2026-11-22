import React, { useState } from 'react';
import { TurfsyLogo } from '../components/TurfsyLogo';
import { ApiClient } from '../services/api';

interface InviteRequestViewProps {
  inviteMessage: string;
  onGoHome: () => void;
  onGoToLogin: () => void;
}

export function InviteRequestView({ inviteMessage, onGoHome, onGoToLogin }: InviteRequestViewProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim()) {
      setError('Full name and email are required.');
      return;
    }

    setLoading(true);
    try {
      await ApiClient.submitInviteRequest({ fullName, email, company, reason });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0f1e',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{ marginBottom: '28px' }}>
        <TurfsyLogo size={52} />
      </div>

      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        padding: '32px',
      }}>
        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              backgroundColor: '#052e16',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2 style={{ color: '#f1f5f9', fontSize: '20px', fontWeight: 700, margin: '0 0 12px' }}>
              Request Submitted
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, margin: '0 0 28px' }}>
              Your invite request has been received. We will review it and reach out to you at <strong style={{ color: '#f1f5f9' }}>{email}</strong>.
            </p>
            <button
              onClick={onGoHome}
              style={{
                width: '100%',
                padding: '11px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#94a3b8',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Back to Home
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#1e3a5f',
                border: '1px solid #2563eb40',
                borderRadius: '6px',
                padding: '4px 10px',
                marginBottom: '14px',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span style={{ color: '#93c5fd', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em' }}>INVITE ONLY</span>
              </div>
              <h2 style={{ color: '#f1f5f9', fontSize: '20px', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.01em' }}>
                Request Access
              </h2>
              <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
                {inviteMessage}
              </p>
            </div>

            {error && (
              <div style={{
                backgroundColor: '#1a0a0a',
                border: '1px solid #7f1d1d',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#f87171',
                fontSize: '13px',
                marginBottom: '20px',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Company / Organisation <span style={{ color: '#475569', fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Company name"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Intended Use <span style={{ color: '#475569', fontWeight: 400 }}>(optional)</span></label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Briefly describe how you plan to use TurfsyOTPs..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '11px',
                  backgroundColor: loading ? '#1e3a5f' : '#2563eb',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '4px',
                  transition: 'background-color 0.15s',
                }}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
              <button onClick={onGoHome} style={{ background: 'none', border: 'none', color: '#475569', fontSize: '13px', cursor: 'pointer' }}>
                Back to Home
              </button>
              <span style={{ color: '#1e293b' }}>|</span>
              <button onClick={onGoToLogin} style={{ background: 'none', border: 'none', color: '#475569', fontSize: '13px', cursor: 'pointer' }}>
                Already have an account?
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
