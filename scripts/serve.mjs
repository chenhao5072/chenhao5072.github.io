import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), "dist");
const port = Number(process.env.PORT || 4173);

function readGlobalHeaders() {
  const file = path.join(root, "_headers");
  if (!existsSync(file)) return {};

  const headers = {};
  let inGlobalBlock = false;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    if (line.trim() === "/*") {
      inGlobalBlock = true;
      continue;
    }
    if (!inGlobalBlock) continue;
    if (!/^\s/.test(line)) break;
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    headers[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return headers;
}

const globalHeaders = readGlobalHeaders();

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8"
};

function safePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const joined = path.resolve(root, `.${clean}`);
  if (!joined.startsWith(`${root}${path.sep}`) && joined !== root) return null;
  return joined;
}

createServer((request, response) => {
  const requested = safePath(request.url || "/");
  if (!requested) {
    response.writeHead(400).end("Bad request");
    return;
  }

  let file = requested;
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, "index.html");

  let status = 200;
  if (!existsSync(file) || !statSync(file).isFile()) {
    status = 404;
    const pathname = request.url || "/";
    file = pathname.startsWith("/ja/") ? path.join(root, "ja", "404.html") : pathname.startsWith("/en/") ? path.join(root, "en", "404.html") : path.join(root, "404.html");
  }

  response.writeHead(status, {
    ...globalHeaders,
    "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`ONEPIECE STUDIO production preview: http://127.0.0.1:${port}`);
});
