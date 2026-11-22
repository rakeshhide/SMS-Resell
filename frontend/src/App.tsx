import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MaintenancePage } from './components/MaintenancePage';
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
import { InviteRequestView } from './views/InviteRequestView';
import { WalletRechargeModal } from './components/WalletRechargeModal';
import { User } from './types';
import { ApiClient } from './services/api';
import { AlertOctagon, Power } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [viewingLanding, setViewingLanding] = useState<boolean>(true);
  const [legalViewTab, setLegalViewTab] = useState<LegalTab | null>(null);

  // Platform status
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>('');
  const [registrationMode, setRegistrationMode] = useState<'open' | 'closed' | 'invite_only'>('open');
  const [inviteMessage, setInviteMessage] = useState<string>('');
  const [togglingMaintenance, setTogglingMaintenance] = useState<boolean>(false);

  const [isResetPasswordRoute, setIsResetPasswordRoute] = useState<boolean>(() => {
    return window.location.pathname === '/reset-password' || new URLSearchParams(window.location.search).has('token');
  });

  const [authRouteMode, setAuthRouteMode] = useState<AuthMode | null>(() => {
    const p = window.location.pathname.toLowerCase();
    const h = window.location.hash.replace('#', '').toLowerCase();
    if (p === '/login' || h === 'login' || p === '/admin' || h === 'admin') return 'signin';
    if (p === '/signup' || h === 'signup' || p === '/register' || h === 'register') return 'signup';
    if (p === '/forgot-password' || h === 'forgot') return 'forgot';
    return null;
  });

  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Modals
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    // Load platform status first (unauthenticated)
    ApiClient.getPlatformStatus().then((res) => {
      setMaintenanceMode(Boolean(res.maintenanceMode));
      setMaintenanceMessage(res.maintenanceMessage || '');
      setRegistrationMode(res.registrationMode || 'open');
      setInviteMessage(res.inviteMessage || '');
    }).catch(() => {});

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
        if (p === '/admin' || hash === 'admin') {
          const token = localStorage.getItem('nexus_auth_token');
          if (token) {
            setCurrentTab('admin');
            setViewingLanding(false);
            setAuthRouteMode(null);
          } else {
            setAuthRouteMode('signin');
            setViewingLanding(false);
          }
        } else if (p === '/login' || hash === 'login') {
          setAuthRouteMode('signin');
          setViewingLanding(false);
        } else if (p === '/signup' || hash === 'signup' || p === '/register' || hash === 'register') {
          setAuthRouteMode('signup');
          setViewingLanding(false);
        } else if (p === '/forgot-password' || hash === 'forgot') {
          setAuthRouteMode('forgot');
          setViewingLanding(false);
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
        if (window.location.pathname.toLowerCase() === '/admin' || window.location.hash.toLowerCase() === '#admin') {
          setCurrentTab('admin');
        }
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
    if (authenticatedUser.role === 'admin') {
      setCurrentTab('admin');
    } else {
      setCurrentTab('dashboard');
    }
    try {
      history.pushState('', document.title, '/');
    } catch {}
  };

  const handleTurnOffMaintenance = async () => {
    try {
      setTogglingMaintenance(true);
      await ApiClient.updatePlatformControls({ maintenanceMode: false });
      setMaintenanceMode(false);
    } catch (err: any) {
      console.error('Failed to disable maintenance mode:', err);
    } finally {
      setTogglingMaintenance(false);
    }
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
      {/* Global Sticky Maintenance Mode Warning Bar for Logged-In Admin */}
      {maintenanceMode && user?.role === 'admin' && (
        <div
          style={{
            backgroundColor: '#dc2626',
            color: '#ffffff',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            fontWeight: 600,
            position: 'sticky',
            top: 0,
            zIndex: 99999,
            boxShadow: '0 2px 10px rgba(220, 38, 38, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertOctagon size={18} color="#ffffff" />
            <span>
              Platform Maintenance Mode is currently <strong>ACTIVE</strong>. Regular developer accounts cannot access the console.
            </span>
          </div>
          <button
            onClick={handleTurnOffMaintenance}
            disabled={togglingMaintenance}
            style={{
              backgroundColor: '#ffffff',
              color: '#dc2626',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: togglingMaintenance ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Power size={14} />
            <span>{togglingMaintenance ? 'Turning Off...' : 'Turn Off Maintenance Mode Now'}</span>
          </button>
        </div>
      )}

      {/* 1. Reset Password Route */}
      {isResetPasswordRoute ? (
        <ResetPasswordView
          darkMode={darkMode}
          onGoToLogin={() => {
            setIsResetPasswordRoute(false);
            setAuthRouteMode('signin');
            setViewingLanding(false);
            try {
              history.pushState('', document.title, '/login');
            } catch {}
          }}
          onForgotPassword={() => {
            setIsResetPasswordRoute(false);
            setAuthRouteMode('forgot');
            setViewingLanding(false);
            try {
              history.pushState('', document.title, '/login');
            } catch {}
          }}
          onGoHome={() => {
            setIsResetPasswordRoute(false);
            setAuthRouteMode(null);
            setViewingLanding(true);
            try {
              history.pushState('', document.title, '/');
            } catch {}
          }}
        />
      ) : legalViewTab !== null ? (
        /* 2. Legal Policy Pages */
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
        /* 3. Authentication Route: ALWAYS Accessible so Admin Can Sign In */
        authRouteMode === 'signup' && registrationMode !== 'open' ? (
          <InviteRequestView
            inviteMessage={registrationMode === 'invite_only' ? inviteMessage : 'Registration is currently closed. You can submit your details to be notified when it reopens.'}
            onGoHome={() => {
              setAuthRouteMode(null);
              setViewingLanding(true);
              try { history.pushState('', document.title, '/'); } catch {}
            }}
            onGoToLogin={() => {
              setAuthRouteMode('signin');
              setViewingLanding(false);
              try { history.pushState('', document.title, '/login'); } catch {}
            }}
          />
        ) : (
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
            maintenanceMode={maintenanceMode}
            maintenanceMessage={maintenanceMessage}
          />
        )
      ) : viewingLanding ? (
        /* 4. Public Intro / Landing Page: ALWAYS SAFE & LIVE */
        <LandingPageView
          onOpenAuth={(isSignUp = false) => {
            setAuthRouteMode(isSignUp ? 'signup' : 'signin');
            setViewingLanding(false);
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
          maintenanceMode={maintenanceMode}
          maintenanceMessage={maintenanceMessage}
          onAdminLogin={() => {
            setAuthRouteMode('signin');
            setViewingLanding(false);
            try {
              history.pushState('', document.title, '/login');
            } catch {}
          }}
        />
      ) : maintenanceMode && user?.role !== 'admin' ? (
        /* 5. Maintenance screen for logged-in regular users */
        <MaintenancePage
          message={maintenanceMessage}
          onGoHome={() => setViewingLanding(true)}
          onAdminLogin={() => {
            handleLogout();
            setAuthRouteMode('signin');
            setViewingLanding(false);
          }}
          onLogout={handleLogout}
        />
      ) : (
        /* 6. Authenticated App Experience (Admins and regular users when not in maintenance) */
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
              {currentTab === 'admin' && (
                <AdminView onMaintenanceModeChange={(active) => setMaintenanceMode(active)} />
              )}
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
