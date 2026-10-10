import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { AnalyticsView } from './views/AnalyticsView';
import { ApiKeysView } from './views/ApiKeysView';
import { SendOtpView } from './views/SendOtpView';
import { WalletView } from './views/WalletView';
import { DocsView } from './views/DocsView';
import { AdminView } from './views/AdminView';
import { SupportView } from './views/SupportView';
import { LandingPageView } from './views/LandingPageView';
import { LegalView, LegalTab } from './views/LegalView';
import { AuthModal } from './components/AuthModal';
import { WalletRechargeModal } from './components/WalletRechargeModal';
import { User } from './types';
import { ApiClient } from './services/api';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [viewingLanding, setViewingLanding] = useState<boolean>(false);
  const [legalViewTab, setLegalViewTab] = useState<LegalTab | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalIsSignUp, setAuthModalIsSignUp] = useState<boolean>(false);
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check URL hash for direct policy routing
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['terms', 'privacy', 'aup', 'refund'].includes(hash)) {
        setLegalViewTab(hash as LegalTab);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);

    // Check initial user session
    ApiClient.getMe().then((res) => {
      if (res?.user) {
        setUser(res.user);
        setViewingLanding(false);
      } else {
        setViewingLanding(true);
      }
    }).catch(() => {
      setViewingLanding(true);
    });

    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleLogout = () => {
    ApiClient.clearToken();
    setUser(null);
    setViewingLanding(true);
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setViewingLanding(false);
    setCurrentTab('dashboard');
  };

  const handleWalletSuccess = (newBalance: number) => {
    if (user) {
      setUser({ ...user, balance: newBalance });
    }
    window.location.reload();
  };

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard';
      case 'transactions': return 'Transactions';
      case 'analytics': return 'Analytics';
      case 'api-keys': return 'API Keys';
      case 'send-otp': return 'Send OTP';
      case 'wallet': return 'Wallet & Billing';
      case 'docs': return 'Developer Documentation';
      case 'support': return 'Support & Help';
      case 'admin': return 'Admin Center';
      case 'legal': return 'Compliance, Legal & Refund Policies';
      default: return 'Overview';
    }
  };

  return (
    <div className={darkMode ? 'dark-mode' : ''} style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {legalViewTab !== null ? (
        <LegalView
          initialTab={legalViewTab}
          onBack={() => {
            setLegalViewTab(null);
            window.location.hash = '';
          }}
          darkMode={darkMode}
        />
      ) : viewingLanding ? (
        <LandingPageView
          onOpenAuth={(isSignUp = false) => {
            setAuthModalIsSignUp(isSignUp);
            setAuthModalOpen(true);
          }}
          onGoToDashboard={() => setViewingLanding(false)}
          isLoggedIn={!!user}
          onOpenLegal={(tab) => setLegalViewTab(tab)}
        />
      ) : (
        <div className="app-container">
          {/* Dark Contrast Responsive Sidebar */}
          <Sidebar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            user={user}
            onLogout={handleLogout}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onViewLanding={() => setViewingLanding(true)}
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />

          {/* Main Area */}
          <div className="app-main-content">
            <Header
              title={getTabTitle(currentTab)}
              user={user}
              onOpenWalletModal={() => setWalletModalOpen(true)}
              onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            />

            <main style={{ flex: 1, overflowY: 'auto' }}>
              {currentTab === 'dashboard' && (
                <DashboardView
                  user={user}
                  onNavigate={(tab) => setCurrentTab(tab)}
                  onOpenWalletModal={() => setWalletModalOpen(true)}
                />
              )}
              {currentTab === 'transactions' && <TransactionsView />}
              {currentTab === 'analytics' && <AnalyticsView />}
              {currentTab === 'api-keys' && <ApiKeysView />}
              {currentTab === 'send-otp' && (
                <SendOtpView
                  onSuccessDispatch={() => {
                    // Refresh balance
                    ApiClient.getWalletBalance().then((res) => {
                      if (user && res?.balance !== undefined) {
                        setUser({ ...user, balance: res.balance });
                      }
                    });
                  }}
                  onOpenWalletModal={() => setWalletModalOpen(true)}
                />
              )}
              {currentTab === 'wallet' && (
                <WalletView onOpenWalletModal={() => setWalletModalOpen(true)} />
              )}
              {currentTab === 'docs' && <DocsView />}
              {currentTab === 'support' && <SupportView />}
              {currentTab === 'admin' && <AdminView />}
              {currentTab === 'legal' && (
                <LegalView
                  initialTab="terms"
                  onBack={() => setCurrentTab('dashboard')}
                  darkMode={darkMode}
                />
              )}
            </main>

            {/* Mobile Bottom Navigation Bar */}
            <MobileBottomNav
              currentTab={currentTab}
              onSelectTab={(tab) => setCurrentTab(tab)}
              onOpenMobileDrawer={() => setMobileSidebarOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        isSignUpDefault={authModalIsSignUp}
        onSuccess={handleAuthSuccess}
      />

      <WalletRechargeModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        onSuccess={handleWalletSuccess}
        userEmail={user?.email}
        userName={user?.fullName}
      />
    </div>
  );
}

export default App;
