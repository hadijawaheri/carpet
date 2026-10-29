import { randomUUID } from "node:crypto";
import { access, mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { UPLOADED_IMAGE_PATH } from "@farsh/contracts";
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

  /** The stored file name behind a carpet's `image`, or null for a photo from the web app's public folder. */
  nameOf(image: string): string | null {
    if (!image.startsWith(UPLOADED_IMAGE_PATH)) return null;
    const name = image.slice(UPLOADED_IMAGE_PATH.length);
    return STORED_IMAGE_NAME.test(name) ? name : null;
  }

  async save(name: string, data: Buffer): Promise<void> {
    const target = this.pathOf(name);
    if (!target) throw new Error(`Refusing to store an image named ${name}`);
    await mkdir(this.dir, { recursive: true });
    // Written beside the target and renamed, so a reader never sees half a file
    const partial = `${target}.${randomUUID()}.part`;
    await writeFile(partial, data);
    await rename(partial, target);
  }

  async exists(name: string): Promise<boolean> {
    const target = this.pathOf(name);
    if (!target) return false;
    try {
      await access(target);
      return true;
    } catch {
      return false;
    }
  }

  async remove(name: string): Promise<void> {
    const target = this.pathOf(name);
    if (target) await rm(target, { force: true });
  }
}
