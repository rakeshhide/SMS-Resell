import axios from 'axios';
import { SMSProvider, SendOTPParams, ProviderSendResult } from './smsProvider.interface';

export class Fast2SMSProvider implements SMSProvider {
  public readonly name = 'primary_telecom_route';
  private endpoint: string;
  private apiKey: string;

  constructor() {
    this.endpoint = process.env.FAST2SMS_ENDPIONT || 'https://www.fast2sms.com/dev/bulkV2';
    this.apiKey = process.env.FAST2SMS_API_KEY || '';
  }

  async sendOTP(params: SendOTPParams): Promise<ProviderSendResult> {
    const { phone, otp } = params;

    // Strictly validate 10-digit mobile number (never slice or truncate unknown lengths)
    const cleanedPhone = phone.replace(/\D/g, '');

    if (!cleanedPhone || cleanedPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanedPhone)) {
      return {
        success: false,
        providerRefId: '',
        statusCode: 'INVALID_DESTINATION',
        message: 'Invalid 10-digit mobile number format. Number must be exactly 10 digits starting with 6, 7, 8, or 9.'
      };
    }

    try {
      const response = await axios.post(
        this.endpoint,
        {
          route: 'otp',
          variables_values: otp,
          numbers: cleanedPhone,
        },
        {
          headers: {
            authorization: this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 8000, // 8-second strict timeout for high-throughput
        }
      );

      const data = response.data;
      const refId = data?.request_id || `REQ_${Date.now()}`;
      const statusCodeNum = data?.status_code;
      const rawMsg = Array.isArray(data?.message)
        ? data.message.join('; ')
        : (typeof data?.message === 'string' ? data.message : '');
      const lowerMsg = rawMsg.toLowerCase();

      // Check success
      const isSuccess = data?.return === true || statusCodeNum === 200 || data?.message?.[0] === 'SMS sent successfully.';

      if (isSuccess) {
        return {
          success: true,
          providerRefId: refId,
          statusCode: 'DELIVERED_TO_CARRIER',
          message: rawMsg || 'SMS sent successfully.',
          rawResponse: {
            return: data?.return,
            request_id: data?.request_id
          }
        };
      }

      // Classify error responses returned with HTTP 200 but return: false
      if (statusCodeNum === 416 || lowerMsg.includes('sufficient wallet balance')) {
        return {
          success: false,
          providerRefId: refId,
          statusCode: 'PROVIDER_BALANCE_EXHAUSTED',
          message: 'Not You it us , please wait for 24 hours we will fix within it',
          rawResponse: data
        };
      }

      if (statusCodeNum === 427 || lowerMsg.includes('dnd') || lowerMsg.includes('blocked')) {
        return {
          success: false,
          providerRefId: refId,
          statusCode: 'NUMBER_BLOCKED_DND',
          message: 'Number blocked in Our System DND list / National Do-Not-Disturb registry.',
          rawResponse: data
        };
      }

      if (statusCodeNum === 411 || lowerMsg.includes('invalid number') || lowerMsg.includes('invalid numbers')) {
        return {
          success: false,
          providerRefId: refId,
          statusCode: 'INVALID_DESTINATION',
          message: 'Invalid mobile number. Carrier rejected the destination.',
          rawResponse: data
        };
      }

      return {
        success: false,
        providerRefId: refId,
        statusCode: 'PROVIDER_REJECTED',
        message: rawMsg || 'Gateway processed message reject',
        rawResponse: data
      };
    } catch (error: any) {
      const errData = error.response?.data;
      const statusCodeNum = errData?.status_code || error.response?.status;
      const rawMsg = Array.isArray(errData?.message)
        ? errData.message.join('; ')
        : (typeof errData?.message === 'string' ? errData.message : (error.message || ''));
      const lowerMsg = rawMsg.toLowerCase();

      // 1. Upstream route balance exhausted (Fast2SMS 416)
      if (statusCodeNum === 416 || lowerMsg.includes('sufficient wallet balance')) {
        console.error('[SMS_GATEWAY] Critical Alert: Upstream route replenishment required (Fast2SMS 416)');
        return {
          success: false,
          providerRefId: `ERR_${Date.now()}`,
          statusCode: 'PROVIDER_BALANCE_EXHAUSTED',
          message: 'Not You it us , please wait for 24 hours we will fix within it',
          rawResponse: errData
        };
      }

      // 2. DND or Blocked number (Fast2SMS 427)
      if (statusCodeNum === 427 || lowerMsg.includes('dnd') || lowerMsg.includes('blocked')) {
        return {
          success: false,
          providerRefId: `ERR_${Date.now()}`,
          statusCode: 'NUMBER_BLOCKED_DND',
          message: 'Number blocked in Our System DND list / National Do-Not-Disturb registry.',
          rawResponse: errData
        };
      }

      // 3. Invalid number format or unassigned route (Fast2SMS 411)
      if (statusCodeNum === 411 || lowerMsg.includes('invalid number') || lowerMsg.includes('invalid numbers')) {
        return {
          success: false,
          providerRefId: `ERR_${Date.now()}`,
          statusCode: 'INVALID_DESTINATION',
          message: 'Invalid mobile number. Carrier rejected the destination as invalid or non-existent.',
          rawResponse: errData
        };
      }

      const statusText = rawMsg || error.message || 'Upstream provider connection error';
      console.error('[SMS_GATEWAY] Delivery failure:', statusText);

      return {
        success: false,
        providerRefId: `ERR_${Date.now()}`,
        statusCode: 'GATEWAY_ERROR',
        message: typeof statusText === 'string' ? statusText : JSON.stringify(statusText),
        rawResponse: {
          error: error.message,
          code: error.code,
          details: errData
        }
      };
    }
  }
}
