import type { ApiResponse, Carpet, PaginatedResponse } from "@farsh/contracts";
import { UPLOADED_IMAGE_PATH } from "@farsh/contracts";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { PinoLogger } from "nestjs-pino";

import { AppException } from "../../common/app-exception.js";
import { Public } from "../../common/decorators/public.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { MAX_UPLOAD_BYTES, processCarpetImage, storedImageName } from "../media/carpet-image.js";
import { ImageStorage } from "../media/image-storage.js";
import { CarpetsService } from "./carpets.service.js";
import { CreateCarpetDto } from "./dto/create-carpet.dto.js";
import { ListCarpetsQueryDto } from "./dto/list-carpets-query.dto.js";
import { UpdateCarpetDto } from "./dto/update-carpet.dto.js";

/** The part of multer's file object this API reads; memory storage fills `buffer`. */
interface UploadedImage {
  buffer: Buffer;
}

@Controller({ path: "carpets", version: "1" })
export class CarpetsController {
  constructor(
    private readonly carpetsService: CarpetsService,
    private readonly storage: ImageStorage,
    private readonly logger: PinoLogger,
  ) {}

  @Public()
  @Get()
  list(@Query() query: ListCarpetsQueryDto): Promise<PaginatedResponse<Carpet>> {
    return this.carpetsService.list(query);
  }

  @Public()
  @Get(":slug")
  async get(@Param("slug") slug: string): Promise<ApiResponse<Carpet>> {
    return { data: await this.carpetsService.getBySlug(slug) };
  }

  @Roles("admin")
  @Post()
  async create(@Body() dto: CreateCarpetDto): Promise<ApiResponse<Carpet>> {
    return { data: await this.carpetsService.create(dto) };
  }

  @Roles("admin")
  @Patch(":slug")
  async update(
    @Param("slug") slug: string,
    @Body() dto: UpdateCarpetDto,
  ): Promise<ApiResponse<Carpet>> {
    return { data: await this.carpetsService.update(slug, dto) };
  }

  @Roles("admin")
  @Post(":slug/image")
  @UseInterceptors(
    FileInterceptor("image", { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 0 } }),
  )
  async uploadImage(
    @Param("slug") slug: string,
    @UploadedFile() file: UploadedImage | undefined,
  ): Promise<ApiResponse<Carpet>> {
    if (!file) throw new AppException(400, "VALIDATION_FAILED", "عکسی انتخاب نشده است");
    // 404 before any work, so an unknown slug leaves nothing on disk
    await this.carpetsService.getBySlug(slug);
    const { data, aspect } = await processCarpetImage(file.buffer);
    const name = storedImageName(slug, data);
    await this.storage.save(name, data);
    const { carpet, previousImage } = await this.carpetsService.setImage(
      slug,
      `${UPLOADED_IMAGE_PATH}${name}`,
      aspect,
    );
    if (previousImage.startsWith(UPLOADED_IMAGE_PATH) && previousImage !== carpet.image) {
      // The old photo is only ever referenced by this carpet; failing to delete it just wastes disk
      await this.storage
        .remove(previousImage.slice(UPLOADED_IMAGE_PATH.length))
        .catch((error: unknown) => this.logger.warn({ err: error }, "Could not delete old photo"));
    }
    return { data: carpet };
  }

  @Roles("admin")
  @Delete(":slug")
  @HttpCode(204)
  async remove(@Param("slug") slug: string): Promise<void> {
    await this.carpetsService.softDelete(slug);
  }
}
