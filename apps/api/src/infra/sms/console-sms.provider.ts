import { maskMobile } from "@farsh/contracts";
import { Logger } from "@nestjs/common";

import { SmsProvider, type SmsTemplate } from "./sms.provider.js";

/** Development only: prints the code instead of sending it. env.ts forbids it in production. */
export class ConsoleSmsProvider extends SmsProvider {
  private readonly logger = new Logger("ConsoleSms");

  send(to: string, template: SmsTemplate, args: string[]): Promise<void> {
    this.logger.log(`SMS ${template} for ${maskMobile(to)}: ${args.join(", ")}`);
    return Promise.resolve();
  }
}
