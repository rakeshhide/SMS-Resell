import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

export const SkeletonLine: React.FC<{
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}> = ({ width = '100%', height = '14px', style }) => (
  <Skeleton width={width} height={height} borderRadius="6px" style={style} />
);

export const SkeletonCircle: React.FC<{
  size?: number;
  style?: React.CSSProperties;
}> = ({ size = 40, style }) => (
  <Skeleton width={size} height={size} borderRadius="50%" style={style} />
);

export const SkeletonCard: React.FC<{
  height?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ height = 140, style, children }) => (
  <div
    className="surface-card"
    style={{
      height: `${height}px`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxSizing: 'border-box',
      ...style,
    }}
  >
    {children || (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonLine width="45%" height="16px" />
          <SkeletonCircle size={32} />
        </div>
        <SkeletonLine width="65%" height="28px" style={{ margin: '12px 0' }} />
        <SkeletonLine width="40%" height="12px" />
      </>
    )}
  </div>
);

export const SkeletonTableRows: React.FC<{
  rows?: number;
  cols?: number;
  colWidths?: string[];
}> = ({ rows = 5, cols = 5, colWidths = [] }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} style={{ padding: '14px 16px' }}>
              <SkeletonLine width={colWidths[cIdx] || '80%'} height="14px" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

/* --- Complete Page Skeletons --- */

export const DashboardSkeleton: React.FC = () => (
  <div className="page-container animate-fade-in">
    {/* Total Balance Hero Card Skeleton */}
    <div
      className="surface-card"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SkeletonLine width="160px" height="13px" />
        <SkeletonLine width="240px" height="36px" />
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <Skeleton width="110px" height="24px" borderRadius="12px" />
          <Skeleton width="130px" height="24px" borderRadius="12px" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Skeleton width="120px" height="42px" borderRadius="10px" />
        <Skeleton width="120px" height="42px" borderRadius="10px" />
      </div>
    </div>

    {/* 4 Metric Cards Skeleton */}
    <div className="grid-stats">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} height={140} />
      ))}
    </div>

    {/* Progression Tier Card Skeleton */}
    <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonLine width="200px" height="18px" />
        <SkeletonLine width="100px" height="16px" />
      </div>
      <Skeleton width="100%" height="8px" borderRadius="4px" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width="100%" height="56px" borderRadius="10px" />
        ))}
      </div>
    </div>

    {/* Recent Dispatches Table Skeleton */}
    <div className="surface-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <SkeletonLine width="180px" height="20px" />
        <Skeleton width="100px" height="32px" borderRadius="8px" />
      </div>
      <div className="table-responsive">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['20%', '20%', '15%', '20%', '15%', '10%'].map((w, i) => (
                <th key={i} style={{ padding: '12px 16px' }}>
                  <SkeletonLine width={w} height="12px" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows rows={6} cols={6} colWidths={['80%', '60%', '50%', '75%', '50%', '40%']} />
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export const WalletSkeleton: React.FC = () => (
  <div className="page-container animate-fade-in">
    {/* Balance Hero Card */}
    <div
      className="surface-card"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SkeletonLine width="150px" height="13px" />
        <SkeletonLine width="220px" height="36px" />
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <Skeleton width="100px" height="24px" borderRadius="12px" />
          <Skeleton width="120px" height="24px" borderRadius="12px" />
        </div>
      </div>
      <Skeleton width="150px" height="44px" borderRadius="10px" />
    </div>

    {/* Pricing Matrix Card */}
    <div className="surface-card">
      <div style={{ marginBottom: '18px' }}>
        <SkeletonLine width="220px" height="20px" />
        <SkeletonLine width="380px" height="13px" style={{ marginTop: '6px' }} />
      </div>
      <div className="table-responsive">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['30%', '25%', '25%', '20%'].map((w, i) => (
                <th key={i} style={{ padding: '12px 16px' }}>
                  <SkeletonLine width={w} height="12px" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows rows={5} cols={4} colWidths={['70%', '50%', '50%', '40%']} />
          </tbody>
        </table>
      </div>
    </div>

    {/* Ledger Table Card */}
    <div className="surface-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <SkeletonLine width="180px" height="20px" />
          <SkeletonLine width="260px" height="13px" style={{ marginTop: '6px' }} />
        </div>
        <Skeleton width="100px" height="34px" borderRadius="8px" />
      </div>
      <div className="table-responsive">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['18%', '28%', '16%', '18%', '20%'].map((w, i) => (
                <th key={i} style={{ padding: '12px 16px' }}>
                  <SkeletonLine width={w} height="12px" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows rows={6} cols={5} colWidths={['75%', '85%', '50%', '60%', '60%']} />
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export const TransactionsSkeleton: React.FC = () => (
  <div className="page-container animate-fade-in">
    {/* Search & Filter Bar */}
    <div
      className="surface-card"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      <Skeleton width="260px" height="38px" borderRadius="10px" />
      <div style={{ display: 'flex', gap: '8px' }}>
        <Skeleton width="90px" height="38px" borderRadius="10px" />
        <Skeleton width="90px" height="38px" borderRadius="10px" />
        <Skeleton width="90px" height="38px" borderRadius="10px" />
      </div>
    </div>

    {/* Table Card */}
    <div className="surface-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <SkeletonLine width="200px" height="20px" />
        <Skeleton width="110px" height="32px" borderRadius="8px" />
      </div>
      <div className="table-responsive">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['18%', '16%', '14%', '18%', '14%', '12%', '8%'].map((w, i) => (
                <th key={i} style={{ padding: '12px 16px' }}>
                  <SkeletonLine width={w} height="12px" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows rows={8} cols={7} colWidths={['75%', '65%', '55%', '80%', '60%', '50%', '40%']} />
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export const ApiKeysSkeleton: React.FC = () => (
  <div className="page-container animate-fade-in">
    {/* Header */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <SkeletonLine width="220px" height="24px" />
        <SkeletonLine width="340px" height="14px" style={{ marginTop: '6px' }} />
      </div>
      <Skeleton width="150px" height="42px" borderRadius="10px" />
    </div>

    {/* Credentials Table Card */}
    <div className="surface-card">
      <div className="table-responsive">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['25%', '25%', '15%', '15%', '10%', '10%'].map((w, i) => (
                <th key={i} style={{ padding: '12px 16px' }}>
                  <SkeletonLine width={w} height="12px" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows rows={4} cols={6} colWidths={['70%', '80%', '50%', '60%', '40%', '40%']} />
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export const AnalyticsSkeleton: React.FC = () => (
  <div className="page-container animate-fade-in">
    {/* Header */}
    <div>
      <SkeletonLine width="280px" height="24px" />
      <SkeletonLine width="420px" height="14px" style={{ marginTop: '6px' }} />
    </div>

    {/* 3 KPI Cards */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
        gap: '16px',
      }}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} height={120} />
      ))}
    </div>

    {/* 2 Chart Cards */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
      <div className="surface-card" style={{ height: '280px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <SkeletonLine width="180px" height="18px" />
        <Skeleton width="100%" height="210px" borderRadius="10px" />
      </div>
      <div className="surface-card" style={{ height: '280px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <SkeletonLine width="180px" height="18px" />
        <Skeleton width="100%" height="210px" borderRadius="10px" />
      </div>
    </div>
  </div>
);

export const AdminSkeleton: React.FC = () => (
  <div className="page-container animate-fade-in">
    {/* Header */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <SkeletonLine width="200px" height="24px" />
        <SkeletonLine width="320px" height="14px" style={{ marginTop: '6px' }} />
      </div>
      <Skeleton width="130px" height="38px" borderRadius="10px" />
    </div>

    {/* 4 Stats Cards */}
    <div className="grid-stats">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} height={130} />
      ))}
    </div>

    {/* Settings Card */}
    <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <SkeletonLine width="180px" height="20px" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Skeleton width="100%" height="50px" borderRadius="10px" />
        <Skeleton width="100%" height="50px" borderRadius="10px" />
      </div>
    </div>

    {/* Users Table Card */}
    <div className="surface-card">
      <SkeletonLine width="160px" height="20px" style={{ marginBottom: '16px' }} />
      <div className="table-responsive">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['20%', '25%', '15%', '15%', '15%', '10%'].map((w, i) => (
                <th key={i} style={{ padding: '12px 16px' }}>
                  <SkeletonLine width={w} height="12px" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows rows={6} cols={6} colWidths={['70%', '80%', '50%', '50%', '50%', '40%']} />
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export const SendOtpSkeleton: React.FC = () => (
  <div className="page-container animate-fade-in">
    <div className="surface-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <SkeletonLine width="180px" height="22px" />
        <SkeletonLine width="320px" height="14px" style={{ marginTop: '6px' }} />
      </div>
      <Skeleton width="120px" height="36px" borderRadius="10px" />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '24px' }}>
      <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <SkeletonLine width="140px" height="14px" />
        <Skeleton width="100%" height="42px" borderRadius="8px" />
        <SkeletonLine width="140px" height="14px" />
        <Skeleton width="100%" height="42px" borderRadius="8px" />
        <SkeletonLine width="140px" height="14px" />
        <Skeleton width="100%" height="42px" borderRadius="8px" />
        <Skeleton width="100%" height="46px" borderRadius="10px" style={{ marginTop: '10px' }} />
      </div>

      <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SkeletonLine width="180px" height="18px" />
        <Skeleton width="100%" height="100px" borderRadius="10px" />
        <Skeleton width="100%" height="120px" borderRadius="10px" />
      </div>
    </div>
  </div>
);

