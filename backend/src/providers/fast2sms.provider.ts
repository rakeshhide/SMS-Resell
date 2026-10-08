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

    // Sanitize phone number (remove country code if +91 or 91 prefix provided)
    const cleanedPhone = phone.replace(/\D/g, '').slice(-10);

    if (!cleanedPhone || cleanedPhone.length !== 10) {
      return {
        success: false,
        providerRefId: '',
        statusCode: 'INVALID_DESTINATION',
        message: 'Invalid 10-digit mobile number format'
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
      const isLowBalance = data?.status_code === 416 || (typeof data?.message === 'string' && data.message.includes("sufficient wallet balance")) || (Array.isArray(data?.message) && data.message.some((m: string) => m.includes("sufficient wallet balance")));
      const isSuccess = data?.return === true || data?.status_code === 200 || data?.message?.[0] === 'SMS sent successfully.';
      const refId = data?.request_id || `REQ_${Date.now()}`;

      if (isLowBalance) {
        return {
          success: false,
          providerRefId: refId,
          statusCode: 'PROVIDER_BALANCE_EXHAUSTED',
          message: 'Not You it us , please wait for 24 hours we will fix within it',
          rawResponse: data
        };
      }

      return {
        success: isSuccess,
        providerRefId: refId,
        statusCode: isSuccess ? 'DELIVERED_TO_CARRIER' : 'PROVIDER_REJECTED',
        message: Array.isArray(data?.message) ? data.message.join('; ') : (data?.message || 'Gateway processed message'),
        rawResponse: {
          return: data?.return,
          request_id: data?.request_id
        }
      };
    } catch (error: any) {
      const errData = error.response?.data;
      const isLowBalance = errData?.status_code === 416 || 
        (typeof errData?.message === 'string' && errData.message.includes("sufficient wallet balance")) ||
        (Array.isArray(errData?.message) && errData.message.some((m: string) => m.includes("sufficient wallet balance")));

      if (isLowBalance) {
        console.error('[SMS_GATEWAY] Critical Alert: Upstream route replenishment required (Fast2SMS 416)');
        return {
          success: false,
          providerRefId: `ERR_${Date.now()}`,
          statusCode: 'PROVIDER_BALANCE_EXHAUSTED',
          message: 'Not You it us , please wait for 24 hours we will fix within it',
          rawResponse: errData
        };
      }

      const statusText = error.response?.data?.message || error.message || 'Upstream provider connection error';
      console.error('[SMS_GATEWAY] Delivery failure:', statusText);

      return {
        success: false,
        providerRefId: `ERR_${Date.now()}`,
        statusCode: 'GATEWAY_ERROR',
        message: typeof statusText === 'string' ? statusText : JSON.stringify(statusText),
        rawResponse: {
          error: error.message,
          code: error.code
        }
      };
    }
  }
}
