import { z } from "zod";

import { digitsString, mobileSchema } from "../common/iran";
import { optionalText } from "../common/text";

// business: shops and designers buying for clients (blueprint §8); no endpoint treats it specially yet
export const ROLES = ["user", "business", "admin"] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

export const COOKIE_NAMES = { access: "access_token", refresh: "refresh_token" } as const;

export const requestOtpSchema = z.object({ mobile: mobileSchema });
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  mobile: mobileSchema,
  code: digitsString.pipe(z.string().regex(/^\d{6}$/, "کد تأیید شش رقم است")),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

/** Deleting an account asks for a fresh code sent to the account's own mobile. */
export const deleteAccountSchema = verifyOtpSchema.pick({ code: true });
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

export const userDtoSchema = z.object({
  id: z.string(),
  mobile: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  role: roleSchema,
  createdAt: z.string(),
});
export type UserDto = z.infer<typeof userDtoSchema>;

export const updateProfileSchema = z.object({
  firstName: optionalText(60),
  lastName: optionalText(60),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
