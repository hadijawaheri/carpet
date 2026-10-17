import type { KnotDensity, PileMaterial } from "@farsh/contracts";
import { pileMaterialSchema } from "@farsh/contracts";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument, Types } from "mongoose";
import { Schema as MongooseSchema } from "mongoose";

import { softDeletePlugin } from "../../../common/database/soft-delete.plugin.js";

const KnotDensitySchema = new MongooseSchema(
  {
    unit: { type: String, enum: ["raj", "shaneh"], required: true },
    value: { type: Number, required: true },
    takham: { type: Number },
  },
  { _id: false },
);

// Named *Entity because the contracts package already exports the `Carpet` DTO type
@Schema({ timestamps: true, collection: "carpets" })
export class CarpetEntity {
  _id!: Types.ObjectId;

  @Prop({ type: String, required: true })
  slug!: string;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, enum: pileMaterialSchema.options, required: true })
  material!: PileMaterial;

  @Prop({ type: Number, required: true })
  widthCm!: number;

  @Prop({ type: Number, required: true })
  lengthCm!: number;

  @Prop({ type: KnotDensitySchema, default: undefined })
  density?: KnotDensity;

  @Prop({ type: String, required: true })
  image!: string;

  @Prop({ type: Number, required: true })
  imageAspect!: number;

  /** Integer rials. */
  @Prop({ type: Number, default: undefined })
  priceRial?: number;

  @Prop({ type: Boolean, default: false })
  isPlaceholder!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
  // Added by softDeletePlugin
  deletedAt!: Date | null;
}

export type CarpetDocument = HydratedDocument<CarpetEntity>;
export const CarpetSchema = SchemaFactory.createForClass(CarpetEntity);
CarpetSchema.plugin(softDeletePlugin);
// Unique only among live carpets, so a deleted slug can be reused
CarpetSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
CarpetSchema.index({ material: 1, createdAt: 1 });
