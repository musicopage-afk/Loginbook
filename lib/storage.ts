import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

export type StoredFile = {
  storageUri: string;
  sha256: string;
  byteSize: number;
  contentType: string;
  filename: string;
};

export interface StorageAdapter {
  save(file: File, entryId: string): Promise<StoredFile>;
}

class LocalStorageAdapter implements StorageAdapter {
  async save(file: File, entryId: string) {
    const dir = path.resolve(process.cwd(), env.storage.localUploadDir, entryId);
    const buffer = Buffer.from(await file.arrayBuffer());
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const fullPath = path.join(dir, filename);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, buffer);

    return {
      storageUri: fullPath,
      sha256,
      byteSize: buffer.byteLength,
      contentType: file.type || "application/octet-stream",
      filename: file.name
    };
  }
}

class S3StorageAdapter implements StorageAdapter {
  async save(file: File, entryId: string) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const key = `${entryId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    return {
      storageUri: `s3://${env.storage.s3Bucket}/${key}`,
      sha256,
      byteSize: buffer.byteLength,
      contentType: file.type || "application/octet-stream",
      filename: file.name
    };
  }
}

export function getStorageAdapter(): StorageAdapter {
  if (env.storage.driver === "s3") {
    return new S3StorageAdapter();
  }

  return new LocalStorageAdapter();
}
