import React from 'react';
import {
  LayoutDashboard,
  ListOrdered,
  TrendingUp,
  KeyRound,
  Send,
  Wallet,
  CodeXml,
  ShieldCheck,
  LogOut,
  Moon,
  Sun,
  Radio,
  Globe,
  X,
  LifeBuoy
} from 'lucide-react';
import { User } from '../types';
import { TurfsyLogo } from './TurfsyLogo';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onViewLanding: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onLogout,
  darkMode,
  setDarkMode,
  onViewLanding,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ListOrdered },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'api-keys', label: 'API Keys', icon: KeyRound },
    { id: 'send-otp', label: 'Send OTP', icon: Send },
    { id: 'wallet', label: 'Wallet & Billing', icon: Wallet },
    { id: 'docs', label: 'API Documentation', icon: CodeXml },
    { id: 'support', label: 'Support & Help', icon: LifeBuoy },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Center', icon: ShieldCheck });
  }

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-mobile-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={onCloseMobile}
      />

      <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div>
          {/* Brand Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px 24px 8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <TurfsyLogo size={38} />
              <div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  turfsy<span style={{ color: '#38bdf8' }}>OTPs</span>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#64748b',
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  Telecom Gateway v2.4
                </div>
              </div>
            </div>

            {/* Mobile Close Button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                style={{
                  display: mobileOpen ? 'flex' : 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#94a3b8',
                }}
                title="Close Navigation"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Navigation List */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                    backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.15s ease'
                  }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)';
                    e.currentTarget.style.color = '#cbd5e1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--sidebar-text)';
                  }
                }}
              >
                <Icon size={18} color={isActive ? '#60a5fa' : 'currentColor'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <button
          onClick={onViewLanding}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            color: 'var(--sidebar-text)',
            textAlign: 'left',
            width: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--sidebar-text)';
          }}
        >
          <Globe size={18} />
          <span>Landing Page</span>
        </button>

        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            color: 'var(--sidebar-text)',
            textAlign: 'left',
            width: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--sidebar-text)';
          }}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            color: '#ef4444',
            textAlign: 'left',
            width: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  </>
);
};
