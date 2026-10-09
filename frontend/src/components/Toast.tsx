import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: 'min(92vw, 400px)',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'var(--bg-surface, #ffffff)',
          border: '#10b981',
          iconColor: '#10b981',
          Icon: CheckCircle2,
          barBg: '#10b981'
        };
      case 'error':
        return {
          bg: 'var(--bg-surface, #ffffff)',
          border: '#ef4444',
          iconColor: '#ef4444',
          Icon: AlertCircle,
          barBg: '#ef4444'
        };
      case 'warning':
        return {
          bg: 'var(--bg-surface, #ffffff)',
          border: '#f59e0b',
          iconColor: '#f59e0b',
          Icon: AlertTriangle,
          barBg: '#f59e0b'
        };
      default:
        return {
          bg: 'var(--bg-surface, #ffffff)',
          border: '#3b82f6',
          iconColor: '#3b82f6',
          Icon: Info,
          barBg: '#3b82f6'
        };
    }
  };

  const { bg, border, iconColor, Icon, barBg } = getStyles();

  return (
    <div
      style={{
        pointerEvents: 'auto',
        backgroundColor: bg,
        border: `1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))`,
        borderLeft: `4px solid ${border}`,
        borderRadius: '10px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        position: 'relative',
        animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}
    >
      <div style={{ color: iconColor, marginTop: '2px', flexShrink: 0 }}>
        <Icon size={18} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main, #ffffff)', marginBottom: '2px' }}>
            {toast.title}
          </div>
        )}
        <div style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.4, wordBreak: 'break-word' }}>
          {toast.message}
        </div>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted, #64748b)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <X size={15} />
      </button>
    </div>
  );
};
