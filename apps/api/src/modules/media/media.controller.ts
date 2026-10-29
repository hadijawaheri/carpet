import { Controller, Get, NotFoundException, Param, Res } from "@nestjs/common";
import type { Response } from "express";

import { Public } from "../../common/decorators/public.decorator.js";
import { ImageStorage } from "./image-storage.js";

const NOT_FOUND = "عکس یافت نشد";

@Controller({ path: "media", version: "1" })
export class MediaController {
  constructor(private readonly storage: ImageStorage) {}

  @Public()
  @Get("carpets/:file")
  carpetImage(@Param("file") file: string, @Res() res: Response): void {
    const filePath = this.storage.pathOf(file);
    if (!filePath) throw new NotFoundException(NOT_FOUND);
    res.sendFile(
      filePath,
      {
        // Names are content hashes, so a file at a URL never changes
        headers: { "Cache-Control": "public, max-age=31536000, immutable" },
        dotfiles: "deny",
      },
      (error?: Error) => {
        if (error && !res.headersSent) {
          res.status(404).json({ statusCode: 404, code: "NOT_FOUND", message: NOT_FOUND });
        }
      },
    );
  }
}
