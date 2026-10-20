import type { ApiResponse, UserDto } from "@farsh/contracts";
import { Body, Controller, Patch } from "@nestjs/common";

import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import type { AuthUser } from "../../common/types/auth.js";
import { UpdateProfileDto } from "./dto/update-profile.dto.js";
import { UsersService } from "./users.service.js";

// DELETE /users/me lives in auth/account.controller.ts, since it needs a fresh OTP
@Controller({ path: "users", version: "1" })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch("me")
  async updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<ApiResponse<UserDto>> {
    return { data: await this.usersService.updateProfile(user.id, dto) };
  }
}
