import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CheckCircle2, Clock, Zap, Inbox } from 'lucide-react';
import { ApiClient } from '../services/api';

export const AnalyticsView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiClient.getAnalytics().then((res) => {
      if (res?.stats) setStats(res.stats);
      if (res?.trend) setTrend(res.trend);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const totalSent = parseInt(stats?.total_sent || '0');
  const delivered = parseInt(stats?.delivered || '0');
  const successRate = totalSent > 0 
    ? ((delivered / totalSent) * 100).toFixed(1) + '%' 
    : '100%';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', padding: '32px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Real-Time Delivery & Usage Analytics
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          Inspect latency, throughput volume, and historical dispatch trends across telecom carrier routes.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Month to Date Volume</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)', marginTop: '6px' }}>{stats?.month_sent || '0'}</div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px', fontWeight: 600 }}>Active accounting period</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Success Rate</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>{successRate}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Average across all mobile networks</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Float Consumed</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#3b82f6', marginTop: '6px' }}>
            ₹{stats?.total_spent ? parseFloat(stats.total_spent).toFixed(2) : '0.00'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Deducted from float via active rate</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Carrier Status</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>Online</div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px', fontWeight: 600 }}>Direct transactional bind</div>
        </div>
      </div>

      {/* 7-Day Usage Activity Bar Graph */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Daily Dispatch Frequency</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Messages dispatched per day over the last 7 calendar days.</p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6', backgroundColor: '#eff6ff', padding: '4px 10px', borderRadius: '6px' }}>
            Live Sync
          </span>
        </div>

        {trend.length === 0 || trend.every((t) => parseInt(t.count || '0') === 0) ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
            <Inbox size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>No usage activity in the last 7 days</div>
            <div style={{ fontSize: '12px', marginTop: '2px' }}>Start sending messages to view historical daily graphs.</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${trend.length}, 1fr)`,
            gap: '16px',
            height: '220px',
            alignItems: 'flex-end',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            {trend.map((d, idx) => {
              const countNum = parseInt(d.count) || 0;
              const maxVal = Math.max(...trend.map((t) => parseInt(t.count) || 1), 10);
              const heightPercent = countNum > 0 ? Math.min(Math.max((countNum / maxVal) * 100, 10), 100) : 4;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>{countNum}</span>
                  <div style={{
                    width: '100%',
                    height: `${heightPercent}%`,
                    backgroundColor: countNum > 0 ? '#3b82f6' : 'var(--border-subtle)',
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 0.3s ease'
                  }}></div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {d.date_label.slice(-5)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
