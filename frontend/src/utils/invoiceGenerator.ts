import { jsPDF } from 'jspdf';

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  paymentId: string;
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  creditAmount: number;
  gstAmount: number;
  serviceFeeAmount: number;
  totalPaid: number;
  gstPercentage?: number;
  serviceFeePercentage?: number;
}

export const generateInvoicePdf = (data: InvoiceData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Background clean canvas
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top Accent Banner (Brand Blue)
  doc.setFillColor(37, 99, 235); // #2563eb
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Header Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59); // #1e293b
  doc.text('turfsy', margin, 22);

  // Accent Tag
  doc.setFontSize(13);
  doc.setTextColor(37, 99, 235);
  doc.text('OTPs', margin + 27, 22);

  // Platform Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // #64748b
  doc.text('Enterprise SMS & OTP Routing Infrastructure', margin, 27);

  // Right Side: INVOICE / RECEIPT Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(37, 99, 235);
  doc.text('TAX INVOICE', pageWidth - margin, 20, { align: 'right' });

  // Status Badge
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.roundedRect(pageWidth - margin - 28, 24, 28, 6, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('PAID & AUDITED', pageWidth - margin - 14, 28.2, { align: 'center' });

  // Divider Line
  doc.setDrawColor(226, 232, 240); // #e2e8f0
  doc.setLineWidth(0.4);
  doc.line(margin, 34, pageWidth - margin, 34);

  // Metadata Grid: Invoice Info & Customer Info
  let currentY = 42;

  // Box 1: Billed By (Turfsy)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // #475569
  doc.text('ISSUED BY', margin, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.text('Turfsy Messaging Platform', margin, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Cloud Communications Division', margin, currentY + 9.5);
  doc.text('GSTIN: 27AABCT9984F1Z2 (SAC: 998413)', margin, currentY + 14);
  doc.text('Web: turfsy.vercel.app | billing@turfsy.com', margin, currentY + 18.5);

  // Box 2: Invoice Details
  const colRightX = margin + 105;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('INVOICE DETAILS', colRightX, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Invoice No:', colRightX, currentY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.invoiceNumber, colRightX + 22, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Invoice Date:', colRightX, currentY + 9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(data.date, colRightX + 22, currentY + 9.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Payment Ref:', colRightX, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(data.paymentId || data.orderId || 'Direct Wallet Top-Up', colRightX + 22, currentY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Customer:', colRightX, currentY + 18.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.customerName || 'Registered Account'} (${data.customerEmail || 'Verified User'})`, colRightX + 22, currentY + 18.5);

  // Table of Items
  currentY = 72;

  // Table Header Background
  doc.setFillColor(241, 245, 249); // #f1f5f9
  doc.roundedRect(margin, currentY, contentWidth, 8, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('ITEM DESCRIPTION', margin + 4, currentY + 5.5);
  doc.text('SAC CODE', margin + 90, currentY + 5.5);
  doc.text('QTY', margin + 118, currentY + 5.5);
  doc.text('CREDIT FLOAT', margin + 138, currentY + 5.5);
  doc.text('AMOUNT (INR)', pageWidth - margin - 4, currentY + 5.5, { align: 'right' });

  // Row 1: Wallet Float Credit
  currentY += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Wallet Top-Up Balance (SMS / OTP Float Credit)', margin + 4, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Directly credited to customer real-time float ledger (100% value)', margin + 4, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('998413', margin + 90, currentY);
  doc.text('1', margin + 118, currentY);
  doc.text(`₹${data.creditAmount.toFixed(2)}`, margin + 138, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`₹${data.creditAmount.toFixed(2)}`, pageWidth - margin - 4, currentY, { align: 'right' });

  // Divider
  currentY += 9;
  doc.setDrawColor(241, 245, 249);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  // Statutory Taxes & Service Fee Breakdown Table
  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Statutory GST (CGST 9% + SGST 9%)', margin + 4, currentY);
  doc.text('18%', margin + 118, currentY);
  doc.text(`₹${data.gstAmount.toFixed(2)}`, pageWidth - margin - 4, currentY, { align: 'right' });

  currentY += 6;
  doc.text('Payment Gateway & Platform Processing Fee (3.0%)', margin + 4, currentY);
  doc.text('3%', margin + 118, currentY);
  doc.text(`₹${data.serviceFeeAmount.toFixed(2)}`, pageWidth - margin - 4, currentY, { align: 'right' });

  // Divider before Total
  currentY += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  // Total Summary Box
  currentY += 6;
  const summaryBoxWidth = 85;
  const summaryBoxX = pageWidth - margin - summaryBoxWidth;

  doc.setFillColor(248, 250, 252); // #f8fafc
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryBoxX, currentY, summaryBoxWidth, 38, 2, 2, 'FD');

  let sY = currentY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Wallet Balance Credit:', summaryBoxX + 6, sY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`₹${data.creditAmount.toFixed(2)}`, summaryBoxX + summaryBoxWidth - 6, sY, { align: 'right' });

  sY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('GST (18% Statutory):', summaryBoxX + 6, sY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`+₹${data.gstAmount.toFixed(2)}`, summaryBoxX + summaryBoxWidth - 6, sY, { align: 'right' });

  sY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Service Charge (3%):', summaryBoxX + 6, sY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`+₹${data.serviceFeeAmount.toFixed(2)}`, summaryBoxX + summaryBoxWidth - 6, sY, { align: 'right' });

  sY += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(summaryBoxX + 6, sY, summaryBoxX + summaryBoxWidth - 6, sY);

  sY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(37, 99, 235);
  doc.text('TOTAL PAID:', summaryBoxX + 6, sY);
  doc.text(`₹${data.totalPaid.toFixed(2)}`, summaryBoxX + summaryBoxWidth - 6, sY, { align: 'right' });

  // Security & Audit note
  const noteY = currentY + 2;
  doc.setFillColor(239, 246, 255); // #eff6ff
  doc.setDrawColor(191, 219, 254); // #bfdbfe
  doc.roundedRect(margin, noteY, 82, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(29, 78, 216);
  doc.text('TRANSACTION VERIFICATION', margin + 4, noteY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('• 100% of the float credit was added to balance.', margin + 4, noteY + 12);
  doc.text('• Cryptographically signed and ledger audited.', margin + 4, noteY + 17);
  doc.text('• Non-refundable telecommunication wallet float.', margin + 4, noteY + 22);
  doc.text(`• Reference ID: ${(data.paymentId || 'N/A').substring(0, 24)}`, margin + 4, noteY + 27);

  // Bottom Terms & Footer
  const footerY = 250;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TERMS & CONDITIONS', margin, footerY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('1. Telecommunication wallet top-ups are non-refundable and dedicated solely for OTP and transactional SMS dispatch.', margin, footerY + 10);
  doc.text('2. Rate per OTP is determined automatically based on your active volume tier brackets at time of dispatch.', margin, footerY + 14);
  doc.text('3. This is an electronically generated document authorized by the Turfsy System. No physical signature is required.', margin, footerY + 18);

  // Watermark / Brand Footer Line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(37, 99, 235);
  doc.text('turfsyOTPs Platform  •  Secure Cloud Communications', pageWidth / 2, 285, { align: 'center' });

  // Save the generated document
  doc.save(`Turfsy-Invoice-${data.invoiceNumber}.pdf`);
};
