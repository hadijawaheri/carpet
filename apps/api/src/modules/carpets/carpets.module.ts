import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { MediaModule } from "../media/media.module.js";
import { CarpetsController } from "./carpets.controller.js";
import { CarpetsService } from "./carpets.service.js";
import { CarpetEntity, CarpetSchema } from "./schemas/carpet.schema.js";

@Module({
  imports: [
    MediaModule,
    MongooseModule.forFeature([{ name: CarpetEntity.name, schema: CarpetSchema }]),
  ],
  controllers: [CarpetsController],
  providers: [CarpetsService],
  exports: [CarpetsService],
})
export class CarpetsModule {}
