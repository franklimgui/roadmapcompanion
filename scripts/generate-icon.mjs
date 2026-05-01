// Gera icon.png (1024x1024) e icon.ico a partir do SVG fonte.
// Roda: node scripts/generate-icon.mjs

import sharp from "sharp";
import pngToIco from "png-to-ico";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SVG = path.join(ROOT, "src/assets/icon.svg");
const OUT_DIR = path.join(ROOT, "src/assets");

if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

const svgBuffer = await readFile(SVG);

// PNG 1024x1024 (master)
const png1024 = await sharp(svgBuffer)
  .resize(1024, 1024)
  .png()
  .toBuffer();
await writeFile(path.join(OUT_DIR, "icon.png"), png1024);
console.log("✓ icon.png (1024x1024)");

// PNG 256x256 (intermediate pra ICO)
const sizes = [16, 32, 48, 64, 128, 256];
const pngBuffers = await Promise.all(
  sizes.map((size) =>
    sharp(svgBuffer).resize(size, size).png().toBuffer()
  )
);

// ICO Windows (multi-resolution)
const ico = await pngToIco(pngBuffers);
await writeFile(path.join(OUT_DIR, "icon.ico"), ico);
console.log("✓ icon.ico (Windows multi-res)");

console.log("\nDone. Use src/assets/icon.ico no forge.config.ts");
