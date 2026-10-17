import axios from 'axios';
import { Pool } from 'pg';
import { EmailService } from './emailService';

export class Fast2smsBalanceChecker {
  /**
   * Checks whether Fast2SMS live balance is sufficient to honor the combined float of ALL active user accounts.
   * If insufficient, dispatches a critical alert email to kumarsinghrakesh333@gmail.com.
   */
  public static async checkFloatAndAlert(pool: Pool, forceEmail = false): Promise<{
    isSufficient: boolean;
    requiredBalance: number;
    liveBalance: number | null;
    deficit: number;
    totalAccountOtps: number;
  }> {
    try {
      // 1. Calculate total outstanding OTP capacity across all wallets (balance / otp_rate)
      const accountOtpsRes = await pool.query(`
        SELECT 
          COALESCE(SUM(w.balance / COALESCE(NULLIF(w.otp_rate, 0), 0.75)), 0) as total_otp_capacity
        FROM wallets w
        JOIN users u ON u.id = w.user_id
      `);

      const totalCapacity = parseFloat(accountOtpsRes.rows[0]?.total_otp_capacity || '0');
      const totalAccountOtps = Math.round(totalCapacity);
      // Fast2SMS cost per OTP is ₹0.45
      const requiredBalance = parseFloat((totalAccountOtps * 0.45).toFixed(2));

      // 2. Fetch live Fast2SMS balance from gateway
      let liveBalance: number | null = null;
      const apiKey = process.env.FAST2SMS_API_KEY;

      if (apiKey) {
        try {
          const f2sRes = await axios.get('https://www.fast2sms.com/dev/wallet', {
            headers: { authorization: apiKey },
            timeout: 5000,
          });

          if (f2sRes.data?.return && f2sRes.data?.wallet !== undefined) {
            liveBalance = parseFloat(f2sRes.data.wallet);
          }
        } catch (apiErr: any) {
          console.warn('[FAST2SMS_CHECKER] Failed to query Fast2SMS wallet balance:', apiErr.message);
        }
      }

      // 3. Evaluate if float is sufficient
      const isSufficient = liveBalance !== null ? liveBalance >= requiredBalance : true;
      const deficit = liveBalance !== null ? Math.max(0, parseFloat((requiredBalance - liveBalance).toFixed(2))) : 0;

      // 4. Alert if deficit detected
      if (!isSufficient && liveBalance !== null) {
        EmailService.sendFast2smsBalanceAlert({
          requiredBalance,
          liveBalance,
          deficit,
          totalAccountOtps,
          reason: 'FLOAT_DEFICIT',
          force: forceEmail,
        }).catch((emailErr) => {
          console.error('[FAST2SMS_CHECKER] Failed to dispatch balance alert email:', emailErr.message);
        });
      }

      return {
        isSufficient,
        requiredBalance,
        liveBalance,
        deficit,
        totalAccountOtps,
      };
    } catch (err: any) {
      console.error('[FAST2SMS_CHECKER] Error checking float:', err.message);
      return {
        isSufficient: true,
        requiredBalance: 0,
        liveBalance: null,
        deficit: 0,
        totalAccountOtps: 0,
      };
    }
  }
}
