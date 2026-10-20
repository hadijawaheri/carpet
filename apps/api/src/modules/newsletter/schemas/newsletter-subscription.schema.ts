import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";

@Schema({ timestamps: true, collection: "newsletter_subscriptions" })
export class NewsletterSubscription {
  /** Already trimmed and lower-cased by the contracts schema. */
  @Prop({ type: String, required: true, unique: true })
  email!: string;
}

export type NewsletterSubscriptionDocument = HydratedDocument<NewsletterSubscription>;
export const NewsletterSubscriptionSchema = SchemaFactory.createForClass(NewsletterSubscription);
