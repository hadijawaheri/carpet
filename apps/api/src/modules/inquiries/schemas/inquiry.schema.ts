import type { InquiryStatus } from "@farsh/contracts";
import { INQUIRY_STATUSES } from "@farsh/contracts";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument, Types } from "mongoose";

@Schema({ timestamps: true })
export class Inquiry {
  _id!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: true })
  mobile!: string;

  @Prop({ type: [String], required: true })
  carpetSlugs!: string[];

  @Prop({ type: String, default: null })
  message!: string | null;

  @Prop({ type: String, enum: INQUIRY_STATUSES, default: "new" })
  status!: InquiryStatus;

  createdAt!: Date;
  updatedAt!: Date;
}

export type InquiryDocument = HydratedDocument<Inquiry>;
export const InquirySchema = SchemaFactory.createForClass(Inquiry);
InquirySchema.index({ status: 1, createdAt: -1 });
InquirySchema.index({ createdAt: -1 });
