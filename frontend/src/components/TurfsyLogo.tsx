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
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 3px 12px rgba(5, 30, 70, 0.18)',
          overflow: 'hidden',
          position: 'relative',
          flexShrink: 0,
          border: '1px solid rgba(5, 30, 70, 0.1)'
        }}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            width: '92%',
            height: '92%',
            display: 'block'
          }}
        >
          {/* Smartphone Body Outline */}
          <rect
            x="17"
            y="7.5"
            width="30"
            height="49"
            rx="7.5"
            fill="#ffffff"
            stroke="#051e46"
            strokeWidth="3.2"
          />

          {/* Top Ear Speaker Pill */}
          <line
            x1="27.5"
            y1="12.5"
            x2="36.5"
            y2="12.5"
            stroke="#051e46"
            strokeWidth="2.6"
            strokeLinecap="round"
          />

          {/* 3 OTP Verification Code Dots */}
          <circle cx="24.5" cy="29.5" r="2.6" fill="#051e46" />
          <circle cx="32" cy="29.5" r="2.6" fill="#051e46" />
          <circle cx="39.5" cy="29.5" r="2.6" fill="#051e46" />

          {/* Bottom Chin Divider */}
          <line
            x1="17"
            y1="45"
            x2="47"
            y2="45"
            stroke="#051e46"
            strokeWidth="2.2"
          />

          {/* Home / Sensor Circle */}
          <circle cx="32" cy="50.8" r="2.1" fill="#051e46" />

          {/* Overlapping Green Verified Badge with White Outer Ring */}
          <circle cx="44.5" cy="45.5" r="10.8" fill="#ffffff" />
          <circle cx="44.5" cy="45.5" r="9.2" fill="#00a516" />
          <path
            d="M40.2 45.8L43.2 48.8L49 42.6"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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
            turfsy<span style={{ color: '#2563eb' }}>OTPs</span>
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
