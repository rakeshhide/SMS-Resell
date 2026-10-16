import axios from 'axios';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export class EmailService {
  private static adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'kumarsinghrakesh333@gmail.com';
  private static fromAddress = 'TurfsyOTPs <onboarding@resend.dev>';

  /**
   * Resolve Resend API keys in priority failover order:
   * 1. Primary key
   * 2. Fallback key 1
   * 3. Fallback key 2
   */
  private static getApiKeys(): string[] {
    const rawKeys: string[] = [];

    // Support comma-separated list of keys
    if (process.env.RESEND_API_KEYS) {
      rawKeys.push(...process.env.RESEND_API_KEYS.split(',').map((k) => k.trim()));
    }

    if (process.env.RESEND_API_KEY) {
      rawKeys.push(process.env.RESEND_API_KEY.trim());
    }
    if (process.env.RESEND_API_KEY_FALLBACK_1) {
      rawKeys.push(process.env.RESEND_API_KEY_FALLBACK_1.trim());
    }
    if (process.env.RESEND_API_KEY_FALLBACK_2) {
      rawKeys.push(process.env.RESEND_API_KEY_FALLBACK_2.trim());
    }

    // Deduplicate and filter out empty entries
    return Array.from(new Set(rawKeys.filter(Boolean)));
  }

  /**
   * Core send method via Resend REST API with automatic multi-key failover:
   * If rate limit (HTTP 429), quota exhaustion, or any error occurs, it automatically retries with the next key.
   */
  public static async sendEmail(options: EmailOptions): Promise<boolean> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    // Filter out duplicate or empty addresses
    const uniqueRecipients = Array.from(new Set(recipients.filter(Boolean)));

    if (uniqueRecipients.length === 0) {
      console.warn('[EMAIL_SERVICE] No recipients specified. Aborting email send.');
      return false;
    }

    const keys = this.getApiKeys();
    if (keys.length === 0) {
      console.error('[EMAIL_SERVICE] No Resend API keys configured.');
      return false;
    }

    let lastError: any = null;

    for (let i = 0; i < keys.length; i++) {
      const currentKey = keys[i];
      const maskedKey = currentKey.length > 8 ? `${currentKey.substring(0, 7)}...${currentKey.slice(-4)}` : '***';

      try {
        const response = await axios.post(
          'https://api.resend.com/emails',
          {
            from: this.fromAddress,
            to: uniqueRecipients,
            subject: options.subject,
            html: options.html,
            ...(options.replyTo ? { reply_to: options.replyTo } : {}),
          },
          {
            headers: {
              Authorization: `Bearer ${currentKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );

        console.log(
          `[EMAIL_SERVICE] Email dispatched successfully with key [${i + 1}/${keys.length} - ${maskedKey}] to [${uniqueRecipients.join(', ')}]. Resend ID:`,
          response.data?.id
        );
        return true;
      } catch (err: any) {
        lastError = err;
        const statusCode = err.response?.status;
        const errData = err.response?.data || err.message;

        console.warn(
          `[EMAIL_SERVICE] Resend API key [${i + 1}/${keys.length} - ${maskedKey}] failed (Status: ${statusCode || 'Network Error'}):`,
          errData
        );

        if (i < keys.length - 1) {
          console.log(`[EMAIL_SERVICE] Limit or error reached. Automatically failing over to backup Resend API key [${i + 2}/${keys.length}]...`);
        }
      }
    }

    console.error(`[EMAIL_SERVICE] All ${keys.length} Resend API key(s) exhausted. Failed to send email:`, lastError?.response?.data || lastError?.message);
    return false;
  }

  /**
   * 1. Send Wallet Top-Up Notification
   * Dispatched to both: Admin (kumarsinghrakesh333@gmail.com) and User
   */
  public static async sendWalletTopupEmail(params: {
    userEmail: string;
    userName: string;
    creditAmount: number;
    totalPaid: number;
    gstAmount: number;
    serviceFee: number;
    paymentId: string;
    newBalance: number;
    unlockedRate: number;
    source: 'RAZORPAY' | 'ADMIN_MANUAL';
  }): Promise<void> {
    const {
      userEmail,
      userName,
      creditAmount,
      totalPaid,
      gstAmount,
      serviceFee,
      paymentId,
      newBalance,
      unlockedRate,
      source
    } = params;

    const sourceLabel = source === 'RAZORPAY' ? 'Razorpay Online Gateway' : 'Admin Manual Top-up';

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 24px 32px; text-align: left;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 700; letter-spacing: -0.02em;">TurfsyOTPs Communications</h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Transaction & Financial Ledger Notification</p>
        </div>
        
        <div style="padding: 32px;">
          <div style="display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 12px; font-weight: 700; padding: 4px 10px; borderRadius: 6px; margin-bottom: 16px;">
            WALLET RECHARGE CONFIRMED
          </div>

          <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 12px 0;">Hello ${userName || 'Valued Developer'},</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
            A wallet recharge of <strong>₹${creditAmount.toFixed(2)}</strong> has been credited to your floating balance via ${sourceLabel}.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Credited Float Amount</td>
              <td style="padding: 10px 0; font-weight: 700; color: #0f172a; text-align: right; font-family: monospace;">₹${creditAmount.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Statutory GST (18%)</td>
              <td style="padding: 10px 0; color: #0f172a; text-align: right; font-family: monospace;">₹${gstAmount.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Platform Service Fee (3%)</td>
              <td style="padding: 10px 0; color: #0f172a; text-align: right; font-family: monospace;">₹${serviceFee.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 0; font-weight: 700; color: #0f172a;">Total Amount Paid</td>
              <td style="padding: 12px 0; font-weight: 800; color: #2563eb; text-align: right; font-family: monospace; font-size: 15px;">₹${totalPaid.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">New Wallet Float</td>
              <td style="padding: 10px 0; font-weight: 700; color: #10b981; text-align: right; font-family: monospace;">₹${newBalance.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Active OTP Dispatch Rate</td>
              <td style="padding: 10px 0; font-weight: 700; color: #0f172a; text-align: right; font-family: monospace;">₹${unlockedRate.toFixed(2)} / OTP</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b;">Reference / Payment ID</td>
              <td style="padding: 10px 0; color: #475569; text-align: right; font-family: monospace; font-size: 11px;">${paymentId}</td>
            </tr>
          </table>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${process.env.FRONTEND_URL || 'https://turfsy.vercel.app'}/wallet" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
              View Financial Ledger & Invoice
            </a>
          </div>
        </div>

        <div style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          TurfsyOTPs High-Throughput Developer Infrastructure. Automated Transaction Notification.
        </div>
      </div>
    `;

    // Send to both: Admin notification email and customer's email
    await this.sendEmail({
      to: [this.adminEmail, userEmail],
      subject: `[TurfsyOTPs] Wallet Recharged: ₹${creditAmount.toFixed(2)} by ${userName || userEmail}`,
      html: htmlBody,
    });
  }

  /**
   * 2. Send Support Ticket / Complaint Notification
   * Dispatched to both: Admin (kumarsinghrakesh333@gmail.com) and User
   */
  public static async sendSupportTicketEmail(params: {
    userEmail: string;
    userName: string;
    ticketNumber: string;
    subject: string;
    category: string;
    priority: string;
    message: string;
  }): Promise<void> {
    const {
      userEmail,
      userName,
      ticketNumber,
      subject,
      category,
      priority,
      message
    } = params;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 24px 32px; text-align: left;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 700; letter-spacing: -0.02em;">TurfsyOTPs Support Center</h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Inquiry & Complaint Raised Notification</p>
        </div>
        
        <div style="padding: 32px;">
          <div style="display: inline-block; background-color: #fef3c7; color: #b45309; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; margin-bottom: 16px;">
            TICKET: ${ticketNumber} (${priority} PRIORITY)
          </div>

          <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 12px 0;">New Support Request Received</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
            A new inquiry/complaint has been raised by <strong>${userName || 'Developer'}</strong> (<code>${userEmail}</code>).
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Subject</div>
            <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 14px;">${subject}</div>

            <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Category & Priority</div>
            <div style="font-size: 13px; color: #334155; margin-bottom: 14px;">Category: <strong>${category}</strong> | Priority: <strong>${priority}</strong></div>

            <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Message Content</div>
            <div style="font-size: 13px; color: #1e293b; line-height: 1.6; white-space: pre-wrap; background-color: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">${message}</div>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${process.env.FRONTEND_URL || 'https://turfsy.vercel.app'}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Open Support Dashboard
            </a>
          </div>
        </div>

        <div style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          TurfsyOTPs Support Operations. Our engineering team reviews inquiries continuously.
        </div>
      </div>
    `;

    // Send to both: Admin email and user email
    await this.sendEmail({
      to: [this.adminEmail, userEmail],
      subject: `[TurfsyOTPs Ticket ${ticketNumber}] ${subject} - from ${userName || userEmail}`,
      html: htmlBody,
      replyTo: userEmail,
    });
  }

  /**
   * 3. Send Password Reset Email with Secure Token Link
   */
  public static async sendPasswordResetEmail(params: {
    userEmail: string;
    userName: string;
    resetToken: string;
  }): Promise<void> {
    const { userEmail, userName, resetToken } = params;
    const frontendBase = process.env.FRONTEND_URL || 'https://turfsy.vercel.app';
    const resetUrl = `${frontendBase}/reset-password?token=${encodeURIComponent(resetToken)}`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 24px 32px; text-align: left;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 700; letter-spacing: -0.02em;">TurfsyOTPs Security</h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Account Credential Recovery</p>
        </div>
        
        <div style="padding: 32px;">
          <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 12px 0;">Password Reset Request</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
            Hello ${userName || 'Valued User'},<br />
            We received a request to reset the password for your TurfsyOTPs developer account associated with <strong>${userEmail}</strong>.
          </p>

          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
            Click the secure button below to choose a new password. This link is valid for <strong>15 minutes</strong> and will expire immediately once used.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
              Reset Account Password
            </a>
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 24px 0 0 0;">
            If the button doesn't work, copy and paste this link into your browser:<br />
            <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
          </p>

          <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 20px 0 0 0; padding-top: 16px; border-top: 1px solid #f1f5f9;">
            If you did not request this password reset, please ignore this email or contact support if you suspect unauthorized activity.
          </p>
        </div>

        <div style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          TurfsyOTPs Automated Security Infrastructure.
        </div>
      </div>
    `;

    await this.sendEmail({
      to: userEmail,
      subject: '[TurfsyOTPs] Reset Your Account Password',
      html: htmlBody,
    });
  }
}
