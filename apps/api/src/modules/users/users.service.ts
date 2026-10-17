import type { Role, UserDto } from "@farsh/contracts";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { isValidObjectId, Model } from "mongoose";

import type { UpdateProfileDto } from "./dto/update-profile.dto.js";
import type { UserDocument } from "./schemas/user.schema.js";
import { User } from "./schemas/user.schema.js";
import { toUserDto } from "./users.mapper.js";

const NOT_FOUND = "کاربر یافت نشد";

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async getById(id: string): Promise<UserDto> {
    if (!isValidObjectId(id)) throw new NotFoundException(NOT_FOUND);
    const user = await this.userModel.findById(id).lean<User>();
    if (!user) throw new NotFoundException(NOT_FOUND);
    return toUserDto(user);
  }

  async findOrCreateByMobile(mobile: string, role: Role = "user"): Promise<UserDto> {
    const user = await this.userModel
      .findOneAndUpdate(
        { mobile },
        { $setOnInsert: { mobile, role } },
        { upsert: true, returnDocument: "after" },
      )
      .lean<User>();
    if (!user) throw new Error("Upsert returned no user");
    return toUserDto(user);
  }

  /** Used by the seed CLI; a role change reaches the JWT on the user's next sign-in or refresh. */
  async setRoleByMobile(mobile: string, role: Role): Promise<UserDto> {
    const user = await this.userModel
      .findOneAndUpdate(
        { mobile },
        { $set: { role }, $setOnInsert: { mobile } },
        { upsert: true, returnDocument: "after" },
      )
      .lean<User>();
    if (!user) throw new Error("Upsert returned no user");
    return toUserDto(user);
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<UserDto> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: dto }, { returnDocument: "after" })
      .lean<User>();
    if (!user) throw new NotFoundException(NOT_FOUND);
    return toUserDto(user);
  }

  async softDelete(id: string): Promise<void> {
    await this.userModel.updateOne({ _id: id }, { $set: { deletedAt: new Date() } });
  }
}
