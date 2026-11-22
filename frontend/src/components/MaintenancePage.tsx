import React from 'react';
import { ArrowLeft, ExternalLink, BarChart2, Wallet, Lock } from 'lucide-react';

interface MaintenancePageProps {
  message?: string;
  onGoHome?: () => void;
  onAdminLogin?: () => void;
  onLogout?: () => void;
}

export function MaintenancePage({
  message,
  onGoHome,
  onAdminLogin,
  onLogout,
}: MaintenancePageProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Centered Modal Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.03)',
          padding: '40px 36px 36px',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        {/* Top Logo Icon (Dark rounded square with T symbol) */}
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '18px',
            backgroundColor: '#0b1329',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 18px -4px rgba(11, 19, 41, 0.25)',
          }}
        >
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
            <path
              d="M7 11C7 9.34315 8.34315 8 10 8H22C23.6569 8 25 9.34315 25 11C25 12.6569 23.6569 14 22 14H18V22C18 23.6569 16.6569 25 15 25C13.3431 25 12 23.6569 12 22V14H10C8.34315 14 7 12.6569 7 11Z"
              fill="#ffffff"
            />
            <path
              d="M13 11C13 9.89543 13.8954 9 15 9H21C22.1046 9 23 9.89543 23 11C23 12.1046 22.1046 13 21 13H17.5V21C17.5 22.1046 16.6046 23 15.5 23C14.3954 23 13.5 22.1046 13.5 21V13H15C13.8954 13 13 12.1046 13 11Z"
              fill="#3b82f6"
            />
          </svg>
        </div>

        {/* Status Pill Badge */}
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #d1fae5',
              borderRadius: '9999px',
              padding: '4px 14px',
              color: '#059669',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'inline-block',
              }}
            />
            <span>Platform Operational</span>
          </div>
        </div>

        {/* Headings */}
        <h1
          style={{
            fontSize: '30px',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 10px',
            letterSpacing: '-0.025em',
            lineHeight: 1.25,
          }}
        >
          Developer Console
          <br />
          <span style={{ color: '#2563eb' }}>Under Maintenance</span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '14px',
            color: '#64748b',
            margin: '0 0 24px',
            lineHeight: 1.55,
          }}
        >
          {message || 'We are working to improve your experience. Please check back later.'}
        </p>

        {/* Subtle Divider */}
        <div
          style={{
            borderTop: '1px solid #f1f5f9',
            marginBottom: '22px',
          }}
        />

        {/* Bullet List */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            textAlign: 'left',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <BarChart2 size={18} color="#0f172a" style={{ flexShrink: 0 }} />
            <span style={{ color: '#334155', fontSize: '13px', fontWeight: 500, lineHeight: 1.4 }}>
              Carrier telecom routes &amp; programmatic API delivery remain 100% active
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Wallet size={18} color="#0f172a" style={{ flexShrink: 0 }} />
            <span style={{ color: '#334155', fontSize: '13px', fontWeight: 500, lineHeight: 1.4 }}>
              Wallet balances, API keys, and ledgers are completely secure
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Lock size={18} color="#0f172a" style={{ flexShrink: 0 }} />
            <span style={{ color: '#334155', fontSize: '13px', fontWeight: 500, lineHeight: 1.4 }}>
              Developer dashboard login is restricted until maintenance concludes
            </span>
          </div>
        </div>

        {/* Action Button Row */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {onGoHome && (
            <button
              type="button"
              onClick={onGoHome}
              style={{
                flex: '1 1 140px',
                padding: '11px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#0f172a',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Website</span>
            </button>
          )}

          {onAdminLogin && (
            <button
              type="button"
              onClick={onAdminLogin}
              style={{
                flex: '1.25 1 170px',
                padding: '11px 18px',
                backgroundColor: '#1d4ed8',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(29, 78, 216, 0.25)',
              }}
            >
              <ExternalLink size={14} />
              <span>Administrator Sign In</span>
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              style={{
                padding: '11px 18px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <div style={{ marginTop: '28px', color: '#94a3b8', fontSize: '12px', fontWeight: 500 }}>
        TurfsyOTPs &nbsp;&bull;&nbsp; Infrastructure Gateway
      </div>
    </div>
  );
}
