import { connection } from "next/server";

import { ShowroomPage } from "@/features/showroom";

export default async function HomePage() {
  // The CSP nonce is per request, so the page renders per request; carpets stay cached for 60 s
  await connection();
  return <ShowroomPage />;
}
