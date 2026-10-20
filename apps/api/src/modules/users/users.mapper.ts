import type { UserDto } from "@farsh/contracts";

import type { User } from "./schemas/user.schema.js";

export function toUserDto(user: User): UserDto {
  return {
    id: user._id.toString(),
    mobile: user.mobile,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
