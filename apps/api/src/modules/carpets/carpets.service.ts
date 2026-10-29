import type { Carpet, PaginatedResponse } from "@farsh/contracts";
import { UPLOADED_IMAGE_PATH } from "@farsh/contracts";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { QueryFilter } from "mongoose";
import { Model } from "mongoose";

import { AppException } from "../../common/app-exception.js";
import { isDuplicateKeyError } from "../../common/database/mongo-errors.js";
import { escapeRegex, toPageMeta } from "../../common/pagination.js";
import { ImageStorage } from "../media/image-storage.js";
import { toCarpetDto } from "./carpets.mapper.js";
import type { CreateCarpetDto } from "./dto/create-carpet.dto.js";
import type { ListCarpetsQueryDto } from "./dto/list-carpets-query.dto.js";
import type { UpdateCarpetDto } from "./dto/update-carpet.dto.js";
import type { CarpetDocument } from "./schemas/carpet.schema.js";
import { CarpetEntity } from "./schemas/carpet.schema.js";

const NOT_FOUND = "فرش یافت نشد";
const SLUG_TAKEN = "فرشی با این شناسه از قبل وجود دارد";
const IMAGE_MISSING = "این عکس روی سرور نیست؛ دوباره بارگذاری کنید";

@Injectable()
export class CarpetsService {
  constructor(
    @InjectModel(CarpetEntity.name) private readonly carpetModel: Model<CarpetDocument>,
    private readonly storage: ImageStorage,
  ) {}

  async list(query: ListCarpetsQueryDto): Promise<PaginatedResponse<Carpet>> {
    const filter: QueryFilter<CarpetEntity> = {};
    if (query.material) filter.material = query.material;
    if (query.search) filter.name = { $regex: escapeRegex(query.search), $options: "i" };

    const [items, total] = await Promise.all([
      this.carpetModel
        .find(filter)
        // Catalogue order is insertion order; _id breaks ties within one millisecond
        .sort({ createdAt: 1, _id: 1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean<CarpetEntity[]>(),
      this.carpetModel.countDocuments(filter),
    ]);
    return { data: items.map(toCarpetDto), meta: toPageMeta(query.page, query.limit, total) };
  }

  async getBySlug(slug: string): Promise<Carpet> {
    const carpet = await this.carpetModel.findOne({ slug }).lean<CarpetEntity>();
    if (!carpet) throw new NotFoundException(NOT_FOUND);
    return toCarpetDto(carpet);
  }

  /** Returns the subset of `slugs` that belong to live carpets. */
  async findLiveSlugs(slugs: string[]): Promise<Set<string>> {
    const found = await this.carpetModel
      .find({ slug: { $in: slugs } }, { slug: 1 })
      .lean<Pick<CarpetEntity, "slug">[]>();
    return new Set(found.map((carpet) => carpet.slug));
  }

  async create(dto: CreateCarpetDto): Promise<Carpet> {
    await this.assertImageStored(dto.image);
    try {
      const created = await this.carpetModel.create(dto);
      return toCarpetDto(created.toObject());
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) throw new AppException(409, "CONFLICT", SLUG_TAKEN);
      throw error;
    }
  }

  async update(slug: string, dto: UpdateCarpetDto): Promise<Carpet> {
    if (dto.image !== undefined) await this.assertImageStored(dto.image);
    const before = await this.carpetModel
      .findOneAndUpdate({ slug }, { $set: dto }, { returnDocument: "before", runValidators: true })
      .lean<CarpetEntity>();
    if (!before) throw new NotFoundException(NOT_FOUND);
    if (dto.image !== undefined && dto.image !== before.image) {
      await this.removeUnusedImage(before.image);
    }
    return toCarpetDto({ ...before, ...dto });
  }

  /** A carpet may only point at an uploaded photo that is really on disk, so no page shows a broken image. */
  private async assertImageStored(image: string): Promise<void> {
    if (!image.startsWith(UPLOADED_IMAGE_PATH)) return;
    const name = this.storage.nameOf(image);
    if (!name || !(await this.storage.exists(name))) {
      throw new AppException(400, "VALIDATION_FAILED", IMAGE_MISSING, [
        { path: "image", message: IMAGE_MISSING },
      ]);
    }
  }

  /**
   * Deletes a replaced upload once no carpet uses it. Soft-deleted carpets count: restoring one must
   * bring its photo back. Failing to delete only wastes disk, so it never fails the update.
   */
  private async removeUnusedImage(image: string): Promise<void> {
    const name = this.storage.nameOf(image);
    if (!name) return;
    const stillUsed = await this.carpetModel.exists({ image }).setOptions({ withDeleted: true });
    if (stillUsed) return;
    await this.storage.remove(name).catch(() => undefined);
  }

  async softDelete(slug: string): Promise<void> {
    const result = await this.carpetModel.updateOne({ slug }, { $set: { deletedAt: new Date() } });
    if (result.matchedCount === 0) throw new NotFoundException(NOT_FOUND);
  }

  /**
   * Inserts catalogue carpets whose slug has no live document. With `overwrite`, existing ones are
   * reset to the catalogue values too; by default an admin's edits survive a re-seed.
   */
  async upsertMany(carpets: Carpet[], overwrite: boolean): Promise<{ inserted: number }> {
    let inserted = 0;
    for (const original of carpets) {
      // Mongoose casts update objects in place (it adds __v); never let it touch the shared catalogue
      const carpet = structuredClone(original);
      const { slug, ...fields } = carpet;
      const update = overwrite
        ? { $set: fields, $setOnInsert: { slug } }
        : { $setOnInsert: carpet };
      const result = await this.carpetModel.updateOne({ slug }, update, { upsert: true });
      inserted += result.upsertedCount;
    }
    return { inserted };
  }
}
