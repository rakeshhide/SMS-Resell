import { SMSProvider } from './smsProvider.interface';
import { Fast2SMSProvider } from './fast2sms.provider';

export class SMSProviderFactory {
  private static instance: SMSProvider;

  public static getProvider(): SMSProvider {
    if (!this.instance) {
      this.instance = new Fast2SMSProvider();
    }
    return this.instance;
  }
}
