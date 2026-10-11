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
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top Accent Bar
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Header Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59);
  doc.text('turfsy', margin, 24);

  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.text('OTPs', margin + 27, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Enterprise SMS & OTP Routing Infrastructure', margin, 30);

  // Right Side: Title & Status
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235);
  doc.text('PAYMENT RECEIPT', pageWidth - margin, 22, { align: 'right' });

  // Paid Tag
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(pageWidth - margin - 22, 26, 22, 6, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(5, 150, 105);
  doc.text('PAID', pageWidth - margin - 11, 30.2, { align: 'center' });

  // Top Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, 38, pageWidth - margin, 38);

  // Metadata Section (Clean 2-Column Grid)
  let y = 48;

  // Left Column: Customer Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED TO', margin, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(data.customerName || 'Registered Account', margin, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  if (data.customerEmail) {
    doc.text(data.customerEmail, margin, y + 11.5);
  }

  // Right Column: Receipt Details
  const rightX = margin + 95;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('RECEIPT DETAILS', rightX, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Receipt No:', rightX, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.invoiceNumber, rightX + 24, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Date:', rightX, y + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(data.date, rightX + 24, y + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Payment Ref:', rightX, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(data.paymentId || data.orderId || 'Wallet Top-Up', rightX + 24, y + 17);

  // Items Table Header
  y = 78;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y + 8, pageWidth - margin, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('DESCRIPTION', margin + 5, y + 5.5);
  doc.text('AMOUNT (INR)', pageWidth - margin - 5, y + 5.5, { align: 'right' });

  // Line Item 1: Wallet Balance
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Wallet Top-Up Balance (SMS & OTP Float)', margin + 5, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('100% credited directly to your messaging balance', margin + 5, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${data.creditAmount.toFixed(2)}`, pageWidth - margin - 5, y + 1, { align: 'right' });

  // Divider
  y += 10;
  doc.setDrawColor(241, 245, 249);
  doc.line(margin, y, pageWidth - margin, y);

  // Line Item 2: GST
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('GST (18% Statutory)', margin + 5, y);
  doc.text(`INR ${data.gstAmount.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });

  // Line Item 3: Service Fee
  y += 7;
  doc.text('Payment Gateway & Platform Fee (3%)', margin + 5, y);
  doc.text(`INR ${data.serviceFeeAmount.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });

  // Divider before Total
  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);

  // Total Box
  y += 8;
  const boxWidth = 90;
  const boxX = pageWidth - margin - boxWidth;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(boxX, y, boxWidth, 32, 2, 2, 'FD');

  let boxY = y + 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Wallet Credit:', boxX + 6, boxY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${data.creditAmount.toFixed(2)}`, boxX + boxWidth - 6, boxY, { align: 'right' });

  boxY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Taxes & Fees (21%):', boxX + 6, boxY);
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${(data.gstAmount + data.serviceFeeAmount).toFixed(2)}`, boxX + boxWidth - 6, boxY, { align: 'right' });

  boxY += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(boxX + 6, boxY, boxX + boxWidth - 6, boxY);

  boxY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text('TOTAL PAID:', boxX + 6, boxY);
  doc.text(`INR ${data.totalPaid.toFixed(2)}`, boxX + boxWidth - 6, boxY, { align: 'right' });

  // Footer Note
  const footerY = y + 55;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Thank you for choosing turfsy.', margin, footerY + 6);
  doc.text('This is a computer-generated payment receipt and requires no physical signature.', margin, footerY + 11);

  // Bottom Center Brand Line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('turfsy  •  Secure Cloud Communications', pageWidth / 2, 280, { align: 'center' });

  doc.save(`Turfsy-Invoice-${data.invoiceNumber}.pdf`);
};
