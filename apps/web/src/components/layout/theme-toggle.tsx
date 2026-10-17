"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Both icons render and CSS picks one, so server and client markup match before the theme is known.
  return (
    <Button
      variant="secondary"
      size="icon"
      className="size-9 rounded-full"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="تغییر حالت روشن و تیره"
    >
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
    </Button>
  );
}
