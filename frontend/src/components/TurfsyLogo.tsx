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
          borderRadius: `${Math.round(size * 0.26)}px`,
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)',
          overflow: 'hidden',
          position: 'relative',
          flexShrink: 0
        }}
      >
        <img
          src="/logo.png"
          alt="turfsyOTPs"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
          onError={(e) => {
            // Fallback to high-res SVG if image fails to load
            const target = e.currentTarget;
            target.style.display = 'none';
          }}
        />
        {/* SVG Fallback embedded inside badge */}
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            width: '70%',
            height: '70%',
            position: 'absolute',
            pointerEvents: 'none'
          }}
        >
          <path
            d="M20 4L7 9V19C7 27.5 12.6 34.6 20 37C27.4 34.6 33 27.5 33 19V9L20 4Z"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13 15H27M20 15V29"
            stroke="#ffffff"
            strokeWidth="3.2"
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
            turfsy<span style={{ color: '#3b82f6' }}>OTPs</span>
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
            Enterprise Route
          </span>
        </div>
      )}
    </div>
  );
};
