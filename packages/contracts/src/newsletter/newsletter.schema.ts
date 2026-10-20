import { z } from "zod";

export const subscribeNewsletterSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("ایمیل معتبر نیست")),
});
export type SubscribeNewsletterInput = z.infer<typeof subscribeNewsletterSchema>;
