import { z } from "zod";

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
    SMS_PROVIDER: z.enum(["console", "melipayamak"]).default("console"),
    // An empty value in .env means "not set", not "a zero-length code"
    OTP_FIXED_CODE: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z
        .string()
        .regex(/^\d{6}$/)
        .optional(),
    ),
    THROTTLE_ENABLED: z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
  })
  .refine(
    (env) =>
      env.NODE_ENV !== "production" || (!env.OTP_FIXED_CODE && env.SMS_PROVIDER !== "console"),
    { message: "OTP_FIXED_CODE and the console SMS provider are forbidden in production" },
  );

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  return envSchema.parse(raw);
}
