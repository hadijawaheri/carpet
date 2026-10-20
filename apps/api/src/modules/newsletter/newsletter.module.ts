import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { NewsletterController } from "./newsletter.controller.js";
import { NewsletterService } from "./newsletter.service.js";
import {
  NewsletterSubscription,
  NewsletterSubscriptionSchema,
} from "./schemas/newsletter-subscription.schema.js";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NewsletterSubscription.name, schema: NewsletterSubscriptionSchema },
    ]),
  ],
  controllers: [NewsletterController],
  providers: [NewsletterService],
})
export class NewsletterModule {}
