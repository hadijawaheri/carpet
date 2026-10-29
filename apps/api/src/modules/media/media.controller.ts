import type { ApiResponse, UploadedImage } from "@farsh/contracts";
import { UPLOADED_IMAGE_PATH } from "@farsh/contracts";
import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";

import { AppException } from "../../common/app-exception.js";
import { Public } from "../../common/decorators/public.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { MAX_UPLOAD_BYTES, processCarpetImage, storedImageName } from "./carpet-image.js";
import { ImageStorage } from "./image-storage.js";

const NOT_FOUND = "عکس یافت نشد";

/** The part of multer's file object this API reads; memory storage fills `buffer`. */
interface UploadedFileBuffer {
  buffer: Buffer;
}

@Controller({ path: "media", version: "1" })
export class MediaController {
  constructor(private readonly storage: ImageStorage) {}

  /**
   * Stores a photo and returns the `image` and `imageAspect` to save on a carpet. It is not tied to
   * a carpet, so a new carpet's form can show the photo before the carpet exists.
   */
  @Roles("admin")
  @Post("carpets")
  @UseInterceptors(
    FileInterceptor("image", { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 0 } }),
  )
  async uploadCarpetImage(
    @UploadedFile() file: UploadedFileBuffer | undefined,
  ): Promise<ApiResponse<UploadedImage>> {
    if (!file) throw new AppException(400, "VALIDATION_FAILED", "عکسی انتخاب نشده است");
    const { data, aspect } = await processCarpetImage(file.buffer);
    const name = storedImageName(data);
    await this.storage.save(name, data);
    return { data: { image: `${UPLOADED_IMAGE_PATH}${name}`, imageAspect: aspect } };
  }

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
