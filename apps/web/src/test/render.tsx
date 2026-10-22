import { render } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { ReactElement } from "react";

import { QueryProvider } from "@/components/providers/query-provider";
import { DirectionProvider } from "@/components/ui/direction";
import { Toaster } from "@/components/ui/sonner";

/** Renders `ui` inside the providers the app wraps every page in (minus the Next router). */
export function renderWithProviders(ui: ReactElement) {
  return render(
    <NuqsTestingAdapter>
      <DirectionProvider dir="rtl">
        <QueryProvider>
          {ui}
          <Toaster />
        </QueryProvider>
      </DirectionProvider>
    </NuqsTestingAdapter>,
  );
}
