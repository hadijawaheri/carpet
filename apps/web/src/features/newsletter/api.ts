import type { SubscribeNewsletterInput } from "@farsh/contracts";

import { api } from "@/lib/api/client";

export const subscribeNewsletter = (input: SubscribeNewsletterInput) =>
  api<void>("/newsletter/subscriptions", { method: "POST", json: input });
