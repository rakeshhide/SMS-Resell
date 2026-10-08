import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  DollarSign,
  Layers,
  Settings,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileText,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  Edit2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { ApiClient } from '../services/api';
import { PricingTier, SystemSettings } from '../types';

export const AdminView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // System Settings
  const [minTopup, setMinTopup] = useState<number>(100);
  const [defaultGst, setDefaultGst] = useState<number>(18);
  const [savingSettings, setSavingSettings] = useState(false);

  // Pricing Tiers
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMinTopup, setNewMinTopup] = useState<number>(100);
  const [newMaxTopup, setNewMaxTopup] = useState<string>('');
  const [newOtpPrice, setNewOtpPrice] = useState<number>(0.75);
  const [newGstPercent, setNewGstPercent] = useState<number>(18);
  const [submittingTier, setSubmittingTier] = useState(false);

  // Adjustment Modal
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [adjustReason, setAdjustReason] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [ovRes, usersRes, logsRes, tiersRes] = await Promise.all([
        ApiClient.getAdminOverview(),
        ApiClient.listUsers(1, 20),
        ApiClient.getAuditLogs(),
        ApiClient.listAdminPricingTiers().catch(() => ({ success: false, tiers: [], settings: { minTopup: 100, defaultGst: 18 } }))
      ]);

      if (ovRes?.stats) setStats(ovRes.stats);
      if (usersRes?.users) setUsers(usersRes.users);
      if (logsRes?.logs) setAuditLogs(logsRes.logs);

      if (tiersRes?.tiers) setTiers(tiersRes.tiers);
      if (tiersRes?.settings) {
        setMinTopup(tiersRes.settings.minTopup || 100);
        setDefaultGst(tiersRes.settings.defaultGst || 18);
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await ApiClient.updateAdminSettings(minTopup, defaultGst);
      alert('Global platform settings updated successfully.');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleTier = async (tierId: string, currentStatus: boolean) => {
    try {
      await ApiClient.toggleAdminPricingTier(tierId, !currentStatus);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle tier status');
    }
  };

  const handleDeleteTier = async (tierId: string) => {
    if (!window.confirm('Are you sure you want to delete this pricing tier?')) return;
    try {
      await ApiClient.deleteAdminPricingTier(tierId);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete tier');
    }
  };

  const handleCreateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingTier(true);
      await ApiClient.createAdminPricingTier({
        minTopup: newMinTopup,
        maxTopup: newMaxTopup ? parseFloat(newMaxTopup) : null,
        otpPrice: newOtpPrice,
        gstPercentage: newGstPercent,
        isActive: true,
      });
      setShowAddModal(false);
      alert('New pricing tier created successfully.');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to create pricing tier');
    } finally {
      setSubmittingTier(false);
    }
  };

  const handleUpdateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier) return;
    try {
      setSubmittingTier(true);
      await ApiClient.updateAdminPricingTier(editingTier.id, {
        minTopup: editingTier.minTopup,
        maxTopup: editingTier.maxTopup,
        otpPrice: editingTier.otpPrice,
        gstPercentage: editingTier.gstPercentage,
        isActive: editingTier.isActive,
      });
      setEditingTier(null);
      alert('Pricing tier updated successfully.');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update tier');
    } finally {
      setSubmittingTier(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`Are you sure you want to change user status to ${newStatus}?`)) return;

    try {
      await ApiClient.toggleUserStatus(userId, newStatus);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleExecuteAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !adjustReason) return;

    try {
      setSubmittingAdjust(true);
      const res = await ApiClient.manualWalletAdjustment(selectedUser.id, adjustAmount, adjustReason);
      alert(res.message);
      setSelectedUser(null);
      setAdjustReason('');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to execute adjustment');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '32px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={26} color="#8b5cf6" />
            <span>Platform Administration & Compliance Center</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            System-wide float monitoring, customer account oversight, pricing rules, and compliance audit trail.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active Developers</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', marginTop: '6px' }}>{stats?.totalUsers || 0}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Circulating Wallet Float</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', marginTop: '6px' }}>
            ₹{(stats?.circulatingWalletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total OTP Dispatches</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#3b82f6', marginTop: '6px' }}>{stats?.totalOtpsSent || 0}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Gross Dispatch Revenue</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>
            ₹{(stats?.grossRevenue || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Global Platform Settings Form */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Settings size={20} color="#3b82f6" />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
            Global Top-Up & Tax Rules
          </h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Configure minimum top-up requirements and standard statutory GST rates without redeploying code.
        </p>

        <form onSubmit={handleSaveSettings} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Minimum Wallet Top-up (₹)
            </label>
            <input
              type="number"
              min={1}
              value={minTopup}
              onChange={(e) => setMinTopup(parseFloat(e.target.value) || 100)}
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Statutory GST Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={defaultGst}
              onChange={(e) => setDefaultGst(parseFloat(e.target.value) || 18)}
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={savingSettings}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: savingSettings ? 'not-allowed' : 'pointer'
              }}
            >
              {savingSettings ? 'Saving...' : 'Update Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Pricing Tiers Management Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="#10b981" />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                Configurable Pricing Tiers
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Manage volume brackets, OTP selling rates, and active tier statuses.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            <span>Add Pricing Tier</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tier Label</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Min Top-up (₹)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Max Top-up (₹)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>OTP Selling Price</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>GST %</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => (
                <tr key={tier.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {tier.label || tier.name || 'Tier'}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                    ₹{tier.minTopup.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {tier.maxTopup !== null ? `₹${tier.maxTopup.toLocaleString()}` : 'No Limit'}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: '#3b82f6', fontSize: '14px' }}>
                    ₹{tier.otpPrice.toFixed(2)} / OTP
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                    {tier.gstPercentage}%
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => handleToggleTier(tier.id, tier.isActive)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: tier.isActive ? '#ecfdf5' : '#f3f4f6',
                        color: tier.isActive ? '#047857' : '#6b7280'
                      }}
                    >
                      {tier.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      <span>{tier.isActive ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => setEditingTier({ ...tier })}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-app)',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px'
                        }}
                      >
                        <Edit2 size={12} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTier(tier.id)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #fee2e2',
                          backgroundColor: '#fef2f2',
                          color: '#b91c1c',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px'
                        }}
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Tier Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '28px', maxWidth: '440px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-main)' }}>
              Add New Pricing Tier
            </h3>
            <form onSubmit={handleCreateTier} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Min Top-Up (₹)</label>
                <input
                  type="number"
                  required
                  value={newMinTopup}
                  onChange={(e) => setNewMinTopup(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Max Top-Up (₹, leave blank for no upper limit)</label>
                <input
                  type="number"
                  placeholder="e.g. 4999 (optional)"
                  value={newMaxTopup}
                  onChange={(e) => setNewMaxTopup(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>OTP Selling Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newOtpPrice}
                  onChange={(e) => setNewOtpPrice(parseFloat(e.target.value) || 0.75)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>GST Percentage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newGstPercent}
                  onChange={(e) => setNewGstPercent(parseFloat(e.target.value) || 18)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'transparent' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTier}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600 }}
                >
                  {submittingTier ? 'Creating...' : 'Create Tier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tier Modal */}
      {editingTier && (
        <div className="modal-overlay" onClick={() => setEditingTier(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '28px', maxWidth: '440px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-main)' }}>
              Edit Pricing Tier
            </h3>
            <form onSubmit={handleUpdateTier} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Min Top-Up (₹)</label>
                <input
                  type="number"
                  required
                  value={editingTier.minTopup}
                  onChange={(e) => setEditingTier({ ...editingTier, minTopup: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Max Top-Up (₹, leave blank for no upper limit)</label>
                <input
                  type="number"
                  placeholder="No limit"
                  value={editingTier.maxTopup !== null ? editingTier.maxTopup : ''}
                  onChange={(e) => setEditingTier({ ...editingTier, maxTopup: e.target.value ? parseFloat(e.target.value) : null })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>OTP Selling Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editingTier.otpPrice}
                  onChange={(e) => setEditingTier({ ...editingTier, otpPrice: parseFloat(e.target.value) || 0.60 })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>GST Percentage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingTier.gstPercentage}
                  onChange={(e) => setEditingTier({ ...editingTier, gstPercentage: parseFloat(e.target.value) || 18 })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingTier(null)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'transparent' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTier}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600 }}
                >
                  {submittingTier ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Developer Accounts Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="#3b82f6" />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
              Developer Accounts & Floating Wallets
            </h3>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>User / Org</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Available Float</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Created</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.full_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: u.role === 'admin' ? '#f5f3ff' : 'var(--bg-app)',
                      color: u.role === 'admin' ? '#7c3aed' : 'var(--text-main)'
                    }}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: u.status === 'active' ? '#ecfdf5' : '#fef2f2',
                      color: u.status === 'active' ? '#047857' : '#b91c1c'
                    }}>
                      {u.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                    ₹{parseFloat(u.balance || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => setSelectedUser(u)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-app)',
                          color: 'var(--text-main)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Adjust Float
                      </button>

                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid',
                            borderColor: u.status === 'active' ? '#fee2e2' : '#d1fae5',
                            backgroundColor: u.status === 'active' ? '#fef2f2' : '#ecfdf5',
                            color: u.status === 'active' ? '#b91c1c' : '#047857',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Wallet Adjustment Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '32px', maxWidth: '460px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              Manual Wallet Float Adjustment
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Adjust balance for <strong>{selectedUser.full_name}</strong> ({selectedUser.email}).
            </p>

            <form onSubmit={handleExecuteAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Adjustment Amount (₹, use negative to debit)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Mandatory Audit Reason (min. 5 chars)
                </label>
                <textarea
                  required
                  rows={3}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Promotional credit grant / Billing correction..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'transparent' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjust}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600 }}
                >
                  {submittingAdjust ? 'Applying...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compliance Audit Trail */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <FileText size={20} color="#8b5cf6" />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
            Compliance & Administrative Audit Trail
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actor</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Target</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Reason / Audit Detail</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#3b82f6' }}>
                    {log.action}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-main)' }}>
                    {log.actor_email || 'System'}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                    {log.target_type}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-main)' }}>
                    {log.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
