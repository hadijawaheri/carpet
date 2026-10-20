import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { Env } from "../../config/env.js";
import { ConsoleSmsProvider } from "./console-sms.provider.js";
import { MelipayamakSmsProvider } from "./melipayamak-sms.provider.js";
import { SmsProvider } from "./sms.provider.js";

type SmsEnv = Pick<Env, "SMS_PROVIDER" | "MELIPAYAMAK_API_KEY" | "MELIPAYAMAK_BODY_ID">;

export function createSmsProvider(env: SmsEnv): SmsProvider {
  switch (env.SMS_PROVIDER) {
    case "console":
      return new ConsoleSmsProvider();
    case "melipayamak":
      // env.ts already refuses to boot without both; this keeps the types honest
      if (!env.MELIPAYAMAK_API_KEY || !env.MELIPAYAMAK_BODY_ID) {
        throw new Error("Melipayamak needs MELIPAYAMAK_API_KEY and MELIPAYAMAK_BODY_ID");
      }
      return new MelipayamakSmsProvider({
        apiKey: env.MELIPAYAMAK_API_KEY,
        bodyId: env.MELIPAYAMAK_BODY_ID,
      });
  }
}

@Global()
@Module({
  providers: [
    {
      provide: SmsProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        createSmsProvider({
          SMS_PROVIDER: config.get("SMS_PROVIDER", { infer: true }),
          MELIPAYAMAK_API_KEY: config.get("MELIPAYAMAK_API_KEY", { infer: true }),
          MELIPAYAMAK_BODY_ID: config.get("MELIPAYAMAK_BODY_ID", { infer: true }),
        }),
    },
  ],
  exports: [SmsProvider],
})
export class SmsModule {}
