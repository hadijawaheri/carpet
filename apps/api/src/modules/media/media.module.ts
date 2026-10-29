import { Module } from "@nestjs/common";

import { ImageStorage } from "./image-storage.js";
import { MediaController } from "./media.controller.js";

@Module({
  controllers: [MediaController],
  providers: [ImageStorage],
  exports: [ImageStorage],
})
export class MediaModule {}
