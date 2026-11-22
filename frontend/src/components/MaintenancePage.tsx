import React from 'react';
import { TurfsyLogo } from './TurfsyLogo';
import { ShieldCheck, ArrowLeft, Power, LogIn, Lock } from 'lucide-react';

interface MaintenancePageProps {
  message: string;
  onGoHome?: () => void;
  onAdminLogin?: () => void;
  isAdmin?: boolean;
  onTurnOffMaintenance?: () => void;
  onLogout?: () => void;
}

export function MaintenancePage({
  message,
  onGoHome,
  onAdminLogin,
  isAdmin = false,
  onTurnOffMaintenance,
  onLogout,
}: MaintenancePageProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0f1e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div style={{ marginBottom: '28px' }}>
        <TurfsyLogo size={64} />
      </div>

      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#1e3a5f',
            border: '1px solid #2563eb',
            borderRadius: '6px',
            padding: '6px 14px',
            marginBottom: '24px',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
              display: 'inline-block',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <span style={{ color: '#93c5fd', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em' }}>
            SCHEDULED MAINTENANCE
          </span>
        </div>

        <h1
          style={{
            color: '#f1f5f9',
            fontSize: '28px',
            fontWeight: 800,
            margin: '0 0 14px',
            letterSpacing: '-0.02em',
            lineHeight: 1.3,
          }}
        >
          Developer Console Under Maintenance
        </h1>

        <p
          style={{
            color: '#94a3b8',
            fontSize: '15px',
            lineHeight: 1.65,
            margin: '0 0 28px',
          }}
        >
          {message || 'The platform is currently undergoing scheduled infrastructure upgrades. Developer console access is temporarily restricted.'}
        </p>

        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            textAlign: 'left',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={18} color="#10b981" />
            <span style={{ color: '#cbd5e1', fontSize: '13px' }}>
              Carrier telecom routes & programmatic API delivery remain 100% active
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={18} color="#10b981" />
            <span style={{ color: '#cbd5e1', fontSize: '13px' }}>
              Wallet balances, API keys, and ledgers are completely secure
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Lock size={18} color="#f59e0b" />
            <span style={{ color: '#cbd5e1', fontSize: '13px' }}>
              Developer dashboard login is restricted until maintenance concludes
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isAdmin && onTurnOffMaintenance && (
            <button
              onClick={onTurnOffMaintenance}
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Power size={16} />
              <span>Turn Off Maintenance Mode Now</span>
            </button>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {onGoHome && (
              <button
                onClick={onGoHome}
                style={{
                  flex: 1,
                  minWidth: '160px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px 18px',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={16} />
                <span>Back to Website Home</span>
              </button>
            )}

            {!isAdmin && onAdminLogin && (
              <button
                onClick={onAdminLogin}
                style={{
                  flex: 1,
                  minWidth: '160px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px 18px',
                  backgroundColor: 'transparent',
                  color: '#93c5fd',
                  border: '1px solid #1e3a5f',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <LogIn size={16} />
                <span>Administrator Sign In</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                style={{
                  padding: '11px 16px',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            )}
          </div>
        </div>

        <p style={{ color: '#475569', fontSize: '12px', marginTop: '32px' }}>
          TurfsyOTPs Infrastructure Gateway &nbsp;|&nbsp; turfsyotps.dev
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
