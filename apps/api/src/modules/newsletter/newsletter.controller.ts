import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { Public } from "../../common/decorators/public.decorator.js";
import { SubscribeNewsletterDto } from "./dto/subscribe-newsletter.dto.js";
import { NewsletterService } from "./newsletter.service.js";

@Controller({ path: "newsletter", version: "1" })
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("subscriptions")
  @HttpCode(204)
  async subscribe(@Body() dto: SubscribeNewsletterDto): Promise<void> {
    await this.newsletterService.subscribe(dto.email);
  }
}
