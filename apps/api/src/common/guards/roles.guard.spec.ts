import type { Role } from "@farsh/contracts";
import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { describe, expect, it } from "vitest";

import { Roles } from "../decorators/roles.decorator.js";
import type { AuthUser } from "../types/auth.js";
import { RolesGuard } from "./roles.guard.js";

class Handlers {
  @Roles("admin")
  adminOnly(): void {}

  open(): void {}
}

function contextFor(handler: keyof Handlers, user?: AuthUser): ExecutionContext {
  return {
    getHandler: () => Handlers.prototype[handler],
    getClass: () => Handlers,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  const guard = new RolesGuard(new Reflector());
  const as = (role: Role): AuthUser => ({ id: "u1", role });

  it("allows any caller on a route without @Roles", () => {
    expect(guard.canActivate(contextFor("open"))).toBe(true);
  });

  it("allows an admin on an admin route", () => {
    expect(guard.canActivate(contextFor("adminOnly", as("admin")))).toBe(true);
  });

  it("forbids a user and an anonymous caller on an admin route", () => {
    expect(() => guard.canActivate(contextFor("adminOnly", as("user")))).toThrow(
      ForbiddenException,
    );
    expect(() => guard.canActivate(contextFor("adminOnly"))).toThrow(ForbiddenException);
  });
});
