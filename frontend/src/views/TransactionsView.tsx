import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle, Eye } from 'lucide-react';
import { OtpTransaction } from '../types';
import { ApiClient } from '../services/api';

export const TransactionsView: React.FC = () => {
  const [transactions, setTransactions] = useState<OtpTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState<OtpTransaction | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [page, statusFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.getTransactions(page, 15, statusFilter, search);
      if (res?.data) {
        setTransactions(res.data);
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '32px' }}>
      
      {/* Top Filter & Search Bar */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '300px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-app)',
            padding: '8px 14px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            flex: 1
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search masked number or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '13px',
                color: 'var(--text-main)',
                width: '100%'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            Search
          </button>
        </form>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontSize: '13px',
                fontWeight: 500,
                outline: 'none'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          <button
            onClick={() => fetchTransactions()}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
            title="Refresh"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recipient</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Channel / Key</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Timestamp</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Charged</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '14px' }}>
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '14px' }}>
                    No transactions found for the specified filters.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      {tx.phone_masked}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {tx.api_key_name || (tx.key_prefix ? `${tx.key_prefix}...` : 'Direct Channel')}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: tx.status === 'DELIVERED' ? '#ecfdf5' : (tx.status === 'REFUNDED' ? '#fffbeb' : '#fef2f2'),
                        color: tx.status === 'DELIVERED' ? '#047857' : (tx.status === 'REFUNDED' ? '#b45309' : '#b91c1c')
                      }}>
                        {tx.status === 'DELIVERED' && <CheckCircle2 size={13} />}
                        {tx.status === 'FAILED' && <XCircle size={13} />}
                        {tx.status === 'REFUNDED' && <AlertCircle size={13} />}
                        <span>{tx.status}</span>
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                      ₹{parseFloat(tx.total_charged).toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedTx(tx)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-app)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px'
                        }}
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-subtle)',
          marginTop: '12px'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing page {page} of {totalPages} ({totalCount} total dispatches)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                color: page <= 1 ? 'var(--text-muted)' : 'var(--text-main)',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px'
              }}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-main)',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px'
              }}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Inspection Modal */}
      {selectedTx && (
        <div className="modal-overlay" onClick={() => setSelectedTx(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Transaction Details</h3>
              <button onClick={() => setSelectedTx(null)} style={{ color: 'var(--text-muted)', fontSize: '18px', fontWeight: 700 }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Transaction Reference:</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{selectedTx.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Masked Recipient:</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{selectedTx.phone_masked}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Delivery Status:</span>
                <span style={{ fontWeight: 600, color: selectedTx.status === 'DELIVERED' ? '#10b981' : '#ef4444' }}>{selectedTx.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Charged:</span>
                <span style={{ fontWeight: 700 }}>₹{parseFloat(selectedTx.total_charged).toFixed(4)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Carrier Code:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedTx.delivery_code || 'ACCEPTED'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Dispatch Timestamp:</span>
                <span>{new Date(selectedTx.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedTx(null)}
                style={{
                  padding: '8px 18px',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-main)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
