import React from 'react';
import { X, Download, Printer, CheckCircle2 } from 'lucide-react';
import { InvoiceData, generateInvoicePdf } from '../utils/invoiceGenerator';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: InvoiceData | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, invoiceData }) => {
  if (!isOpen || !invoiceData) return null;

  const handleDownload = () => {
    generateInvoicePdf(invoiceData);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          padding: '28px',
          borderRadius: '20px',
          backgroundColor: 'var(--bg-card, #ffffff)'
        }}
      >
        {/* Header Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
              Payment Receipt
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#059669',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '2px 8px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <CheckCircle2 size={12} color="#059669" />
              PAID
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleDownload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
              }}
              title="Download PDF Receipt"
            >
              <Download size={14} />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Print Receipt"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Clean Printable Receipt View */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          padding: '22px',
          color: '#1e293b',
          fontSize: '13px'
        }}>
          {/* Top Brand & Metadata */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e293b' }}>
                turfsy<span style={{ color: '#3b82f6' }}>OTPs</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Enterprise SMS & OTP Routing Infrastructure
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                RECEIPT NUMBER
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                {invoiceData.invoiceNumber}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                {invoiceData.date}
              </div>
            </div>
          </div>

          {/* Customer & Payment Info */}
          <div style={{
            padding: '12px 14px',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            marginBottom: '18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Billed To
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {invoiceData.customerName || 'Registered Account'}
              </div>
              {invoiceData.customerEmail && (
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {invoiceData.customerEmail}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Payment Reference
              </div>
              <div style={{ fontSize: '11px', color: '#0f172a', fontWeight: 600, marginTop: '2px', wordBreak: 'break-all' }}>
                {invoiceData.paymentId || invoiceData.orderId || 'Wallet Top-Up'}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: '#475569' }}>Description</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: '#475569' }}>Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 10px' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>Wallet Top-Up Balance (SMS & OTP Float)</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>100% credited directly to your messaging float</div>
                </td>
                <td style={{ textAlign: 'right', padding: '10px 10px', fontWeight: 700, color: '#0f172a' }}>
                  ₹{invoiceData.creditAmount.toFixed(2)}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 10px', color: '#475569' }}>Statutory GST (18%)</td>
                <td style={{ textAlign: 'right', padding: '8px 10px', color: '#475569' }}>
                  +₹{invoiceData.gstAmount.toFixed(2)}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px 10px', color: '#475569' }}>Platform & Gateway Fee (3%)</td>
                <td style={{ textAlign: 'right', padding: '8px 10px', color: '#475569' }}>
                  +₹{invoiceData.serviceFeeAmount.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Total Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
            <div style={{ width: '220px', backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                <span>Wallet Float:</span>
                <span>₹{invoiceData.creditAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                <span>Taxes & Fees:</span>
                <span>₹{(invoiceData.gstAmount + invoiceData.serviceFeeAmount).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800, color: '#3b82f6', borderTop: '1px dashed #cbd5e1', paddingTop: '6px', marginTop: '4px' }}>
                <span>Total Paid:</span>
                <span>₹{invoiceData.totalPaid.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '10px' }}>
            Thank you for choosing turfsy. This is an electronically generated receipt.
          </div>
        </div>
      </div>
    </div>
  );
};
