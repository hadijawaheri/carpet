import type { InquiryDto, PaginatedResponse } from "@farsh/contracts";
import { maskMobile } from "@farsh/contracts";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { QueryFilter } from "mongoose";
import { isValidObjectId, Model } from "mongoose";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";

import { AppException } from "../../common/app-exception.js";
import { escapeRegex, toPageMeta } from "../../common/pagination.js";
import { CarpetsService } from "../carpets/carpets.service.js";
import type { CreateInquiryDto } from "./dto/create-inquiry.dto.js";
import type { ListInquiriesQueryDto } from "./dto/list-inquiries-query.dto.js";
import { toInquiryDto } from "./inquiries.mapper.js";
import type { InquiryDocument } from "./schemas/inquiry.schema.js";
import { Inquiry } from "./schemas/inquiry.schema.js";

const NOT_FOUND = "درخواست یافت نشد";

@Injectable()
export class InquiriesService {
  constructor(
    @InjectModel(Inquiry.name) private readonly inquiryModel: Model<InquiryDocument>,
    private readonly carpetsService: CarpetsService,
    @InjectPinoLogger(InquiriesService.name) private readonly logger: PinoLogger,
  ) {}

  async create(dto: CreateInquiryDto): Promise<InquiryDto> {
    const live = await this.carpetsService.findLiveSlugs(dto.carpetSlugs);
    const unknown = dto.carpetSlugs.filter((slug) => !live.has(slug));
    if (unknown.length > 0) {
      throw new AppException(
        400,
        "VALIDATION_FAILED",
        "یکی از فرش‌های انتخاب‌شده دیگر در فهرست نیست",
        unknown.map((slug) => ({ path: "carpetSlugs", message: `فرش «${slug}» یافت نشد` })),
      );
    }

    const created = await this.inquiryModel.create({
      name: dto.name,
      mobile: dto.mobile,
      carpetSlugs: dto.carpetSlugs,
      message: dto.message ?? null,
      status: "new",
    });
    this.logger.info(
      { inquiryId: created.id, mobile: maskMobile(dto.mobile), carpets: dto.carpetSlugs.length },
      "Inquiry received",
    );
    // The visitor sees their own number back
    return toInquiryDto(created.toObject(), { fullMobile: true });
  }

  async list(query: ListInquiriesQueryDto): Promise<PaginatedResponse<InquiryDto>> {
    const filter: QueryFilter<Inquiry> = {};
    if (query.status) filter.status = query.status;
    if (query.search) filter.name = { $regex: escapeRegex(query.search), $options: "i" };

    const [items, total] = await Promise.all([
      this.inquiryModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean<Inquiry[]>(),
      this.inquiryModel.countDocuments(filter),
    ]);
    return {
      data: items.map((item) => toInquiryDto(item, { fullMobile: false })),
      meta: toPageMeta(query.page, query.limit, total),
    };
  }

  async getById(id: string): Promise<InquiryDto> {
    if (!isValidObjectId(id)) throw new NotFoundException(NOT_FOUND);
    const inquiry = await this.inquiryModel.findById(id).lean<Inquiry>();
    if (!inquiry) throw new NotFoundException(NOT_FOUND);
    return toInquiryDto(inquiry, { fullMobile: true });
  }

  async updateStatus(id: string, status: Inquiry["status"]): Promise<InquiryDto> {
    if (!isValidObjectId(id)) throw new NotFoundException(NOT_FOUND);
    const inquiry = await this.inquiryModel
      .findByIdAndUpdate(id, { $set: { status } }, { returnDocument: "after" })
      .lean<Inquiry>();
    if (!inquiry) throw new NotFoundException(NOT_FOUND);
    return toInquiryDto(inquiry, { fullMobile: false });
  }
}
