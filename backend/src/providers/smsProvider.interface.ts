export interface SendOTPParams {
  phone: string;
  otp: string;
  templateId?: string;
  messageText?: string;
}

export interface ProviderSendResult {
  success: boolean;
  providerRefId: string;
  statusCode: string;
  message: string;
  rawResponse?: any;
}

export interface SMSProvider {
  name: string;
  sendOTP(params: SendOTPParams): Promise<ProviderSendResult>;
}
