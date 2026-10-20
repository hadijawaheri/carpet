import type { ExecutionContext } from "@nestjs/common";
import { createParamDecorator, UnauthorizedException } from "@nestjs/common";

import type { AuthedRequest, AuthUser } from "../types/auth.js";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const user = ctx.switchToHttp().getRequest<AuthedRequest>().user;
    // Only reachable on a @Public route that asks for the user by mistake
    if (!user) throw new UnauthorizedException("لطفاً وارد حساب خود شوید");
    return user;
  },
);
