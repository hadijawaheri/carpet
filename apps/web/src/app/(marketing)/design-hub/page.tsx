import type { Metadata } from "next";

import { DesignHub } from "@/features/design-hub";

export const metadata: Metadata = {
  title: "راهنمای طراحی",
  description: "رنگ، حروف، فاصله، اجزا و حرکتِ سایت فرش در یک صفحه.",
};

export default function DesignHubPage() {
  return <DesignHub />;
}
