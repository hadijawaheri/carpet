import type { ApiResponse, InquiryDto, PaginatedResponse } from "@farsh/contracts";
import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { Public } from "../../common/decorators/public.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { CreateInquiryDto } from "./dto/create-inquiry.dto.js";
import { ListInquiriesQueryDto } from "./dto/list-inquiries-query.dto.js";
import { UpdateInquiryStatusDto } from "./dto/update-inquiry-status.dto.js";
import { InquiriesService } from "./inquiries.service.js";

@Controller({ path: "inquiries", version: "1" })
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateInquiryDto): Promise<ApiResponse<InquiryDto>> {
    return { data: await this.inquiriesService.create(dto) };
  }

  @Roles("admin")
  @Get()
  list(@Query() query: ListInquiriesQueryDto): Promise<PaginatedResponse<InquiryDto>> {
    return this.inquiriesService.list(query);
  }

  @Roles("admin")
  @Get(":id")
  async get(@Param("id") id: string): Promise<ApiResponse<InquiryDto>> {
    return { data: await this.inquiriesService.getById(id) };
  }

  @Roles("admin")
  @Patch(":id/status")
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateInquiryStatusDto,
  ): Promise<ApiResponse<InquiryDto>> {
    return { data: await this.inquiriesService.updateStatus(id, dto.status) };
  }
}
