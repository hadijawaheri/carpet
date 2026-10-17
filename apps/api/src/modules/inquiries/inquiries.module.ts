import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { CarpetsModule } from "../carpets/carpets.module.js";
import { InquiriesController } from "./inquiries.controller.js";
import { InquiriesService } from "./inquiries.service.js";
import { Inquiry, InquirySchema } from "./schemas/inquiry.schema.js";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Inquiry.name, schema: InquirySchema }]),
    CarpetsModule,
  ],
  controllers: [InquiriesController],
  providers: [InquiriesService],
})
export class InquiriesModule {}
