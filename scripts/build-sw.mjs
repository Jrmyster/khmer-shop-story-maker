import { createServiceWorker } from "./offline-source.mjs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
const root = "dist";
async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (!["sw.js", "_headers", "_redirects"].includes(entry.name))
      files.push(path);
  }
  return files;
}
const paths = (await walk(root)).sort();
const hash = createHash("sha256");
for (const file of paths) hash.update(await readFile(file));
const version = hash.digest("hex").slice(0, 12);
const urls = paths.map((file) => file.slice(root.length + 1));
const source = createServiceWorker(version, urls);
await writeFile(join(root, "sw.js"), source);
console.log(
  `Offline shell: ${urls.length} files, ${"shop-story-shell-" + version}`,
);
