import { maskMobile } from "@farsh/contracts";
import { Logger } from "@nestjs/common";

import { AppException } from "../../common/app-exception.js";
import { SmsProvider, type SmsTemplate } from "./sms.provider.js";

const BASE_URL = "https://console.melipayamak.com/api/send/shared";
const TIMEOUT_MS = 5000;

export interface MelipayamakConfig {
  apiKey: string;
  /** Id of the approved pattern ("خدماتی") for each template; the OTP pattern's only argument is the code. */
  patterns: Record<SmsTemplate, number>;
}

/**
 * Sends through pre-approved Melipayamak patterns. Patterns skip the operator's ad filter
 * and the "لغو۱۱" footer, so the code arrives quickly even on numbers that blocked marketing SMS.
 */
export class MelipayamakSmsProvider extends SmsProvider {
  private readonly logger = new Logger("MelipayamakSms");

  constructor(
    private readonly config: MelipayamakConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    super();
  }

  async send(mobile: string, template: SmsTemplate, args: string[]): Promise<void> {
    let res: Response;
    try {
      res = await this.fetchImpl(`${BASE_URL}/${encodeURIComponent(this.config.apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bodyId: this.config.patterns[template], to: mobile, args }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (e: unknown) {
      this.logger.error(
        { err: e, template, mobile: maskMobile(mobile) },
        "Melipayamak unreachable",
      );
      throw this.unavailable();
    }

    // Melipayamak answers 200 even on failure; a failure carries a small error number as recId
    const body = (await res.json().catch(() => null)) as {
      recId?: unknown;
      status?: unknown;
    } | null;
    const recId = typeof body?.recId === "number" ? body.recId : 0;
    if (!res.ok || recId < 1000) {
      this.logger.error(
        {
          httpStatus: res.status,
          recId: body?.recId,
          status: body?.status,
          template,
          mobile: maskMobile(mobile),
        },
        "Melipayamak rejected the message",
      );
      throw this.unavailable();
    }
  }

  private unavailable(): AppException {
    return new AppException(
      503,
      "SMS_UNAVAILABLE",
      "ارسال پیامک ممکن نشد؛ چند دقیقه بعد دوباره تلاش کنید",
    );
  }
}
