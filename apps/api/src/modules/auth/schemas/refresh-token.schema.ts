import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ timestamps: true })
export class RefreshToken {
  // Value import of Types: decorator metadata needs the runtime class
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  /** Every rotation of one sign-in shares a family; reuse of a rotated token revokes all of it. */
  @Prop({ type: String, required: true, index: true })
  familyId!: string;

  /** SHA-256 of the opaque token; the token itself lives only in the visitor's cookie. */
  @Prop({ type: String, required: true, unique: true })
  tokenHash!: string;

  @Prop({ type: Date, required: true })
  expiresAt!: Date;

  @Prop({ type: Date, default: null })
  revokedAt!: Date | null;

  @Prop({ type: Boolean, default: false })
  familyRevoked!: boolean;
}

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;
export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
