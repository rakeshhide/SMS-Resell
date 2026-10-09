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
  CheckCheck
} from 'lucide-react';
import { ApiClient } from '../services/api';
import { SupportTicket, SupportMessage } from '../types';

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

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
        // If selected ticket still in list, update its state
        if (selectedTicket) {
          const updated = res.data.find((t) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load support tickets', err);
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
        // Update unread count in tickets list locally
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, unreadCount: 0 } : t))
        );
      }
    } catch (err) {
      console.error('Failed to load messages', err);
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
        // Update ticket's status to IN_PROGRESS locally if it was OPEN
        if (selectedTicket.status === 'OPEN') {
          setSelectedTicket({ ...selectedTicket, status: 'IN_PROGRESS' });
          setTickets((prev) =>
            prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: 'IN_PROGRESS' } : t))
          );
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch reply');
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
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket status');
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
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: '760px'
    }}>
      {/* Top Header */}
      <div style={{
        padding: '18px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
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
            color: '#ffffff'
          }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Support Chat & Customer Inquiries
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Direct developer assistance, ticket triage, and real-time response center.
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
          <RefreshCw size={14} className={loadingTickets ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Split Layout */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left Side: Ticket Queue */}
        <div style={{
          width: '380px',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-app)'
        }}>
          {/* Search & Filter Toolbar */}
          <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '6px 10px',
              marginBottom: '10px'
            }}>
              <Search size={15} color="var(--text-muted)" />
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

            {/* Status Tabs */}
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
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
                      padding: '14px',
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
                      borderLeft: isSelected ? '4px solid #3b82f6' : '4px solid transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#3b82f6',
                          backgroundColor: '#eff6ff',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {t.ticketNumber}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: priorityBadge.bg,
                          color: priorityBadge.text,
                          padding: '2px 5px',
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
                        padding: '2px 6px',
                        borderRadius: '4px'
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
                      <span>{t.userName || t.userEmail}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {t.unreadCount && t.unreadCount > 0 ? (
                          <span style={{
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            borderRadius: '10px',
                            padding: '1px 6px',
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-surface)' }}>
          {selectedTicket ? (
            <>
              {/* Conversation Header */}
              <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#3b82f6',
                      backgroundColor: '#eff6ff',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {selectedTicket.ticketNumber}
                    </span>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {selectedTicket.subject}
                    </h4>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Submitted by <strong>{selectedTicket.userName || 'User'}</strong> ({selectedTicket.userEmail}) on{' '}
                    {new Date(selectedTicket.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Status Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value as any)}
                    disabled={statusUpdating}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
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

              {/* Message History Thread */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
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
                          maxWidth: '82%',
                          alignSelf: isAdmin ? 'flex-end' : 'flex-start'
                        }}
                      >
                        {/* Sender Label */}
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

                        {/* Message Bubble */}
                        <div style={{
                          padding: '12px 16px',
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
                  padding: '16px 24px',
                  borderTop: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)'
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
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
                    placeholder="Type reply to developer... (Press Enter to send, Shift+Enter for newline)"
                    disabled={sendingReply}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
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
                      padding: '12px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: replyText.trim() ? '#3b82f6' : 'var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: replyText.trim() ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Send size={15} />
                    <span>{sendingReply ? 'Sending...' : 'Send Reply'}</span>
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  User will receive a real-time notification on their dashboard upon reply.
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
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-app)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <MessageSquare size={32} color="var(--text-muted)" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Select a Support Inquiry
              </h4>
              <p style={{ fontSize: '13px', maxWidth: '340px', lineHeight: 1.5 }}>
                Choose a customer conversation from the queue on the left to review question history and send official replies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
