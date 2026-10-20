import type { ApiResponse, Carpet, PaginatedResponse } from "@farsh/contracts";
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";

import { Public } from "../../common/decorators/public.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { CarpetsService } from "./carpets.service.js";
import { CreateCarpetDto } from "./dto/create-carpet.dto.js";
import { ListCarpetsQueryDto } from "./dto/list-carpets-query.dto.js";
import { UpdateCarpetDto } from "./dto/update-carpet.dto.js";

@Controller({ path: "carpets", version: "1" })
export class CarpetsController {
  constructor(private readonly carpetsService: CarpetsService) {}

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
  @Delete(":slug")
  @HttpCode(204)
  async remove(@Param("slug") slug: string): Promise<void> {
    await this.carpetsService.softDelete(slug);
  }
}
