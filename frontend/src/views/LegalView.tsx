import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldCheck,
  Scale,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  MessageSquare,
  Building2,
  ArrowLeft,
  ArrowUp,
  Search,
  Menu,
  X,
  ChevronRight,
  Printer
} from 'lucide-react';
import { TurfsyLogo } from '../components/TurfsyLogo';

export type LegalTab = 'terms' | 'privacy' | 'aup' | 'refund';

interface LegalViewProps {
  initialTab?: LegalTab;
  onBack: () => void;
  darkMode?: boolean;
}

export const LegalView: React.FC<LegalViewProps> = ({
  initialTab = 'terms',
  onBack,
  darkMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 280);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTabChange = (tab: LegalTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
    setMobileMenuOpen(false);
    setShowMobileSearch(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (window.location.hash) {
      try {
        history.pushState('', document.title, window.location.pathname + window.location.search);
      } catch {
        window.location.hash = '';
      }
    }
    onBack();
  };

  const navItems = [
    {
      id: 'terms' as LegalTab,
      title: 'Terms of Service',
      shortTitle: 'Terms',
      desc: 'Platform governance, API licensing & billing terms',
      icon: <Scale size={18} />
    },
    {
      id: 'privacy' as LegalTab,
      title: 'Privacy Policy',
      shortTitle: 'Privacy',
      desc: 'Data protection, DPDP Act 2023 & transmission security',
      icon: <ShieldCheck size={18} />
    },
    {
      id: 'aup' as LegalTab,
      title: 'Acceptable Use Policy',
      shortTitle: 'AUP',
      desc: 'Permitted traffic, TRAI DLT compliance & anti-spam rules',
      icon: <FileText size={18} />
    },
    {
      id: 'refund' as LegalTab,
      title: 'Refund & Reversal Policy',
      shortTitle: 'Refunds',
      desc: 'Automatic route refunds, top-up returns & timelines',
      icon: <RefreshCw size={18} />
    }
  ];

  return (
    <div className="legal-layout-container">
      {/* Top Header Bar */}
      <header className="legal-header-bar">
        <div className="legal-header-left">
          <button
            onClick={handleBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-main)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            aria-label="Back"
          >
            <ArrowLeft size={16} />
            <span style={{ display: 'inline-block' }}>Back</span>
          </button>

          <div
            onClick={handleBack}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            title="Return to main page"
          >
            <TurfsyLogo size={26} />
            <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              turfsy<span style={{ color: '#38bdf8' }}>OTPs</span>
            </span>
            <span
              className="legal-header-badge"
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                color: '#0284c7',
                letterSpacing: '0.05em'
              }}
            >
              Legal & Compliance
            </span>
          </div>
        </div>

        <div className="legal-header-right">
          {/* Desktop Search Box */}
          <div className="legal-search-box legal-search-box-desktop">
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search in policy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '12px',
                color: 'var(--text-main)',
                width: '100%'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Mobile Search Toggle */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="legal-icon-btn"
            style={{ display: 'flex' }}
            aria-label="Search policy"
            title="Search policy"
          >
            {showMobileSearch ? <X size={16} /> : <Search size={16} />}
          </button>

          {/* Desktop Print Policy Button */}
          <button
            onClick={() => window.print()}
            className="legal-print-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Printer size={15} />
            <span>Print</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="legal-menu-btn"
            aria-label="Open document menu"
            title="Legal policies menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* Mobile Collapsible Search Dropdown */}
      {showMobileSearch && (
        <div style={{
          padding: '10px 16px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Type keyword to find in this policy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '14px',
              color: 'var(--text-main)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              aria-label="Clear keyword"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Mobile Sticky Horizontal Segment Pills */}
      <div className="legal-mobile-pills-bar">
        {navItems.map((item) => {
          const isSelected = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`legal-pill-btn ${isSelected ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.shortTitle}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid Container */}
      <div className="legal-main-grid">
        {/* Desktop Navigation Sidebar */}
        <aside className="legal-sidebar-sticky legal-desktop-sidebar">
          <div className="surface-card" style={{ padding: '16px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
              marginBottom: '12px',
              paddingLeft: '8px'
            }}>
              Legal Documents
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {navItems.map((item) => {
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: isSelected ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                      color: isSelected ? '#2563eb' : 'var(--text-main)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      marginTop: '2px',
                      color: isSelected ? '#2563eb' : 'var(--text-muted)'
                    }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: isSelected ? 700 : 600 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                        {item.desc}
                      </div>
                    </div>
                    {isSelected && <ChevronRight size={16} color="#2563eb" style={{ marginTop: '2px' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compliance & Contact Box */}
          <div className="surface-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Building2 size={16} color="#3b82f6" />
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                Official Entity & Grievance
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 12px 0' }}>
              For compliance audits, legal inquiries, or DLT registration support:
            </p>
            <div style={{ fontSize: '12px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Platform:</strong> turfsyOTPs Infrastructure</div>
              <div><strong>Jurisdiction:</strong> New Delhi, India</div>
              <div><strong>Support & Grievance:</strong> In-Platform Live Chat Support</div>
              <div><strong>Response SLA:</strong> Within 24-48 business hours</div>
            </div>
          </div>
        </aside>

        {/* Content Pane */}
        <main style={{ minWidth: 0 }}>
          <div className="legal-content-card">
            {activeTab === 'terms' && <TermsOfServiceContent />}
            {activeTab === 'privacy' && <PrivacyPolicyContent />}
            {activeTab === 'aup' && <AcceptableUseContent />}
            {activeTab === 'refund' && <RefundPolicyContent />}
          </div>
        </main>
      </div>

      {/* Mobile Drawer Menu Sheet */}
      {mobileMenuOpen && (
        <div className="legal-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="legal-drawer-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TurfsyLogo size={24} />
                <span style={{ fontSize: '16px', fontWeight: 800 }}>Policies & Compliance</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {navItems.map((item) => {
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: isSelected ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-app)',
                      color: isSelected ? '#2563eb' : 'var(--text-main)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ marginTop: '2px', color: isSelected ? '#2563eb' : 'var(--text-muted)' }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: isSelected ? 700 : 600 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                        {item.desc}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 size={16} color="#2563eb" style={{ marginTop: '2px' }} />}
                  </button>
                );
              })}
            </div>

            {/* Official Entity Box in Mobile Drawer */}
            <div style={{
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                <Building2 size={14} color="#3b82f6" />
                <span>Entity & Grievance Desk</span>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>New Delhi, India • Live Chat Help Desk</div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#0284c7',
                fontWeight: 600,
                marginTop: '4px'
              }}>
                <MessageSquare size={13} />
                <span>In-Platform Live Chat Desk Available</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="legal-scroll-top-btn"
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
};

// ==========================================
// 1. TERMS OF SERVICE CONTENT
// ==========================================
const TermsOfServiceContent: React.FC = () => {
  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', marginBottom: '8px' }}>
          <Scale size={24} />
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Enterprise Customer Agreement
          </span>
        </div>
        <h1 className="legal-title-h1" style={{ margin: '0 0 8px 0' }}>
          Terms of Service
        </h1>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Effective Date: October 10, 2026 | Last Revised: October 10, 2026
        </div>
      </div>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>1. Acceptance of Terms</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          By creating an account, generating API credentials, depositing funds into your developer wallet, or accessing the messaging infrastructure provided by <strong>turfsyOTPs</strong> ("Platform", "we", "us", or "our"), you ("Customer", "Developer", or "User") agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a company or other legal entity, you represent that you have the authority to bind such entity to these terms.
        </p>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>2. Description of Service</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          turfsyOTPs provides an enterprise-grade RESTful Application Programming Interface (API) and developer gateway for real-time dispatch of One-Time Passwords (OTPs), multi-factor authentication (MFA) codes, and high-priority transactional notifications across Indian and global cellular networks via licensed upstream telecommunication partners (including Fast2SMS gateway routes).
        </p>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>3. Account Registration & Security</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
          To utilize the API, you must register a valid developer account. You agree to:
        </p>
        <ul style={{ fontSize: '14px', color: 'var(--text-secondary)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>Provide authentic, accurate, and up-to-date business and contact information.</li>
          <li>Safeguard all issued API Secret Keys (<code style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', fontFamily: 'var(--font-mono)' }}>sk_live_...</code>). API keys must never be exposed in client-side code, public repositories, or unsecured environments.</li>
          <li>Accept full responsibility for all dispatches, wallet debits, and API calls initiated with your authentication credentials.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>4. Billing, Prepaid Wallet Float & Taxes</h2>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p>
            <strong>4.1 Prepaid Wallet Model:</strong> Our service operates strictly on a prepaid wallet float mechanism. Every API request successfully accepted by the platform debits your wallet in real time based on your active volume pricing tier.
          </p>
          <p>
            <strong>4.2 Pricing Tiers:</strong> OTP pricing is determined by your single top-up volume bracket. The higher your recharge amount, the lower your per-OTP dispatch tariff. All tariffs are published transparently on our platform.
          </p>
          <p>
            <strong>4.3 Statutory Taxes (18% GST):</strong> As per the Goods and Services Tax laws of India, all wallet recharges are subject to 18% statutory Goods and Services Tax (GST), collected at checkout and remitted to the Government of India.
          </p>
          <p>
            <strong>4.4 Infrastructure Service Fee (3.0%):</strong> A standard 3.0% platform technology and gateway service fee is assessed on all top-up transactions to maintain high-throughput server uptime and 256-bit encrypted checkout routing.
          </p>
          <p>
            <strong>4.5 Payment Processing:</strong> Payments are processed via authorized, PCI-DSS Level 1 compliant payment gateways (Razorpay). We do not record or retain card numbers, CVVs, or online banking passwords on our servers.
          </p>
        </div>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>5. Service Level Commitments & Telecommunications Disclaimers</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
          While turfsyOTPs commits to a 99.9% API server availability target, you acknowledge that actual SMS delivery to recipient handsets relies upon intermediate telecommunication carriers, GSM network towers, and roaming agreements. Consequently:
        </p>
        <ul style={{ fontSize: '14px', color: 'var(--text-secondary)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>We are not liable for transmission delays caused by subscriber handset unreachability, switched-off devices, DND (Do Not Disturb) blocking, or local carrier downtime.</li>
          <li>In the event an upstream gateway conclusively flags an OTP route as failed or undelivered, the debited amount is automatically reversed to your wallet float in real time.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>6. Termination & Suspension</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          We reserve the right to immediately suspend or permanently terminate your API keys and account without prior notice if we detect fraudulent activity, payment reversals/chargebacks, phishing attempts, spam transmission, or violations of our Acceptable Use Policy or TRAI DLT regulations. Upon suspension for malicious conduct, any unused wallet balance shall be forfeited.
        </p>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>7. Limitation of Liability</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          To the maximum extent permitted by applicable law, in no event shall turfsyOTPs, its directors, or affiliates be liable for any indirect, incidental, punitive, or consequential damages, including loss of profits, data, or business goodwill, arising out of or related to your use of the platform. Our aggregate liability under any circumstances shall not exceed the net service fees paid by you in the one (1) month preceding the event giving rise to liability.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>8. Governing Law & Jurisdiction</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          These Terms of Service are governed by and construed in accordance with the laws of the Republic of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts situated in New Delhi, India.
        </p>
      </section>
    </div>
  );
};

// ==========================================
// 2. PRIVACY POLICY CONTENT
// ==========================================
const PrivacyPolicyContent: React.FC = () => {
  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '8px' }}>
          <ShieldCheck size={24} />
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Data Protection & Security
          </span>
        </div>
        <h1 className="legal-title-h1" style={{ margin: '0 0 8px 0' }}>
          Privacy Policy
        </h1>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Compliance: Digital Personal Data Protection (DPDP) Act 2023 & IT Rules 2011 | Last Revised: October 10, 2026
        </div>
      </div>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>1. Overview & Commitment</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          At <strong>turfsyOTPs</strong>, we recognize the criticality of data confidentiality and privacy for developer applications and end-users. This Privacy Policy details how we collect, process, store, and safeguard your personal information and API payload data when you use our platform, in full accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023 (India).
        </p>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>2. Data We Collect</h2>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p>
            <strong>2.1 Account Information:</strong> When you register as a developer, we collect your full name, email address, password hash (hashed via bcrypt), company name, and billing details.
          </p>
          <p>
            <strong>2.2 API Transmission Data (Transient Processing):</strong> When you dispatch OTP requests via our API, you submit recipient phone numbers and generated OTP codes. We process this data strictly in the capacity of a <em>Data Processor / Intermediary</em> solely for cellular transmission to the designated recipient.
          </p>
          <p>
            <strong>2.3 Telemetry & Logs:</strong> We collect server diagnostic logs, IP addresses, user agent strings, HTTP status codes, and timestamps to detect unauthorized intrusion attempts, verify API key authentication, and prevent volumetric DDoS attacks.
          </p>
        </div>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>3. How We Use and Protect Data</h2>
        <ul style={{ fontSize: '14px', color: 'var(--text-secondary)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>
            <strong>End-to-End Encryption:</strong> All communications between your servers, our API endpoints, and upstream telecom routing nodes are enforced with Transport Layer Security (TLS 1.3).
          </li>
          <li>
            <strong>Cryptographic API Key Hashing:</strong> Your secret API keys are never stored in plaintext. They are salted and hashed using SHA-256 before database storage.
          </li>
          <li>
            <strong>No Monetization of Personal Data:</strong> We never sell, lease, rent, or trade your recipient numbers or developer data to advertisers, data brokers, or marketing third parties.
          </li>
          <li>
            <strong>Regulatory Audit Logging:</strong> In accordance with Indian telecommunications directives, anonymized delivery status logs are archived for compliance verification.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>4. Payment Security & Third Parties</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Wallet top-up processing is managed directly by our payment partner, <strong>Razorpay</strong>. Payment sessions are protected by 256-bit encryption and comply with PCI-DSS Level 1 standards. We only receive confirmation of successful order IDs, transaction amounts, and gateway reference numbers to credit your float.
        </p>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>5. Data Retention & Erasure</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Developer account data is retained for the active duration of your account. Transaction ledger histories are maintained for legal, accounting, and tax compliance. In accordance with the DPDP Act 2023, developers may request deletion of their account and associated metadata by contacting our Grievance Officer, provided all pending account obligations are cleared.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>6. Grievance Redressal Officer</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
          In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, the contact details of the Grievance Officer are:
        </p>
        <div style={{
          padding: '16px',
          borderRadius: '10px',
          backgroundColor: 'var(--bg-app)',
          border: '1px solid var(--border-subtle)',
          fontSize: '13px',
          color: 'var(--text-main)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div><strong>Designation:</strong> Chief Privacy & Grievance Officer</div>
          <div><strong>Entity:</strong> turfsyOTPs Platform Operations</div>
          <div><strong>Support Channel:</strong> In-Platform Live Chat Support & Help Desk</div>
          <div><strong>Redressal Period:</strong> Acknowledged within 24 hours, resolved within 15 days</div>
        </div>
      </section>
    </div>
  );
};

// ==========================================
// 3. ACCEPTABLE USE POLICY (AUP) CONTENT
// ==========================================
const AcceptableUseContent: React.FC = () => {
  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', marginBottom: '8px' }}>
          <AlertTriangle size={24} />
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Content Standards & Anti-Abuse
          </span>
        </div>
        <h1 className="legal-title-h1" style={{ margin: '0 0 8px 0' }}>
          Acceptable Use Policy (AUP)
        </h1>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          TRAI TCCCPR 2018 & Telecom Security Directive Compliance | Last Revised: October 10, 2026
        </div>
      </div>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>1. Scope and Purpose</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          This Acceptable Use Policy specifies the strictly permissible and prohibited uses of the <strong>turfsyOTPs</strong> messaging API. This policy safeguards platform integrity, prevents cyber fraud, and ensures uncompromising adherence to the Telecom Commercial Communications Customer Preference Regulations (TCCCPR, 2018) established by the Telecom Regulatory Authority of India (TRAI).
        </p>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>2. Permitted Legitimate Uses</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          The API route is reserved exclusively for bona fide transactional communications, including:
        </p>
        <ul style={{ fontSize: '14px', color: 'var(--text-secondary)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>One-Time Password (OTP) verification for account sign-ups, logins, and password resets.</li>
          <li>Two-Factor Authentication (2FA) and Multi-Factor Authentication (MFA) challenges.</li>
          <li>Critical transaction authorization codes, payment verifications, and security alerts.</li>
          <li>Time-sensitive account recovery and verification notifications.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: '#ef4444' }}>
          3. Prohibited Activities (Zero Tolerance)
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
          The following activities represent severe platform violations and will result in immediate API termination, balance forfeiture, and potential reporting to law enforcement:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.18)', fontSize: '13px' }}>
            <strong>3.1 Unsolicited Promotional Spam:</strong> Dispatching unsolicited bulk marketing, promotional blasts, or cold-lead campaigns over transactional/OTP priority routes is strictly prohibited.
          </div>
          <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.18)', fontSize: '13px' }}>
            <strong>3.2 Phishing & Financial Fraud:</strong> Sending fraudulent URLs, bank impersonations, lottery scams, cryptocurrency schemes, predatory loan offers, or any message engineered to deceive recipients.
          </div>
          <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.18)', fontSize: '13px' }}>
            <strong>3.3 Identity Theft & Impersonation:</strong> Falsely representing government departments, public authorities, financial institutions, or corporate entities.
          </div>
          <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.18)', fontSize: '13px' }}>
            <strong>3.4 Malicious Software & Harmful Payloads:</strong> Transmitting links containing trojans, malware, spyware, ransomware, or exploits.
          </div>
          <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.18)', fontSize: '13px' }}>
            <strong>3.5 Illicit Content:</strong> Distributing content related to illegal betting, adult material, narcotics, hate speech, or content violating local criminal statutes.
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>4. TRAI DLT Scrubbing & Header Standards</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          In compliance with TRAI regulations, all messaging traffic terminating on Indian cellular networks is subjected to Distributed Ledger Technology (DLT) validation. Customers must ensure their message templates and sender entities comply with telecommunication scrubbing rules. Attempts to circumvent DLT filtering or header matching will lead to route blocking.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>5. Automated Abuse Detection & Legal Enforcement</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Our edge proxy infrastructure employs machine learning and heuristic pattern analyzers to detect anomalous volumetric surges, automated OTP bombing, and known scam signatures. Upon detection:
        </p>
        <ul style={{ fontSize: '14px', color: 'var(--text-secondary)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
          <li>The offending API key is immediately revoked within milliseconds.</li>
          <li>The account is permanently suspended, and remaining prepaid wallet balances are forfeited.</li>
          <li>In cases of criminal cyber fraud, relevant telemetry, IP traces, and metadata are submitted to CERT-In (Indian Computer Emergency Response Team) and cybercrime authorities.</li>
        </ul>
      </section>
    </div>
  );
};

// ==========================================
// 4. REFUND & REVERSAL POLICY CONTENT
// ==========================================
const RefundPolicyContent: React.FC = () => {
  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0ea5e9', marginBottom: '8px' }}>
          <RefreshCw size={24} />
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Financial Fairness & Settlement
          </span>
        </div>
        <h1 className="legal-title-h1" style={{ margin: '0 0 8px 0' }}>
          Refund & Reversal Policy
        </h1>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Razorpay Merchant Compliance & Gateway SLA Standards | Last Revised: October 10, 2026
        </div>
      </div>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>1. Philosophy of Transparency</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          At <strong>turfsyOTPs</strong>, we maintain a developer-first financial policy. You only pay for successful, delivered telecommunication infrastructure. This policy governs both real-time automated per-message balance reversals and wallet recharge refunds.
        </p>
      </section>

      {/* Hero Highlight Card */}
      <div style={{
        padding: '20px',
        borderRadius: '12px',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px'
      }}>
        <CheckCircle2 size={24} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#065f46', margin: '0 0 4px 0' }}>
            Automated Real-Time Route Reversal Guarantee
          </h3>
          <p style={{ fontSize: '13px', color: '#047857', lineHeight: 1.5, margin: 0 }}>
            If an OTP or transactional SMS dispatched via your API key fails terminal delivery due to telecom route drops, network congestion, or upstream gateway timeout, <strong>100% of the debited per-OTP cost is automatically reversed back to your wallet float in real time</strong>. No manual ticket required.
          </p>
        </div>
      </div>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>2. Prepaid Wallet Top-Up Refunds</h2>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p>
            <strong>2.1 Accidental or Erroneous Top-Ups:</strong> If you accidentally deposited funds into your wallet or topped up an incorrect amount, you are entitled to request a full or partial refund to your original payment method, provided:
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>The refund request is initiated within <strong>72 hours</strong> of payment completion.</li>
            <li>The credited wallet float has not been consumed for message dispatches.</li>
          </ul>
          <p>
            <strong>2.2 Partially Consumed Balances:</strong> In the event you decide to discontinue using the platform, you may request a refund for the remaining unspent wallet float balance.
          </p>
        </div>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>3. Non-Refundable Components</h2>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p>
            <strong>3.1 Statutory GST (18%):</strong> Goods and Services Tax collected during recharge is immediately remitted to the Government of India against a tax invoice. Once tax returns are filed, statutory taxes cannot be refunded by the platform.
          </p>
          <p>
            <strong>3.2 Delivered Telecommunication Traffic:</strong> Fees for OTPs and messages that were successfully delivered to the recipient handset cannot be refunded under any circumstances, as upstream carrier fees are irrevocably incurred.
          </p>
          <p>
            <strong>3.3 Accounts Terminated for AUP Violations:</strong> Balances belonging to accounts terminated due to phishing, scam distribution, spam, or malicious cyber activity are strictly non-refundable and subject to forfeiture.
          </p>
        </div>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>4. Refund Processing Timelines & Mechanics</h2>
        <div className="legal-table-responsive">
          <table style={{ width: '100%', minWidth: '480px', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Refund Category</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Method</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Processing Timeline</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>Failed Route Reversal</td>
                <td style={{ padding: '12px 16px' }}>Direct Wallet Credit</td>
                <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 700 }}>Instant (Sub-second)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>Unconsumed Top-Up Refund</td>
                <td style={{ padding: '12px 16px' }}>Original Payment Source (UPI/Card/NetBanking)</td>
                <td style={{ padding: '12px 16px' }}>5 – 7 Business Days</td>
              </tr>
              <tr>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>Failed Payment Deduction</td>
                <td style={{ padding: '12px 16px' }}>Bank Auto-Reversal via Razorpay</td>
                <td style={{ padding: '12px 16px' }}>2 – 5 Business Days</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>5. How to Request a Refund</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
          To request a top-up refund, message us directly via the <strong>Live Chat Support</strong> on the website or raise a ticket from the Support & Help desk in your developer dashboard.
        </p>
        <div style={{
          padding: '16px',
          borderRadius: '10px',
          backgroundColor: 'var(--bg-app)',
          border: '1px solid var(--border-subtle)',
          fontSize: '13px',
          color: 'var(--text-main)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div><strong>Support Channel:</strong> In-Platform Live Chat Support & Dashboard Ticket Desk</div>
          <div><strong>Required Information:</strong> Razorpay Payment ID (e.g. <code style={{ fontFamily: 'var(--font-mono)' }}>pay_...</code>) or Order ID, top-up date, and reason for refund</div>
          <div><strong>Resolution SLA:</strong> Reviewed and initiated within 24 hours directly via Razorpay back to your original payment method</div>
          <div><strong>Support Desk Hours:</strong> Monday – Saturday, 9:00 AM – 7:00 PM IST</div>
        </div>
      </section>
    </div>
  );
};
