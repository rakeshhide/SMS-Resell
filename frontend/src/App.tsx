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
import { ResetPasswordView } from './views/ResetPasswordView';
import { AuthView, AuthMode } from './views/AuthView';
import { WalletRechargeModal } from './components/WalletRechargeModal';
import { User } from './types';
import { ApiClient } from './services/api';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [viewingLanding, setViewingLanding] = useState<boolean>(true);
  const [legalViewTab, setLegalViewTab] = useState<LegalTab | null>(null);
  const [isResetPasswordRoute, setIsResetPasswordRoute] = useState<boolean>(() => {
    return window.location.pathname === '/reset-password' || new URLSearchParams(window.location.search).has('token');
  });

  const [authRouteMode, setAuthRouteMode] = useState<AuthMode | null>(() => {
    const p = window.location.pathname.toLowerCase();
    const h = window.location.hash.replace('#', '').toLowerCase();
    if (p === '/login' || h === 'login') return 'signin';
    if (p === '/signup' || h === 'signup' || p === '/register' || h === 'register') return 'signup';
    if (p === '/forgot-password' || h === 'forgot') return 'forgot';
    return null;
  });

  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Modals
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check URL hash for direct policy routing or reset-password or auth pages
    const handleRoute = () => {
      const isReset = window.location.pathname === '/reset-password' || new URLSearchParams(window.location.search).has('token');
      setIsResetPasswordRoute(isReset);

      const p = window.location.pathname.toLowerCase();
      const hash = window.location.hash.replace('#', '').toLowerCase();

      if (['terms', 'privacy', 'aup', 'refund'].includes(hash)) {
        setLegalViewTab(hash as LegalTab);
        setAuthRouteMode(null);
      } else {
        setLegalViewTab(null);
        if (p === '/login' || hash === 'login') {
          setAuthRouteMode('signin');
        } else if (p === '/signup' || hash === 'signup' || p === '/register' || hash === 'register') {
          setAuthRouteMode('signup');
        } else if (p === '/forgot-password' || hash === 'forgot') {
          setAuthRouteMode('forgot');
        }
      }
    };
    handleRoute();
    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('popstate', handleRoute);

    // Check initial user session
    ApiClient.getMe().then((res) => {
      if (res?.user) {
        setUser(res.user);
        setViewingLanding(false);
        setAuthRouteMode(null);
      } else {
        setViewingLanding(true);
      }
    }).catch(() => {
      setViewingLanding(true);
    });

    return () => {
      window.removeEventListener('hashchange', handleRoute);
      window.removeEventListener('popstate', handleRoute);
    };
  }, []);

  const handleLogout = () => {
    ApiClient.clearToken();
    setUser(null);
    setAuthRouteMode(null);
    setViewingLanding(true);
    try {
      history.pushState('', document.title, '/');
    } catch {}
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setAuthRouteMode(null);
    setViewingLanding(false);
    setCurrentTab('dashboard');
    try {
      history.pushState('', document.title, '/');
    } catch {}
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
      {isResetPasswordRoute ? (
        <ResetPasswordView
          darkMode={darkMode}
          onGoToLogin={() => {
            setIsResetPasswordRoute(false);
            setAuthRouteMode('signin');
            try {
              history.pushState('', document.title, '/login');
            } catch {}
          }}
          onForgotPassword={() => {
            setIsResetPasswordRoute(false);
            setAuthRouteMode('forgot');
            try {
              history.pushState('', document.title, '/login');
            } catch {}
          }}
          onGoHome={() => {
            setIsResetPasswordRoute(false);
            setAuthRouteMode(null);
            try {
              history.pushState('', document.title, '/');
            } catch {}
            if (!user) {
              setViewingLanding(true);
            }
          }}
        />
      ) : legalViewTab !== null ? (
        <LegalView
          initialTab={legalViewTab}
          onBack={() => {
            setLegalViewTab(null);
            if (window.location.hash) {
              try {
                history.pushState('', document.title, window.location.pathname + window.location.search);
              } catch {
                window.location.hash = '';
              }
            }
            if (!user) {
              setViewingLanding(true);
            }
          }}
          darkMode={darkMode}
        />
      ) : authRouteMode !== null && !user ? (
        <AuthView
          initialMode={authRouteMode}
          onSuccess={handleAuthSuccess}
          onGoHome={() => {
            setAuthRouteMode(null);
            setViewingLanding(true);
            try {
              history.pushState('', document.title, '/');
            } catch {}
          }}
          darkMode={darkMode}
        />
      ) : viewingLanding ? (
        <LandingPageView
          onOpenAuth={(isSignUp = false) => {
            setAuthRouteMode(isSignUp ? 'signup' : 'signin');
            try {
              history.pushState('', document.title, isSignUp ? '/signup' : '/login');
            } catch {}
          }}
          onGoToDashboard={() => setViewingLanding(false)}
          isLoggedIn={!!user}
          onOpenLegal={(tab) => {
            window.location.hash = tab;
            setLegalViewTab(tab);
          }}
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
                  isEmbedded={true}
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

      {/* Global Wallet Recharge Modal */}
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
