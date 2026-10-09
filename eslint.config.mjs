import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/next-env.d.ts"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { "simple-import-sort": simpleImportSort },
    languageOptions: { globals: { ...globals.node } },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  ...nextVitals.map((config) => ({ ...config, files: ["apps/web/**/*.{ts,tsx}"] })),
  { settings: { next: { rootDir: "apps/web" } } },
);
