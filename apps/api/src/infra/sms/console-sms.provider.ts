import { maskMobile } from "@farsh/contracts";
import { Logger } from "@nestjs/common";

import { SmsProvider } from "./sms.provider.js";

/** Development only: prints the code instead of sending it. env.ts forbids it in production. */
export class ConsoleSmsProvider extends SmsProvider {
  private readonly logger = new Logger("ConsoleSms");

  sendOtp(mobile: string, code: string): Promise<void> {
    this.logger.log(`OTP for ${maskMobile(mobile)}: ${code}`);
    return Promise.resolve();
  }
}
