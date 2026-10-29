import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { Env } from "../../config/env.js";
import { STORED_IMAGE_NAME } from "./carpet-image.js";

/** Carpet photos on the server's disk, under MEDIA_DIR/carpets. */
@Injectable()
export class ImageStorage {
  private readonly dir: string;

  constructor(config: ConfigService<Env, true>) {
    this.dir = path.resolve(config.get("MEDIA_DIR", { infer: true }), "carpets");
  }

  /** Absolute path of a stored photo, or null for any name this API would not have written. */
  pathOf(name: string): string | null {
    return STORED_IMAGE_NAME.test(name) ? path.join(this.dir, name) : null;
  }

  async save(name: string, data: Buffer): Promise<void> {
    const target = this.pathOf(name);
    if (!target) throw new Error(`Refusing to store an image named ${name}`);
    await mkdir(this.dir, { recursive: true });
    // Written beside the target and renamed, so a reader never sees half a file
    const partial = `${target}.${process.pid}.part`;
    await writeFile(partial, data);
    await rename(partial, target);
  }

  async remove(name: string): Promise<void> {
    const target = this.pathOf(name);
    if (target) await rm(target, { force: true });
  }
}
