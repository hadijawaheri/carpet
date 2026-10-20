import { z } from "zod";

const serverEnvSchema = z.object({
  // Where Server Components reach the API; the browser goes through the /api rewrite instead.
  INTERNAL_API_URL: z.url().default("http://localhost:7781"),
});

export const serverEnv = serverEnvSchema.parse({ INTERNAL_API_URL: process.env.INTERNAL_API_URL });
