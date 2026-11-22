import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import https from 'https';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export class EmailService {
  private static adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'kumarsinghrakesh333@gmail.com';
  private static fromAddress = process.env.SMTP_FROM || 'TurfsyOTPs <info@turfsyotps.dev>';
  private static zohoTransporter: Transporter | null = null;

  private static getZohoTransporter(): Transporter {
    if (this.zohoTransporter) return this.zohoTransporter;

    this.zohoTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.zoho.in',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      socketTimeout: 12000,
      greetingTimeout: 12000,
      connectionTimeout: 12000,
    });

    return this.zohoTransporter;
  }

  private static async sendViaZoho(
    uniqueRecipients: string[],
    options: EmailOptions
  ): Promise<boolean> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return false;

    try {
      const transport = this.getZohoTransporter();
      const info = await transport.sendMail({
        from: this.fromAddress,
        to: uniqueRecipients.join(', '),
        subject: options.subject,
        html: options.html,
        ...(options.replyTo ? { replyTo: options.replyTo } : {}),
      });
      console.log(
        `[EMAIL_SERVICE] Dispatched via Zoho SMTP to [${uniqueRecipients.join(', ')}]. MessageID: ${info.messageId}`
      );
      return true;
    } catch (err: any) {
      console.error('[EMAIL_SERVICE] Zoho SMTP failed:', err.message || err);
      this.zohoTransporter = null;
      return false;
    }
  }

  private static async sendViaBrevo(
    uniqueRecipients: string[],
    options: EmailOptions
  ): Promise<boolean> {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return false;

    const toList = uniqueRecipients.map((email) => ({ email }));

    const payload = JSON.stringify({
      sender: { name: 'TurfsyOTPs', email: 'info@turfsyotps.dev' },
      to: toList,
      subject: options.subject,
      htmlContent: options.html,
      ...(options.replyTo ? { replyTo: { email: options.replyTo } } : {}),
    });

    return new Promise((resolve) => {
      const req = https.request(
        {
          hostname: 'api.brevo.com',
          path: '/v3/smtp/email',
          method: 'POST',
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              const parsed = JSON.parse(body || '{}');
              console.log(
                `[EMAIL_SERVICE] Dispatched via Brevo REST to [${uniqueRecipients.join(', ')}]. MessageID: ${parsed.messageId || 'N/A'}`
              );
              resolve(true);
            } else {
              console.error(`[EMAIL_SERVICE] Brevo REST failed (${res.statusCode}):`, body);
              resolve(false);
            }
          });
        }
      );
      req.on('error', (err) => {
        console.error('[EMAIL_SERVICE] Brevo REST request error:', err.message);
        resolve(false);
      });
      req.setTimeout(12000, () => {
        console.error('[EMAIL_SERVICE] Brevo REST request timed out.');
        req.destroy();
        resolve(false);
      });
      req.write(payload);
      req.end();
    });
  }

  public static async sendEmail(options: EmailOptions): Promise<boolean> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const uniqueRecipients = Array.from(new Set(recipients.filter(Boolean)));

    if (uniqueRecipients.length === 0) {
      console.warn('[EMAIL_SERVICE] No recipients specified. Aborting email send.');
      return false;
    }

    const zohoOk = await this.sendViaZoho(uniqueRecipients, options);
    if (zohoOk) return true;

    console.log('[EMAIL_SERVICE] Failing over to Brevo REST API...');
    const brevoOk = await this.sendViaBrevo(uniqueRecipients, options);
    if (brevoOk) return true;

    console.error('[EMAIL_SERVICE] All providers exhausted. Email not delivered.');
    return false;
  }

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
      source,
    } = params;

    const sourceLabel = source === 'RAZORPAY' ? 'Razorpay Online Gateway' : 'Admin Manual Top-up';

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 24px 32px; text-align: left;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 700; letter-spacing: -0.02em;">TurfsyOTPs Communications</h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Transaction &amp; Financial Ledger Notification</p>
        </div>
        
        <div style="padding: 32px;">
          <div style="display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; margin-bottom: 16px;">
            WALLET RECHARGE CONFIRMED
          </div>

          <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 12px 0;">Hello ${userName || 'Valued Developer'},</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
            A wallet recharge of <strong>&#8377;${creditAmount.toFixed(2)}</strong> has been credited to your floating balance via ${sourceLabel}.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Credited Float Amount</td>
              <td style="padding: 10px 0; font-weight: 700; color: #0f172a; text-align: right; font-family: monospace;">&#8377;${creditAmount.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Statutory GST (18%)</td>
              <td style="padding: 10px 0; color: #0f172a; text-align: right; font-family: monospace;">&#8377;${gstAmount.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Platform Service Fee (3%)</td>
              <td style="padding: 10px 0; color: #0f172a; text-align: right; font-family: monospace;">&#8377;${serviceFee.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 0; font-weight: 700; color: #0f172a;">Total Amount Paid</td>
              <td style="padding: 12px 0; font-weight: 800; color: #2563eb; text-align: right; font-family: monospace; font-size: 15px;">&#8377;${totalPaid.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">New Wallet Float</td>
              <td style="padding: 10px 0; font-weight: 700; color: #10b981; text-align: right; font-family: monospace;">&#8377;${newBalance.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Active OTP Dispatch Rate</td>
              <td style="padding: 10px 0; font-weight: 700; color: #0f172a; text-align: right; font-family: monospace;">&#8377;${unlockedRate.toFixed(2)} / OTP</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b;">Reference / Payment ID</td>
              <td style="padding: 10px 0; color: #475569; text-align: right; font-family: monospace; font-size: 11px;">${paymentId}</td>
            </tr>
          </table>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${process.env.FRONTEND_URL || 'https://turfsy.vercel.app'}/wallet" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
              View Financial Ledger &amp; Invoice
            </a>
          </div>
        </div>

        <div style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          TurfsyOTPs High-Throughput Developer Infrastructure. Automated Transaction Notification.
        </div>
      </div>
    `;

    await this.sendEmail({
      to: [this.adminEmail, userEmail],
      subject: `[TurfsyOTPs] Wallet Recharged: &#8377;${creditAmount.toFixed(2)} by ${userName || userEmail}`,
      html: htmlBody,
    });
  }

  public static async sendSupportTicketEmail(params: {
    userEmail: string;
    userName: string;
    ticketNumber: string;
    subject: string;
    category: string;
    priority: string;
    message: string;
  }): Promise<void> {
    const { userEmail, userName, ticketNumber, subject, category, priority, message } = params;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 24px 32px; text-align: left;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 700; letter-spacing: -0.02em;">TurfsyOTPs Support Center</h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Inquiry &amp; Complaint Raised Notification</p>
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

            <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Category &amp; Priority</div>
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

    await this.sendEmail({
      to: [this.adminEmail, userEmail],
      subject: `[TurfsyOTPs Ticket ${ticketNumber}] ${subject} - from ${userName || userEmail}`,
      html: htmlBody,
      replyTo: userEmail,
    });
  }

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
            If the button does not work, copy and paste this link into your browser:<br />
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

  public static async sendAccountSuspendedEmail(params: {
    userEmail: string;
    userName: string;
    reason: string;
    triggeredByLogin?: boolean;
  }): Promise<void> {
    const { userEmail, userName, reason, triggeredByLogin = false } = params;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #7f1d1d; padding: 24px 32px; text-align: left;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 700; letter-spacing: -0.02em;">TurfsyOTPs Security & Compliance</h1>
          <p style="color: #fca5a5; font-size: 13px; margin: 4px 0 0 0;">Notice of Account Suspension</p>
        </div>
        
        <div style="padding: 32px;">
          <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 12px 0;">Developer Account Suspended</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
            Hello ${userName || 'Developer'},<br />
            This is an official notification that your TurfsyOTPs developer account associated with <strong>${userEmail}</strong> has been suspended.
            ${triggeredByLogin ? '<br /><span style="color: #b91c1c; font-size: 13px; font-weight: 600;">A credential verification was performed on this suspended account.</span>' : ''}
          </p>

          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 18px 20px; margin: 24px 0;">
            <div style="font-size: 12px; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
              Reason for Suspension
            </div>
            <div style="font-size: 14px; color: #7f1d1d; font-weight: 600; line-height: 1.5;">
              ${reason || 'Violation of Platform Terms of Service / Administrative compliance review'}
            </div>
          </div>

          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 16px 0;">
            <strong>What this means for your account:</strong>
          </p>
          <ul style="font-size: 13px; color: #475569; line-height: 1.6; margin: 0 0 24px 20px; padding: 0;">
            <li>Console and developer dashboard access is locked.</li>
            <li>Outbound OTP dispatch authorizations are temporarily restricted.</li>
            <li>Your account float balance and transaction records remain safe and preserved in our ledger.</li>
          </ul>

          <p style="font-size: 13px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
            If you have questions or wish to submit an appeal with supporting documentation, please reply directly to this email or contact support at <a href="mailto:info@turfsyotps.dev" style="color: #2563eb; text-decoration: none; font-weight: 600;">info@turfsyotps.dev</a>.
          </p>
        </div>

        <div style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          TurfsyOTPs Automated Security & Compliance Infrastructure.
        </div>
      </div>
    `;

    await this.sendEmail({
      to: userEmail,
      subject: '[TurfsyOTPs Notice] Account Suspension Notification',
      html: htmlBody,
    });
  }

  private static lastFast2smsAlertTime = 0;

  public static async sendFast2smsBalanceAlert(params: {
    requiredBalance: number;
    liveBalance: number | null;
    deficit: number;
    totalAccountOtps: number;
    reason: 'FLOAT_DEFICIT' | 'DISPATCH_REJECTED';
    force?: boolean;
  }): Promise<void> {
    const { requiredBalance, liveBalance, deficit, totalAccountOtps, reason, force = false } = params;

    const now = Date.now();
    if (!force && now - this.lastFast2smsAlertTime < 15 * 60 * 1000) {
      console.log('[EMAIL_SERVICE] Fast2SMS balance alert throttled (last alert sent within 15 mins).');
      return;
    }
    this.lastFast2smsAlertTime = now;

    const liveFormatted = liveBalance !== null ? `&#8377;${liveBalance.toFixed(2)}` : 'Unknown / Query Failed';
    const requiredFormatted = `&#8377;${requiredBalance.toFixed(2)}`;
    const deficitFormatted = `&#8377;${deficit.toFixed(2)}`;

    const isDispatchError = reason === 'DISPATCH_REJECTED';

    const subject = isDispatchError
      ? '[URGENT TurfsyOTPs] SMS Gateway Balance Depleted - OTP Dispatch Failing'
      : '[URGENT TurfsyOTPs] Float Deficit - Insufficient Balance for User Accounts';

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #fee2e2; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.08);">
        <div style="background-color: #991b1b; padding: 24px 32px; text-align: left;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 700; letter-spacing: -0.02em;">TurfsyOTPs Infrastructure Alert</h1>
          <p style="color: #fca5a5; font-size: 13px; margin: 4px 0 0 0;">Critical Gateway Float &amp; Upstream Balance Notification</p>
        </div>
        
        <div style="padding: 32px;">
          <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <strong style="color: #991b1b; font-size: 14px; display: block; margin-bottom: 6px;">
              ${isDispatchError ? 'Live Gateway Rejection (Error 416)' : 'Insufficient Floating Balance Warning'}
            </strong>
            <p style="color: #7f1d1d; font-size: 13px; margin: 0; line-height: 1.5;">
              ${
                isDispatchError
                  ? 'The SMS gateway returned an insufficient wallet balance error (416) during an active OTP transmission. Outgoing OTPs are failing.'
                  : 'SMS gateway live wallet balance is lower than the total float required to serve every active user based on their wallet balances. Immediate recharge is necessary to prevent delivery disruption.'
              }
            </p>
          </div>

          <h2 style="font-size: 16px; color: #0f172a; margin: 0 0 16px 0;">Float &amp; Balance Breakdown</h2>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; font-size: 13px; color: #64748b;">Live Gateway Balance</td>
                <td style="padding: 10px 0; font-size: 14px; font-weight: 700; color: #dc2626; text-align: right;">${liveFormatted}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; font-size: 13px; color: #64748b;">Outstanding User Capacity</td>
                <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #0f172a; text-align: right;">${totalAccountOtps.toLocaleString()} OTPs</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; font-size: 13px; color: #64748b;">Required Gateway Balance (@ &#8377;0.45/OTP)</td>
                <td style="padding: 10px 0; font-size: 14px; font-weight: 700; color: #0f172a; text-align: right;">${requiredFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0 0 0; font-size: 13px; font-weight: 700; color: #991b1b;">Current Float Deficit</td>
                <td style="padding: 12px 0 0 0; font-size: 16px; font-weight: 800; color: #991b1b; text-align: right;">${deficitFormatted}</td>
              </tr>
            </tbody>
          </table>

          <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 20px 0 0 0; text-align: center;">
            This automated alert was dispatched to system administrator (${this.adminEmail}).
          </p>
        </div>

        <div style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          TurfsyOTPs Telecom Health &amp; Safety Infrastructure.
        </div>
      </div>
    `;

    await this.sendEmail({
      to: this.adminEmail,
      subject,
      html: htmlBody,
    });
  }
}
