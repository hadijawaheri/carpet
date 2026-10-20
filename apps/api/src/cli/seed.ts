import { carpetCatalog, maskMobile, mobileSchema } from "@farsh/contracts";
import { NestFactory } from "@nestjs/core";
import { getConnectionToken } from "@nestjs/mongoose";
import type { Connection } from "mongoose";

import { AppModule } from "../app.module.js";
import { CarpetsService } from "../modules/carpets/carpets.service.js";
import { UsersService } from "../modules/users/users.service.js";

const USAGE = "Usage: seed [--overwrite] [--indexes-only] [--admin 09xxxxxxxxx]";

interface SeedArgs {
  overwrite: boolean;
  indexesOnly: boolean;
  admin?: string;
}

function parseArgs(argv: string[]): SeedArgs {
  // pnpm forwards a literal "--" in some versions
  const args = argv.filter((arg) => arg !== "--");
  const result: SeedArgs = { overwrite: false, indexesOnly: false };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--overwrite") result.overwrite = true;
    else if (arg === "--indexes-only") result.indexesOnly = true;
    else if (arg === "--admin") {
      const parsed = mobileSchema.safeParse(args[i + 1] ?? "");
      if (!parsed.success) throw new Error(`--admin needs a mobile like 09123456789. ${USAGE}`);
      result.admin = parsed.data;
      i += 1;
    } else throw new Error(`Unknown argument "${arg ?? ""}". ${USAGE}`);
  }
  return result;
}

const args = parseArgs(process.argv.slice(2));
// Plain stdout: Nest logging is limited to warnings so the boot chatter does not bury the result
const report = (line: string): void => {
  process.stdout.write(`${line}\n`);
};
const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn"] });

try {
  // Production runs with autoIndex off, so this is where indexes (unique slugs, TTLs) get built
  await app.get<Connection>(getConnectionToken()).syncIndexes();
  report("Indexes are in sync");

  if (!args.indexesOnly) {
    const { inserted } = await app.get(CarpetsService).upsertMany(carpetCatalog, args.overwrite);
    report(
      `Catalogue: ${inserted} inserted, ${carpetCatalog.length - inserted} already present` +
        (args.overwrite ? " (overwritten)" : ""),
    );
  }

  if (args.admin) {
    await app.get(UsersService).setRoleByMobile(args.admin, "admin");
    report(`${maskMobile(args.admin)} is now an admin; they must sign in again`);
  }
} finally {
  await app.close();
}
