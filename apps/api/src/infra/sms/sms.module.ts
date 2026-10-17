import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { Env } from "../../config/env.js";
import { ConsoleSmsProvider } from "./console-sms.provider.js";
import { SmsProvider } from "./sms.provider.js";

export function createSmsProvider(name: Env["SMS_PROVIDER"]): SmsProvider {
  switch (name) {
    case "console":
      return new ConsoleSmsProvider();
    default:
      // Fails at boot: silently falling back to the console provider once hid a broken production setup
      throw new Error(`SMS provider "${name}" is not implemented yet`);
  }
}

@Global()
@Module({
  providers: [
    {
      provide: SmsProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        createSmsProvider(config.get("SMS_PROVIDER", { infer: true })),
    },
  ],
  exports: [SmsProvider],
})
export class SmsModule {}
