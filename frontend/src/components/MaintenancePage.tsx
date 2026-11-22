import React from 'react';
import { TurfsyLogo } from './TurfsyLogo';

interface MaintenancePageProps {
  message: string;
}

export function MaintenancePage({ message }: MaintenancePageProps) {
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
      <div style={{ marginBottom: '32px' }}>
        <TurfsyLogo size={64} />
      </div>

      <div style={{
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#1e3a5f',
          border: '1px solid #2563eb',
          borderRadius: '6px',
          padding: '6px 14px',
          marginBottom: '28px',
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#f59e0b',
            display: 'inline-block',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <span style={{ color: '#93c5fd', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em' }}>
            SCHEDULED MAINTENANCE
          </span>
        </div>

        <h1 style={{
          color: '#f1f5f9',
          fontSize: '28px',
          fontWeight: 700,
          margin: '0 0 16px',
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
        }}>
          Platform Temporarily Unavailable
        </h1>

        <p style={{
          color: '#94a3b8',
          fontSize: '15px',
          lineHeight: 1.7,
          margin: '0 0 36px',
        }}>
          {message}
        </p>

        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>API services and OTP delivery remain active</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Wallet balances and data are safe and unchanged</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Dashboard access temporarily restricted</span>
          </div>
        </div>

        <p style={{ color: '#475569', fontSize: '12px', marginTop: '28px' }}>
          TurfsyOTPs Platform &nbsp;|&nbsp; turfsyotps.dev
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
