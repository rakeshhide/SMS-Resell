import React, { useState, useEffect } from 'react';
import {
  Radio,
  ArrowRight,
  CodeXml,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Lock,
  BarChart3,
  Globe,
  Wallet,
  Clock,
  Layers,
  ChevronRight,
  Terminal,
  Copy,
  Check,
  Menu,
  X
} from 'lucide-react';
import { TurfsyLogo } from '../components/TurfsyLogo';
import { ApiClient } from '../services/api';
import { PricingTier } from '../types';

interface LandingPageViewProps {
  onOpenAuth: (isSignUp?: boolean) => void;
  onGoToDashboard: () => void;
  isLoggedIn: boolean;
  onOpenLegal?: (tab: 'terms' | 'privacy' | 'aup' | 'refund') => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onOpenAuth,
  onGoToDashboard,
  isLoggedIn,
  onOpenLegal,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [minTopup, setMinTopup] = useState<number>(1);
  const [defaultGst, setDefaultGst] = useState<number>(18);
  const [defaultServiceFee, setDefaultServiceFee] = useState<number>(3);

  useEffect(() => {
    ApiClient.getPublicPricing()
      .then((res) => {
        if (res?.tiers && res.tiers.length > 0) {
          setPricingTiers(res.tiers);
        }
        if (res?.settings) {
          if (res.settings.minTopup !== undefined) setMinTopup(res.settings.minTopup);
          if (res.settings.defaultGst !== undefined) setDefaultGst(res.settings.defaultGst);
          if (res.settings.defaultServiceFee !== undefined) setDefaultServiceFee(res.settings.defaultServiceFee);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch public pricing on landing', err);
      });
  }, []);

  const heroCode = `curl -X POST https://apinexusotp.vercel.app/api/v1/otp/send \\
  -H "Authorization: Bearer sk_live_9a8f4c21e7b..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "9876543210",
    "otp": "482910"
  }'

# Response (200 OK):
{
  "success": true,
  "message": "OTP request accepted",
  "transaction_id": "TXN_884920194_ab12",
  "recipient": "98******10",
  "latency_ms": 142
}`;

  const copyHeroCode = () => {
    navigator.clipboard.writeText(heroCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TurfsyLogo size={38} />
            <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              turfsy<span style={{ color: '#3b82f6' }}>OTPs</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="landing-nav-desktop">
            <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Features</a>
            <a href="#how-it-works" style={{ color: 'inherit', textDecoration: 'none' }}>How It Works</a>
            <a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</a>
            <a href="#developer" style={{ color: 'inherit', textDecoration: 'none' }}>Developer API</a>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="landing-auth-desktop">
            {isLoggedIn ? (
              <button
                onClick={onGoToDashboard}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth(true)}
                  style={{
                    padding: '9px 20px',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
                  }}
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="landing-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="landing-mobile-drawer">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--text-main)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '15px',
                padding: '8px 4px'
              }}
            >
              <Zap size={16} color="#3b82f6" />
              <span>Features</span>
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--text-main)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '15px',
                padding: '8px 4px'
              }}
            >
              <Clock size={16} color="#3b82f6" />
              <span>How It Works</span>
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--text-main)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '15px',
                padding: '8px 4px'
              }}
            >
              <Wallet size={16} color="#3b82f6" />
              <span>Pricing</span>
            </a>
            <a
              href="#developer"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--text-main)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '15px',
                padding: '8px 4px'
              }}
            >
              <CodeXml size={16} color="#3b82f6" />
              <span>Developer API</span>
            </a>
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isLoggedIn ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGoToDashboard();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth(false);
                    }}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-main)',
                      fontSize: '14px',
                      fontWeight: 600
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth(true);
                    }}
                    style={{
                      padding: '12px',
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
                    }}
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="landing-hero-section">
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '30px',
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '18px'
          }}>
            <Zap size={14} />
            <span>Developer-First Communication Infrastructure</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 5.5vw, 46px)',
            fontWeight: 800,
            lineHeight: 1.16,
            letterSpacing: '-0.03em',
            color: 'var(--text-main)',
            marginBottom: '18px'
          }}>
            Reliable OTP & Messaging APIs for Modern Applications
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 2.5vw, 17px)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '28px'
          }}>
            Send OTPs and transactional messages through a fast, developer-friendly API built for modern applications. Scale from your first user to millions with transparent wallet billing and enterprise security.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onOpenAuth(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '13px 24px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
              }}
            >
              <span>Get Started Free</span>
              <ArrowRight size={18} />
            </button>

            <a
              href="#developer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '13px 22px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <CodeXml size={18} />
              <span>View API Documentation</span>
            </a>
          </div>

          <div style={{ display: 'flex', gap: '18px', marginTop: '32px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>Instant API Keys</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>No Monthly Subscriptions</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>Auto-Refund on Failure</span>
            </div>
          </div>
        </div>

        {/* Hero Code Preview Window */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          border: '1px solid #1e293b',
          boxShadow: 'var(--shadow-xl)',
          width: '100%',
          maxWidth: '100%'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            backgroundColor: '#0b1120',
            borderBottom: '1px solid #1e293b'
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
            </div>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
              POST /api/v1/otp/send
            </span>
            <button
              onClick={copyHeroCode}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                color: '#cbd5e1',
                fontSize: '11px'
              }}
            >
              {copiedCode ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div style={{ padding: '20px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <pre style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: '#38bdf8',
              lineHeight: 1.6,
              whiteSpace: 'pre'
            }}>
              {heroCode}
            </pre>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="landing-section" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 44px auto' }}>
            <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              Built for High Performance & Unwavering Reliability
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Everything your engineering team needs to power verification and notifications.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '24px'
          }}>
            {[
              { icon: Zap, title: 'Developer-Friendly REST API', desc: 'Predictable resource-oriented URLs, standard HTTP response codes, and clean JSON payloads.' },
              { icon: Lock, title: 'Secure Cryptographic Keys', desc: 'Keys stored as irreversible SHA-256 hashes. Rotate, revoke, or regenerate credentials with one click.' },
              { icon: Wallet, title: 'Wallet-Based Billing', desc: 'Recharge via Razorpay with zero commitments. Pay only for successful messages deducted atomically.' },
              { icon: BarChart3, title: 'Real-Time Delivery Analytics', desc: 'Monitor throughput, success rates, latency, and hourly volume in your live interactive dashboard.' },
              { icon: Clock, title: 'Atomic Double-Spend Protection', desc: 'Database row-level locks guarantee 100% financial consistency across concurrent requests.' },
              { icon: ShieldCheck, title: 'Automatic Failure Reversals', desc: 'If upstream carrier delivery is unfulfilled, funds are automatically refunded to your wallet ledger.' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: '#eff6ff',
                    color: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={20} />
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>{f.title}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works (6 Steps) */}
      <section id="how-it-works" className="landing-section">
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 44px auto' }}>
            <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              How It Works
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              From sign-up to dispatching your first production OTP in under 3 minutes.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
            gap: '16px'
          }}>
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up with instant email verification.' },
              { step: '02', title: 'Add Wallet Balance', desc: 'Top up funds securely via Razorpay checkout.' },
              { step: '03', title: 'Generate API Key', desc: 'Create your secret sk_live credentials.' },
              { step: '04', title: 'Integrate the API', desc: 'Copy 5 lines of cURL, Node.js, or Python.' },
              { step: '05', title: 'Send OTPs', desc: 'Dispatch OTP messages to recipients worldwide.' },
              { step: '06', title: 'Monitor Usage', desc: 'Track dispatches and ledger in real time.' },
            ].map((s) => (
              <div key={s.step} style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 16px',
                border: '1px solid var(--border-subtle)',
                position: 'relative'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#3b82f6', letterSpacing: '-0.03em' }}>
                  {s.step}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '8px' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.4 }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparent Pricing Section */}
      <section id="pricing" className="landing-section" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              Transparent Wallet Top-Up Pricing
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Simple, transparent pay-as-you-go pricing based on your top-up amount. No hidden fees or subscriptions.
            </p>
          </div>

          <div className="surface-card" style={{ backgroundColor: 'var(--bg-app)' }}>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', minWidth: '540px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Top-Up Bracket</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>OTP Rate</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Estimated Volume</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(pricingTiers.length > 0 ? pricingTiers : [
                    { minTopup: minTopup, maxTopup: 499, otpPrice: 0.75, name: 'Starter Tier', label: `₹${minTopup} – ₹499` },
                    { minTopup: 500, maxTopup: 1999, otpPrice: 0.72, name: 'Growth Tier', label: '₹500 – ₹1,999' },
                    { minTopup: 2000, maxTopup: 4999, otpPrice: 0.68, name: 'Scale Tier', label: '₹2,000 – ₹4,999' },
                    { minTopup: 5000, maxTopup: 9999, otpPrice: 0.64, name: 'Business Tier', label: '₹5,000 – ₹9,999' },
                    { minTopup: 10000, maxTopup: null, otpPrice: 0.60, name: 'Enterprise Tier', label: '₹10,000+' },
                  ]).map((tier, idx) => {
                    const label = tier.label || (tier.maxTopup ? `₹${tier.minTopup.toLocaleString('en-IN')} – ₹${tier.maxTopup.toLocaleString('en-IN')}` : `₹${tier.minTopup.toLocaleString('en-IN')}+`);
                    const volumeEst = tier.otpPrice > 0 ? `~${Math.floor(tier.minTopup / tier.otpPrice).toLocaleString('en-IN')}+ OTPs` : '';
                    return (
                      <tr
                        key={'id' in tier ? tier.id : idx}
                        style={{
                          borderBottom: idx < (pricingTiers.length || 5) - 1 ? '1px solid var(--border-subtle)' : 'none',
                        }}
                      >
                        <td style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{label}</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8'
                            }}>
                              {tier.name?.replace(' Tier', '') || `Tier ${idx + 1}`}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontWeight: 800, color: '#3b82f6', fontSize: '15px' }}>
                          ₹{tier.otpPrice.toFixed(2)} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>/ OTP</span>
                        </td>
                        <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                          {volumeEst}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <button
                            onClick={() => onOpenAuth(true)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              backgroundColor: '#3b82f6',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Top-Up Now
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '12px',
              color: 'var(--text-muted)'
            }}>
              <div>
                Minimum top-up is ₹{minTopup.toLocaleString('en-IN')}. 100% of top-up amount is credited directly to your wallet float. All prices are exclusive of {defaultGst}% GST + {defaultServiceFee}% platform service fee.
              </div>
              <div style={{ fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} color="#10b981" />
                <span>Automatic refunds on undelivered routes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Section Preview */}
      <section id="developer" className="landing-section">
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
            Ready to integrate into your application?
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 28px auto' }}>
            Create your account today, fund your wallet via Razorpay, and dispatch your first OTP in minutes.
          </p>

          <button
            onClick={() => onOpenAuth(true)}
            style={{
              padding: '14px 32px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
            }}
          >
            Create Developer Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          gap: '36px',
          marginBottom: '40px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ffffff', marginBottom: '12px' }}>
              <TurfsyLogo size={32} />
              <span style={{ fontSize: '18px', fontWeight: 800 }}>turfsy<span style={{ color: '#38bdf8' }}>OTPs</span></span>
            </div>
            <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#64748b' }}>
              High-throughput OTP and transactional messaging infrastructure designed for enterprise scalability and developer happiness.
            </p>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', marginBottom: '14px' }}>
              Platform
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <li><a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Features</a></li>
              <li><a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Transparent Pricing</a></li>
              <li><a href="#developer" style={{ color: 'inherit', textDecoration: 'none' }}>API Reference</a></li>
            </ul>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', marginBottom: '14px' }}>
              Compliance & Legal
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal ? onOpenLegal('terms') : (window.location.hash = 'terms')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', padding: 0, cursor: 'pointer', fontSize: '13px', textAlign: 'left', transition: 'color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal ? onOpenLegal('privacy') : (window.location.hash = 'privacy')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', padding: 0, cursor: 'pointer', fontSize: '13px', textAlign: 'left', transition: 'color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal ? onOpenLegal('aup') : (window.location.hash = 'aup')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', padding: 0, cursor: 'pointer', fontSize: '13px', textAlign: 'left', transition: 'color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  Acceptable Use Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal ? onOpenLegal('refund') : (window.location.hash = 'refund')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', padding: 0, cursor: 'pointer', fontSize: '13px', textAlign: 'left', transition: 'color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  Refund & Reversal Policy
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', marginBottom: '14px' }}>
              Security
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              All communications are encrypted using TLS 1.3. API credentials hashed with SHA-256. Zero plaintext secret storage.
            </p>
          </div>
        </div>

        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          paddingTop: '20px',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
          color: '#64748b'
        }}>
          <div>
            © 2026 turfsyOTPs Platform. All rights reserved.
          </div>
          <div>
            High Availability Telecom Gateway Route
          </div>
        </div>
      </footer>
    </div>
  );
};

