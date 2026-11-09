import { copyFile, mkdir, readFile } from "node:fs/promises";

const output = new URL("./dist/", import.meta.url);
const files = ["index.html", "privacy.html", "style.css"];
const sources = files.map(name => new URL("./pages/" + name, import.meta.url));
for (const source of sources) {
  if (/\{\{(?:EMAIL|OWNER)\}\}/.test(await readFile(source, "utf8"))) {
    throw new Error("Confirm the public support email and controller before publishing.");
  }
}
await mkdir(output, { recursive: true });
await Promise.all(sources.map((source, i) => copyFile(source, new URL(files[i], output))));
