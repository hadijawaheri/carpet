import type { ApiResponse, UserDto } from "@farsh/contracts";
import { Body, Controller, Delete, HttpCode, Patch, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";

import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import type { AuthUser } from "../../common/types/auth.js";
import type { Env } from "../../config/env.js";
import { clearSessionCookies } from "../auth/auth.cookies.js";
import { UpdateProfileDto } from "./dto/update-profile.dto.js";
import { UsersService } from "./users.service.js";

@Controller({ path: "users", version: "1" })
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Patch("me")
  async updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<ApiResponse<UserDto>> {
    return { data: await this.usersService.updateProfile(user.id, dto) };
  }

  @Delete("me")
  @HttpCode(204)
  async deleteMe(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    // Refresh fails for a deleted user, so clearing cookies is enough to end the session
    await this.usersService.softDelete(user.id);
    clearSessionCookies(res, this.config.get("NODE_ENV", { infer: true }) === "production");
  }
}
