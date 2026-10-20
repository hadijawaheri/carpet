import { Body, Controller, Delete, HttpCode, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";

import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import type { AuthUser } from "../../common/types/auth.js";
import type { Env } from "../../config/env.js";
import { clearSessionCookies } from "./auth.cookies.js";
import { AuthService } from "./auth.service.js";
import { DeleteAccountDto } from "./dto/delete-account.dto.js";

@Controller({ path: "users", version: "1" })
export class AccountController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** The visitor first asks for a code with POST /auth/otp/request on their own mobile. */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Delete("me")
  @HttpCode(204)
  async deleteMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.deleteAccount(user.id, dto.code);
    clearSessionCookies(res, this.config.get("NODE_ENV", { infer: true }) === "production");
  }
}
