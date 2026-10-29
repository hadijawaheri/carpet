import { z } from "zod";

const emptyToUndefined = (value: unknown): unknown => (value === "" ? undefined : value);

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(7781),
    // Behind Caddy the API must not be reachable from outside the machine
    HOST: z.string().default("127.0.0.1"),
    DATABASE_URL: z.string().startsWith("mongodb"),
    JWT_ACCESS_SECRET: z.string().min(32),
    OTP_HMAC_SECRET: z.string().min(32),
    CORS_ORIGINS: z
      .string()
      .default("http://localhost:7782")
      .transform((value) =>
        value
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),
    // disabled: production before an SMS vendor exists; sign-in answers 503 SMS_UNAVAILABLE
    SMS_PROVIDER: z.enum(["console", "melipayamak", "disabled"]).default("console"),
    MELIPAYAMAK_API_KEY: z.preprocess(emptyToUndefined, z.string().min(8).optional()),
    MELIPAYAMAK_BODY_ID: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().optional(),
    ),
    // An empty value in .env means "not set", not "a zero-length code"
    OTP_FIXED_CODE: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .regex(/^\d{6}$/)
        .optional(),
    ),
    // Read by instrument.ts before Nest starts; listed here so a malformed value fails the boot
    SENTRY_DSN: z.preprocess(emptyToUndefined, z.url().optional()),
    THROTTLE_ENABLED: z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
  })
  .refine(
    (env) =>
      env.NODE_ENV !== "production" || (!env.OTP_FIXED_CODE && env.SMS_PROVIDER !== "console"),
    { message: "OTP_FIXED_CODE and the console SMS provider are forbidden in production" },
  )
  .refine(
    (env) =>
      env.SMS_PROVIDER !== "melipayamak" ||
      (env.MELIPAYAMAK_API_KEY !== undefined && env.MELIPAYAMAK_BODY_ID !== undefined),
    { message: "SMS_PROVIDER=melipayamak needs MELIPAYAMAK_API_KEY and MELIPAYAMAK_BODY_ID" },
  );

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  return envSchema.parse(raw);
}
