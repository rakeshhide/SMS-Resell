import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  User,
  ShieldCheck,
  ChevronRight,
  Filter,
  CheckCheck,
  ArrowLeft
} from 'lucide-react';
import { ApiClient } from '../services/api';
import { SupportTicket, SupportMessage } from '../types';
import { ToastContainer, ToastMessage } from './Toast';

export const AdminSupportChat: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showToast = (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, title }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
    }
  }, [selectedTicket?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await ApiClient.listSupportTickets({
        status: statusFilter,
        search: searchQuery
      });
      if (res?.data) {
        setTickets(res.data);
        if (selectedTicket) {
          const updated = res.data.find((t) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (err: any) {
      console.error('Failed to load support tickets', err);
      showToast('error', err.message || 'Failed to load tickets queue', 'Network Error');
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      setLoadingMessages(true);
      const res = await ApiClient.getSupportTicket(ticketId);
      if (res?.data) {
        setMessages(res.data.messages);
        setSelectedTicket(res.data.ticket);
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, unreadCount: 0 } : t))
        );
      }
    } catch (err: any) {
      console.error('Failed to load messages', err);
      showToast('error', err.message || 'Failed to load conversation thread', 'Chat Error');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTicket || !replyText.trim() || sendingReply) return;

    try {
      setSendingReply(true);
      const res = await ApiClient.sendSupportMessage(selectedTicket.id, replyText.trim());
      if (res?.data) {
        setMessages((prev) => [...prev, res.data]);
        setReplyText('');
        showToast('success', 'Reply dispatched to customer successfully.', 'Reply Sent');
        if (selectedTicket.status === 'OPEN') {
          setSelectedTicket({ ...selectedTicket, status: 'IN_PROGRESS' });
          setTickets((prev) =>
            prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: 'IN_PROGRESS' } : t))
          );
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to dispatch reply.', 'Message Error');
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') => {
    if (!selectedTicket || statusUpdating) return;
    try {
      setStatusUpdating(true);
      const res = await ApiClient.updateSupportTicketStatus(selectedTicket.id, newStatus);
      if (res?.data) {
        setSelectedTicket(res.data);
        setTickets((prev) =>
          prev.map((t) => (t.id === selectedTicket.id ? res.data : t))
        );
        showToast('success', `Ticket #${selectedTicket.ticketNumber} marked as ${newStatus}.`, 'Status Updated');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update ticket status.', 'Status Error');
    } finally {
      setStatusUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', label: 'Open' };
      case 'IN_PROGRESS':
        return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', label: 'In Progress' };
      case 'RESOLVED':
        return { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff', label: 'Resolved' };
      case 'CLOSED':
        return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb', label: 'Closed' };
      default:
        return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb', label: status };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return { bg: '#fef2f2', text: '#b91c1c', label: 'Urgent' };
      case 'HIGH':
        return { bg: '#fff7ed', text: '#c2410c', label: 'High' };
      case 'MEDIUM':
        return { bg: '#eff6ff', text: '#1d4ed8', label: 'Medium' };
      default:
        return { bg: '#f3f4f6', text: '#4b5563', label: 'Low' };
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.ticketNumber?.toLowerCase().includes(query) ||
      t.subject?.toLowerCase().includes(query) ||
      t.userEmail?.toLowerCase().includes(query) ||
      t.userName?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: isMobile ? 'calc(100vh - 160px)' : '740px',
        minHeight: '520px',
        width: '100%',
        maxWidth: '100%'
      }}>
        {/* Top Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0
            }}>
              <MessageSquare size={19} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Support Chat & Customer Inquiries
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Direct developer assistance and real-time response center.
              </p>
            </div>
          </div>

          <button
            onClick={fetchTickets}
            disabled={loadingTickets}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} className={loadingTickets ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Main Split Layout */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
          {/* Left Side: Ticket Queue (Hidden on mobile if ticket is open) */}
          <div style={{
            width: isMobile ? '100%' : '350px',
            display: isMobile && selectedTicket ? 'none' : 'flex',
            borderRight: isMobile ? 'none' : '1px solid var(--border-subtle)',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-app)',
            flexShrink: 0
          }}>
            {/* Search & Filter Toolbar */}
            <div style={{ padding: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '7px 10px',
                marginBottom: '10px'
              }}>
                <Search size={14} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search ticket, email, subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    width: '100%',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Status Tabs with Horizontal Scroll */}
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
                {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: statusFilter === st ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      backgroundColor: statusFilter === st ? '#3b82f6' : 'var(--bg-surface)',
                      color: statusFilter === st ? '#ffffff' : 'var(--text-secondary)'
                    }}
                  >
                    {st === 'ALL' ? 'All' : st === 'IN_PROGRESS' ? 'In Progress' : st.charAt(0) + st.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket Cards Stream */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingTickets && tickets.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Loading customer inquiries...
                </div>
              ) : filteredTickets.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No inquiries found matching criteria.
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;
                  const statusBadge = getStatusBadge(t.status);
                  const priorityBadge = getPriorityBadge(t.priority);

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      style={{
                        padding: '12px 14px',
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
                        borderLeft: isSelected ? '4px solid #3b82f6' : '4px solid transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#3b82f6',
                            backgroundColor: '#eff6ff',
                            padding: '1px 5px',
                            borderRadius: '4px'
                          }}>
                            {t.ticketNumber}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor: priorityBadge.bg,
                            color: priorityBadge.text,
                            padding: '1px 5px',
                            borderRadius: '4px'
                          }}>
                            {priorityBadge.label}
                          </span>
                        </div>

                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: statusBadge.bg,
                          color: statusBadge.text,
                          border: `1px solid ${statusBadge.border}`,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          flexShrink: 0
                        }}>
                          {statusBadge.label}
                        </span>
                      </div>

                      <div style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        marginBottom: '3px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {t.subject}
                      </div>

                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '6px'
                      }}>
                        {t.latestMessage || 'No messages yet'}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                          {t.userName || t.userEmail}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          {t.unreadCount && t.unreadCount > 0 ? (
                            <span style={{
                              backgroundColor: '#ef4444',
                              color: '#ffffff',
                              borderRadius: '10px',
                              padding: '1px 5px',
                              fontWeight: 700,
                              fontSize: '10px'
                            }}>
                              {t.unreadCount} new
                            </span>
                          ) : null}
                          <span>{new Date(t.lastMessageAt || t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Side: Active Chat Conversation */}
          <div style={{
            flex: 1,
            display: isMobile && !selectedTicket ? 'none' : 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-surface)',
            width: isMobile ? '100%' : 'auto',
            minWidth: 0
          }}>
            {selectedTicket ? (
              <>
                {/* Conversation Header */}
                <div style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {/* Mobile Back Button */}
                  {isMobile && (
                    <button
                      onClick={() => setSelectedTicket(null)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-main)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        width: 'fit-content'
                      }}
                    >
                      <ArrowLeft size={14} />
                      <span>Back to Inquiries</span>
                    </button>
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#3b82f6',
                          backgroundColor: '#eff6ff',
                          padding: '2px 7px',
                          borderRadius: '4px'
                        }}>
                          {selectedTicket.ticketNumber}
                        </span>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                          {selectedTicket.subject}
                        </h4>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', wordBreak: 'break-word' }}>
                        Submitted by <strong>{selectedTicket.userName || 'User'}</strong> ({selectedTicket.userEmail})
                      </div>
                    </div>

                    {/* Status Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</label>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleStatusChange(e.target.value as any)}
                        disabled={statusUpdating}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-app)',
                          color: 'var(--text-main)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Message History Thread */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  backgroundColor: 'var(--bg-app)'
                }}>
                  {loadingMessages ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      Loading message thread...
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isAdmin = m.senderRole === 'admin';

                      return (
                        <div
                          key={m.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isAdmin ? 'flex-end' : 'flex-start',
                            maxWidth: isMobile ? '92%' : '82%',
                            alignSelf: isAdmin ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            marginBottom: '4px',
                            padding: '0 4px'
                          }}>
                            {isAdmin ? (
                              <>
                                <ShieldCheck size={12} color="#8b5cf6" />
                                <span style={{ fontWeight: 700, color: '#8b5cf6' }}>turfsyOTPs Support Team</span>
                              </>
                            ) : (
                              <>
                                <User size={12} color="var(--text-secondary)" />
                                <span style={{ fontWeight: 600 }}>{m.senderName || selectedTicket.userName || 'User'}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          <div style={{
                            padding: '10px 14px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            backgroundColor: isAdmin ? '#3b82f6' : 'var(--bg-surface)',
                            color: isAdmin ? '#ffffff' : 'var(--text-main)',
                            border: isAdmin ? 'none' : '1px solid var(--border-subtle)',
                            boxShadow: 'var(--shadow-sm)'
                          }}>
                            {m.message}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Form */}
                <form
                  onSubmit={handleSendReply}
                  style={{
                    padding: '12px 18px',
                    borderTop: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                      placeholder="Type reply to developer... (Enter to send)"
                      disabled={sendingReply}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-main)',
                        fontSize: '13px',
                        resize: 'none',
                        outline: 'none'
                      }}
                    />

                    <button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: replyText.trim() ? '#3b82f6' : 'var(--border-subtle)',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: replyText.trim() ? 'pointer' : 'not-allowed',
                        transition: 'all 0.15s ease',
                        flexShrink: 0
                      }}
                    >
                      <Send size={14} />
                      <span style={{ display: isMobile ? 'none' : 'inline' }}>{sendingReply ? 'Sending...' : 'Send'}</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                color: 'var(--text-muted)',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-app)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px'
                }}>
                  <MessageSquare size={28} color="var(--text-muted)" />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  Select a Support Inquiry
                </h4>
                <p style={{ fontSize: '12px', maxWidth: '320px', lineHeight: 1.5 }}>
                  Choose a customer conversation from the queue on the left to review question history and send official replies.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
