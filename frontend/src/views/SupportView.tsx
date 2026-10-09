import React, { useState, useEffect, useRef } from 'react';
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  X,
  ArrowLeft
} from 'lucide-react';
import { ApiClient } from '../services/api';
import { SupportTicket, SupportMessage } from '../types';
import { ToastContainer, ToastMessage } from '../components/Toast';

export const SupportView: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  // New Ticket Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [newQuestion, setNewQuestion] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);

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
    fetchMyTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
    }
  }, [selectedTicket?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.listSupportTickets();
      if (res?.data) {
        setTickets(res.data);
        if (!selectedTicket && res.data.length > 0 && !isMobile) {
          setSelectedTicket(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      setLoadingMessages(true);
      const res = await ApiClient.getSupportTicket(ticketId);
      if (res?.data) {
        setMessages(res.data.messages);
        setSelectedTicket(res.data.ticket);
      }
    } catch (err) {
      console.error('Failed to load message thread', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newQuestion.trim() || submittingTicket) return;

    try {
      setSubmittingTicket(true);
      const res = await ApiClient.createSupportTicket({
        subject: newSubject.trim(),
        category: newCategory,
        priority: newPriority,
        message: newQuestion.trim()
      });

      if (res?.data) {
        setTickets((prev) => [res.data.ticket, ...prev]);
        setSelectedTicket(res.data.ticket);
        setMessages([res.data.message]);
        setShowNewModal(false);
        setNewSubject('');
        setNewQuestion('');
        showToast('success', 'Your inquiry has been submitted to support team.', 'Inquiry Created');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to submit inquiry', 'Inquiry Error');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTicket || !replyText.trim() || sendingReply) return;

    try {
      setSendingReply(true);
      const res = await ApiClient.sendSupportMessage(selectedTicket.id, replyText.trim());
      if (res?.data) {
        setMessages((prev) => [...prev, res.data]);
        setReplyText('');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to send message', 'Dispatch Error');
    } finally {
      setSendingReply(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    if (!window.confirm('Mark this inquiry as resolved?')) return;

    try {
      const res = await ApiClient.updateSupportTicketStatus(selectedTicket.id, 'RESOLVED');
      if (res?.data) {
        setSelectedTicket(res.data);
        setTickets((prev) =>
          prev.map((t) => (t.id === selectedTicket.id ? res.data : t))
        );
        showToast('success', `Inquiry #${selectedTicket.ticketNumber} marked as resolved.`, 'Ticket Resolved');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update ticket status', 'Status Error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return { bg: '#ecfdf5', text: '#047857', label: 'Open' };
      case 'IN_PROGRESS':
        return { bg: '#eff6ff', text: '#1d4ed8', label: 'In Progress' };
      case 'RESOLVED':
        return { bg: '#faf5ff', text: '#7e22ce', label: 'Resolved' };
      case 'CLOSED':
        return { bg: '#f3f4f6', text: '#4b5563', label: 'Closed' };
      default:
        return { bg: '#f3f4f6', text: '#4b5563', label: status };
    }
  };

  return (
    <div className="page-container">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {/* Title & Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LifeBuoy size={26} color="#3b82f6" />
            <span>Developer Support & Assistance</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Have a question about OTP delivery, billing, or API integration? Ask our engineers directly.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Plus size={16} />
          <span>Ask a Question</span>
        </button>
      </div>

      {/* Main Support Chat Shell */}
      <div
        className="admin-chat-container"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          height: '680px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Left Side: Ticket List */}
        {(!isMobile || !selectedTicket) && (
          <div style={{
            width: isMobile ? '100%' : '320px',
            borderRight: isMobile ? 'none' : '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-app)',
            height: '100%'
          }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-main)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Your Tickets ({tickets.length})</span>
            <button
              onClick={fetchMyTickets}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {tickets.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <HelpCircle size={28} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                <p>No questions submitted yet.</p>
                <button
                  onClick={() => setShowNewModal(true)}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface)',
                    color: '#3b82f6',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Ask your first question
                </button>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                const statusBadge = getStatusBadge(t.status);

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
                      borderLeft: isSelected ? '4px solid #3b82f6' : '4px solid transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#3b82f6'
                      }}>
                        {t.ticketNumber}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: statusBadge.bg,
                        color: statusBadge.text,
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
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {t.subject}
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(t.lastMessageAt || t.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        )}

        {/* Right Side: Chat Area */}
        {(!isMobile || selectedTicket) && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-surface)',
            height: '100%',
            width: isMobile ? '100%' : 'auto'
          }}>
            {selectedTicket ? (
              <>
                {/* Header */}
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div>
                    {isMobile && (
                      <button
                        onClick={() => setSelectedTicket(null)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          marginBottom: '8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-app)',
                          color: 'var(--text-main)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <ArrowLeft size={14} />
                        <span>Back to Inquiries</span>
                      </button>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#3b82f6',
                        backgroundColor: '#eff6ff',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {selectedTicket.ticketNumber}
                      </span>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        {selectedTicket.subject}
                      </h4>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Category: <strong>{selectedTicket.category}</strong> • Priority: <strong>{selectedTicket.priority}</strong>
                    </div>
                  </div>

                {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                  <button
                    onClick={handleResolveTicket}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1fae5',
                      backgroundColor: '#ecfdf5',
                      color: '#047857',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>Mark as Resolved</span>
                  </button>
                )}
              </div>

              {/* Message Thread */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                backgroundColor: 'var(--bg-app)'
              }}>
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    Loading conversation...
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
                          alignItems: isAdmin ? 'flex-start' : 'flex-end',
                          maxWidth: '80%',
                          alignSelf: isAdmin ? 'flex-start' : 'flex-end'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          marginBottom: '4px'
                        }}>
                          {isAdmin ? (
                            <>
                              <ShieldCheck size={12} color="#8b5cf6" />
                              <span style={{ fontWeight: 700, color: '#8b5cf6' }}>turfsyOTPs Engineering Team</span>
                            </>
                          ) : (
                            <span style={{ fontWeight: 600 }}>You</span>
                          )}
                          <span>•</span>
                          <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div style={{
                          padding: '12px 16px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          backgroundColor: isAdmin ? 'var(--bg-surface)' : '#3b82f6',
                          color: isAdmin ? 'var(--text-main)' : '#ffffff',
                          border: isAdmin ? '1px solid var(--border-subtle)' : 'none',
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

              {/* Reply Input */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)'
                }}
              >
                <div style={{ display: 'flex', gap: '10px' }}>
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message to support... (Press Enter to send)"
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
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: replyText.trim() ? '#3b82f6' : 'var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: replyText.trim() ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <Send size={15} />
                    <span>Send</span>
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
              color: 'var(--text-muted)'
            }}>
              <MessageSquare size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                No Ticket Selected
              </h4>
              <p style={{ fontSize: '13px', textAlign: 'center', maxWidth: '300px' }}>
                Select an inquiry from the left or ask a new question to start a conversation.
              </p>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Ask Question Modal */}
      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '28px', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Ask Support a Question
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Question regarding API integration or wallet top-up"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-main)',
                    marginTop: '4px',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-main)',
                      marginTop: '4px',
                      fontSize: '13px'
                    }}
                  >
                    <option value="general">General Inquiry</option>
                    <option value="billing">Billing & Top-up</option>
                    <option value="otp_delivery">OTP & SMS Delivery</option>
                    <option value="api_integration">API Integration</option>
                    <option value="account">Account & Security</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-main)',
                      marginTop: '4px',
                      fontSize: '13px'
                    }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Question / Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your inquiry in detail..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-main)',
                    marginTop: '4px',
                    fontSize: '13px',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {submittingTicket ? 'Submitting...' : 'Submit Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
