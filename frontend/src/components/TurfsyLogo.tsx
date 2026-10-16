import React from 'react';

interface TurfsyLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const TurfsyLogo: React.FC<TurfsyLogoProps> = ({ size = 36, className = '', showText = false }) => {
  return (
    <div className={`turfsy-logo-wrap ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${Math.round(size * 0.28)}px`,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #2563eb 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
          overflow: 'hidden',
          position: 'relative',
          flexShrink: 0,
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}
      >
        {/* SMS Message Bubble & High-Speed Instant OTP Flash */}
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            width: '82%',
            height: '82%',
            display: 'block'
          }}
        >
          <defs>
            <linearGradient id="logoBubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="100%" stop-color="#2563eb" />
            </linearGradient>
            <linearGradient id="logoLightning" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="100%" stop-color="#38bdf8" />
            </linearGradient>
          </defs>

          {/* SMS Chat / Messaging Outline */}
          <path
            d="M13 16C13 12.686 15.686 10 19 10H45C48.314 10 51 12.686 51 16V34C51 37.314 48.314 40 45 40H26L18 47V40H19C15.686 40 13 37.314 13 34V16Z"
            fill="url(#logoBubbleGrad)"
            fillOpacity="0.25"
            stroke="url(#logoBubbleGrad)"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />

          {/* High-Throughput Delivery Lightning (OTP Transmission) */}
          <path
            d="M35 15L22 30H32L28 45L43 27H32L35 15Z"
            fill="url(#logoLightning)"
          />

          {/* Dynamic Active Signal Badge */}
          <circle cx="49" cy="13" r="4" fill="#10b981" />
          <circle cx="49" cy="13" r="2" fill="#ffffff" />
        </svg>
      </div>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: `${Math.round(size * 0.52)}px`,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-main, #ffffff)',
              lineHeight: 1.1
            }}
          >
            turfsy<span style={{ color: '#38bdf8' }}>OTPs</span>
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-muted, #94a3b8)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}
          >
            SMS Infrastructure
          </span>
        </div>
      )}
    </div>
  );
};
