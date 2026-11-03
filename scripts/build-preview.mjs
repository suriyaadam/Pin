// Build a self-contained review copy. This does not deploy or change the app.
// Run after `npm run build`; an optional output directory can be supplied.
import {
  readFile,
  writeFile,
  readdir,
  mkdir,
  rename,
  rm,
} from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, extname } from "node:path";
import { Script } from "node:vm";
import { deflateRawSync } from "node:zlib";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const output = resolve(process.argv[2] || join(root, ".."));
const mimeTypes = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
};
const assets = {};
async function collect(directory, prefix = "") {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = `${prefix}/${entry.name}`;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) await collect(absolute, relative);
    else if (mimeTypes[extname(entry.name)]) {
      assets[relative] =
        `data:${mimeTypes[extname(entry.name)]};base64,${(await readFile(absolute)).toString("base64")}`;
    }
  }
}
await collect(dist);

let html = await readFile(join(dist, "index.html"), "utf8");
const scriptMatch = html.match(
  /<script\b[^>]*\bsrc="([^\"]+)"[^>]*><\/script>/,
);
if (!scriptMatch)
  throw new Error("Expected the Vite entry script in dist/index.html.");
let script = await readFile(
  join(dist, scriptMatch[1].replace(/^\//, "")),
  "utf8",
);
// The catalogue's default category image is a template literal, rather than a
// static asset URL; preserve that expression while resolving it from the map.
script = script.replace(
  /`\/images\/\$\{([^}]+)\}\.webp`/g,
  (_, expression) =>
    `globalThis.__2five3PreviewAssets[\`/images/\${${expression}}.webp\`]`,
);
script = script.replace(
  /(["'])(\/(?:images|video)\/[^"']+)\1/g,
  (_, quote, path) => {
    if (!assets[path]) throw new Error(`Missing preview asset: ${path}`);
    return `globalThis.__2five3PreviewAssets[${JSON.stringify(path)}]`;
  },
);
new Script(script, { filename: "2five3-preview-inline.js" });

for (const match of [
  ...html.matchAll(
    /<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^\"]+)"[^>]*>/g,
  ),
]) {
  let css = await readFile(join(dist, match[1].replace(/^\//, "")), "utf8");
  css = css.replace(/url\((["']?)(\/[^)'" ]+)\1\)/g, (_, quote, path) => {
    if (!assets[path]) throw new Error(`Missing preview CSS asset: ${path}`);
    return `url("${assets[path]}")`;
  });
  html = html.replace(match[0], `<style>${css}</style>`);
}
html = html.replace(scriptMatch[0], "");
html = html.replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g, "");
html = html.replace('href="/favicon.svg"', `href="${assets["/favicon.svg"]}"`);
const fontLicenses = await Promise.all(
  ["DM-Sans-OFL.txt", "DM-Serif-Display-OFL.txt"].map(
    async (name) =>
      `${name}\n${await readFile(join(dist, "fonts", name), "utf8")}`,
  ),
);
html = html.replace(
  "</head>",
  () =>
    `<!-- Embedded font licenses\n${fontLicenses.join("\n\n").replace(/-->/g, "-- >")}\n-->\n</head>`,
);
const bootstrap = `globalThis.__2five3PreviewAssets=${JSON.stringify(assets)};`;
// The production bundle has no imports. A normal inline script avoids file://
// module restrictions and makes double-click review possible without a server.
html = html.replace(
  "</body>",
  () =>
    `<script>${bootstrap.replace(/<\/script/gi, "<\\/script")}\n${script.replace(/<\/script/gi, "<\\/script")}</script>\n</body>`,
);
await mkdir(output, { recursive: true });
const htmlPath = join(output, "2five3-preview.html");
await writeFile(htmlPath, html);

const instructions = `2FIVE3 COFFEE & MART — APERÇU DE VALIDATION\n\nAucun déploiement n'a été effectué.\n\nOPTION 1 — OUVERTURE DIRECTE\nOuvrez 2five3-preview.html dans un navigateur récent (Chrome, Edge, Safari ou Firefox).\nLe fichier contient les images, les polices et la vidéo : aucune installation ni connexion n'est nécessaire.\nLes visuels sont provisoires et illustratifs.\n\nOPTION 2 — SERVEUR LOCAL\nLe dossier site contient la version de production classique.\nAvec Python installé, ouvrez un terminal dans ce dossier puis exécutez :\n\n  python3 -m http.server 5173 --bind 0.0.0.0\n\nSous Windows, remplacez python3 par python si nécessaire.\nOuvrez ensuite http://localhost:5173 sur cet ordinateur.\nPour vérifier sur un téléphone connecté au même Wi-Fi, remplacez localhost par l'adresse IP locale de l'ordinateur (ex. http://192.168.1.20:5173).\nAutorisez le réseau local dans le pare-feu si nécessaire.\n\nLa réduction des animations activée dans le système remplace la vidéo pilotée au défilement par une image fixe.\n`;
// A small ZIP writer keeps review generation portable: no external executable,
// package dependency or child process is needed. Files are UTF-8 named, use
// standard CRC-32/DEFLATE and stay within the classic ZIP size limits.
const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) {
    value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});
function crc32(content) {
  let crc = 0xffffffff;
  for (const byte of content) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function makeZip(entries) {
  if (entries.length > 65535) throw new Error('Too many preview files for classic ZIP.');
  const files = [];
  const directory = [];
  const now = new Date();
  const date = ((Math.max(1980, Math.min(2107, now.getFullYear())) - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const content = Buffer.isBuffer(entry.content) ? entry.content : Buffer.from(entry.content, 'utf8');
    const compressed = deflateRawSync(content, { level: 6 });
    if (name.length > 65535 || content.length > 0xffffffff || compressed.length > 0xffffffff || offset > 0xffffffff) {
      throw new Error(`Preview file exceeds classic ZIP limits: ${entry.name}`);
    }
    const checksum = crc32(content);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 file name
    local.writeUInt16LE(8, 8); // DEFLATE
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(name.length, 26);
    files.push(local, name, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(content.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    directory.push(central, name);
    offset += local.length + name.length + compressed.length;
  }
  const centralDirectory = Buffer.concat(directory);
  if (offset + centralDirectory.length > 0xffffffff) throw new Error('Preview archive requires ZIP64.');
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...files, centralDirectory, end]);
}
const zipEntries = [
  { name: '2five3-preview.html', content: html },
  { name: 'LIRE-MOI.txt', content: instructions },
];
async function addSiteFiles(directory, prefix = 'site') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = `${prefix}/${entry.name}`;
    const file = join(directory, entry.name);
    if (entry.isDirectory()) await addSiteFiles(file, name);
    else zipEntries.push({ name, content: await readFile(file) });
  }
}
await addSiteFiles(dist);
const zipPath = join(output, '2five3-preview.zip');
const temporaryZip = `${zipPath}.tmp-${process.pid}`;
try {
  await writeFile(temporaryZip, makeZip(zipEntries));
  // Preserve any existing archive until its complete replacement is ready.
  await rename(temporaryZip, zipPath);
  console.log(
    `Standalone review: ${htmlPath} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB)`,
  );
  console.log(`Review archive: ${zipPath}`);
} finally {
  await rm(temporaryZip, { force: true });
}
