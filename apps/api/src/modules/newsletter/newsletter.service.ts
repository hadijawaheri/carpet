import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { isDuplicateKeyError } from "../../common/database/mongo-errors.js";
import type { NewsletterSubscriptionDocument } from "./schemas/newsletter-subscription.schema.js";
import { NewsletterSubscription } from "./schemas/newsletter-subscription.schema.js";

@Injectable()
export class NewsletterService {
  constructor(
    @InjectModel(NewsletterSubscription.name)
    private readonly subscriptionModel: Model<NewsletterSubscriptionDocument>,
  ) {}

  /** Idempotent: subscribing twice is a success, and the answer never reveals who is subscribed. */
  async subscribe(email: string): Promise<void> {
    try {
      await this.subscriptionModel.updateOne(
        { email },
        { $setOnInsert: { email } },
        { upsert: true },
      );
    } catch (error: unknown) {
      // Two concurrent upserts of one address: the loser hits the unique index
      if (!isDuplicateKeyError(error)) throw error;
    }
  }
}
