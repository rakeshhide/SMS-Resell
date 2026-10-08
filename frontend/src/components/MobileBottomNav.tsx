import React from 'react';
import { LayoutDashboard, Send, Wallet, KeyRound, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenMobileDrawer: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMobileDrawer,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'send-otp', label: 'Send OTP', icon: Send },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'api-keys', label: 'API Keys', icon: KeyRound },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
      <div className="mobile-bottom-nav-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
              aria-label={tab.label}
            >
              <div className="mobile-bottom-nav-icon-wrapper">
                <Icon size={20} />
              </div>
              <span className="mobile-bottom-nav-label">{tab.label}</span>
            </button>
          );
        })}

        {/* More Button: Opens Drawer for Analytics, Docs, Admin, Theme, Sign Out */}
        <button
          onClick={onOpenMobileDrawer}
          className="mobile-bottom-nav-item"
          aria-label="Open Full Menu Drawer"
        >
          <div className="mobile-bottom-nav-icon-wrapper">
            <Menu size={20} />
          </div>
          <span className="mobile-bottom-nav-label">More</span>
        </button>
      </div>
    </nav>
  );
};
