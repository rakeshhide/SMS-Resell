import React, { useState } from 'react';
import { TurfsyLogo } from '../components/TurfsyLogo';
import { ApiClient } from '../services/api';
import { User } from '../types';
import {
  ShieldAlert,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Sliders,
} from 'lucide-react';

interface AdminMaintenanceLoginViewProps {
  onSuccess: (user: User, token: string) => void;
  onBackToMaintenance: () => void;
  onGoHome: () => void;
  maintenanceMessage?: string;
}

export const AdminMaintenanceLoginView: React.FC<AdminMaintenanceLoginViewProps> = ({
  onSuccess,
  onBackToMaintenance,
  onGoHome,
  maintenanceMessage,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await ApiClient.login(email.trim(), password);

      // Verify that this is indeed an administrator account
      if (res.user.role !== 'admin') {
        setError('Access Denied: This portal is restricted to system administrators during active maintenance.');
        setLoading(false);
        return;
      }

      ApiClient.setToken(res.token);
      onSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

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
      <div style={{ marginBottom: '24px' }}>
        <TurfsyLogo size={56} />
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '20px',
          padding: '36px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Security Badge */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1e1b4b',
              border: '1px solid #3730a3',
              borderRadius: '9999px',
              padding: '5px 14px',
              color: '#a5b4fc',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <ShieldAlert size={14} color="#818cf8" />
            <span>Maintenance Override Portal</span>
          </div>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#f8fafc',
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
            }}
          >
            Administrator Console Access
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
            {maintenanceMessage
              ? `Maintenance in progress: "${maintenanceMessage}". Authenticate with root administrator credentials.`
              : 'Enter authorized administrator credentials to manage platform operational controls.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: '#450a0a',
              border: '1px solid #7f1d1d',
              color: '#fca5a5',
              fontSize: '13px',
              lineHeight: 1.45,
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '6px',
              }}
            >
              Administrator Email Address
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#090d16',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '11px 14px',
              }}
            >
              <Mail size={16} color="#64748b" />
              <input
                type="email"
                required
                placeholder="admin@nexusotp.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '14px',
                  width: '100%',
                  color: '#f8fafc',
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '6px',
              }}
            >
              Administrator Password
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#090d16',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '11px 14px',
              }}
            >
              <Lock size={16} color="#64748b" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter administrator password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '14px',
                  width: '100%',
                  color: '#f8fafc',
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
                  color: '#64748b',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '6px',
              padding: '12px 20px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Authenticating root session...</span>
              </>
            ) : (
              <>
                <Sliders size={16} />
                <span>Authenticate & Access Admin Center</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Back navigation buttons */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
          }}
        >
          <button
            type="button"
            onClick={onBackToMaintenance}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: 0,
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={13} />
            <span>Maintenance Status</span>
          </button>

          <button
            type="button"
            onClick={onGoHome}
            style={{
              background: 'none',
              border: 'none',
              color: '#60a5fa',
              cursor: 'pointer',
              padding: 0,
              fontWeight: 600,
              textDecoration: 'underline',
            }}
          >
            Public Website Home
          </button>
        </div>
      </div>

      <div style={{ marginTop: '28px', color: '#475569', fontSize: '12px' }}>
        TurfsyOTPs Infrastructure Gateway &nbsp;&bull;&nbsp; Administrator Override
      </div>
    </div>
  );
};
