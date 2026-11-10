import "server-only";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { randomToken } from "./auth";
import { FILES_DIR, MEDIA_DIR } from "./db";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".zip": "application/zip",
};

export const mimeOf = (file: string) => MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";

const safeExt = (name: string) => {
  const ext = path.extname(name).toLowerCase();
  return /^\.[a-z0-9]{1,6}$/.test(ext) ? ext : "";
};

/** Saves a public media upload and returns its URL (`/media/...`). */
export async function saveMedia(file: File, prefix = "") {
  const name = `${prefix}${randomToken(9)}${safeExt(file.name)}`;
  const dest = path.join(MEDIA_DIR, "uploads", name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await file.arrayBuffer()));
  return `/media/uploads/${name}`;
}

/** Saves a private project archive and returns its storage key (relative to FILES_DIR). */
export async function saveProjectFile(file: File) {
  const base = path.basename(file.name).replace(/[^\w.\-]+/g, "_").slice(-80) || "project.zip";
  const name = `${randomToken(9)}-${base}`;
  fs.mkdirSync(FILES_DIR, { recursive: true });
  fs.writeFileSync(path.join(FILES_DIR, name), Buffer.from(await file.arrayBuffer()));
  return name;
}

function resolveInside(root: string, rel: string) {
  const full = path.resolve(root, rel);
  return full.startsWith(root + path.sep) ? full : null;
}

/** Streams a file with HTTP Range support (needed for video seeking). */
export function serveFile(
  req: Request,
  root: string,
  rel: string,
  extraHeaders: Record<string, string> = {},
): Response {
  const full = resolveInside(root, rel);
  if (!full || !fs.existsSync(full) || !fs.statSync(full).isFile()) return new Response("Not found", { status: 404 });
  const size = fs.statSync(full).size;
  const headers: Record<string, string> = {
    "Content-Type": mimeOf(full),
    "Accept-Ranges": "bytes",
    ...extraHeaders,
  };
  const range = req.headers.get("range");
  const m = range && /^bytes=(\d*)-(\d*)$/.exec(range);
  if (m) {
    let start = m[1] ? Number(m[1]) : NaN;
    let end = m[2] ? Number(m[2]) : size - 1;
    if (Number.isNaN(start)) {
      start = Math.max(0, size - end);
      end = size - 1;
    }
    end = Math.min(end, size - 1);
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const stream = Readable.toWeb(fs.createReadStream(full, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  const stream = Readable.toWeb(fs.createReadStream(full)) as ReadableStream;
  return new Response(stream, { headers: { ...headers, "Content-Length": String(size) } });
}

export { FILES_DIR, MEDIA_DIR };
