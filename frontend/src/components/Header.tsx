import React from 'react';
import { Search, Bell, Shield, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  title: string;
  user: User | null;
  onOpenWalletModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, user, onOpenWalletModal }) => {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 32px',
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div>
        <h1 style={{
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--text-main)',
          letterSpacing: '-0.02em',
        }}>
          {title}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--bg-app)',
          padding: '8px 14px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          width: '260px',
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search API keys, logs..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '13px',
              color: 'var(--text-main)',
              width: '100%',
            }}
          />
        </div>

        {/* Notification Bell */}
        <button
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            position: 'relative'
          }}
          title="Notifications"
        >
          <Bell size={18} />
          <span style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#10b981'
          }}></span>
        </button>

        {/* User Profile Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '4px 10px 4px 4px',
          borderRadius: '30px',
          backgroundColor: 'var(--bg-app)',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: user?.role === 'admin' ? '#8b5cf6' : '#3b82f6',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 700,
          }}>
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <UserIcon size={16} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-main)',
              lineHeight: 1.2
            }}>
              {user?.fullName || 'Developer'}
            </span>
            <span style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {user?.role === 'admin' && <Shield size={10} color="#8b5cf6" />}
              {user?.role === 'admin' ? 'Administrator' : 'Developer Plan'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
