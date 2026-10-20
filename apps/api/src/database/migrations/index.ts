import type { Migration } from "../migrator.js";
import { refreshFamilyStart } from "./0001-refresh-family-start.js";

/** Every migration, oldest first. Append only. */
export const migrations: readonly Migration[] = [refreshFamilyStart];
