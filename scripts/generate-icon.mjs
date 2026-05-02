// Gera icon.png (1024x1024), icon.ico (Windows) e icon.icns (Mac) a partir do SVG fonte.
// Roda: npm run generate:icons (ou node scripts/generate-icon.mjs)

import sharp from "sharp";
import pngToIco from "png-to-ico";
import png2icons from "png2icons";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SVG = path.join(ROOT, "src/assets/icon.svg");
const OUT_DIR = path.join(ROOT, "src/assets");

if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

const svgBuffer = await readFile(SVG);

// PNG 1024x1024 (master, usado também pelo Linux e como base do .icns)
const png1024 = await sharp(svgBuffer)
  .resize(1024, 1024)
  .png()
  .toBuffer();
await writeFile(path.join(OUT_DIR, "icon.png"), png1024);
console.log("✓ icon.png (1024x1024)");

// Tamanhos pra ICO Windows
const icoSizes = [16, 32, 48, 64, 128, 256];
const icoBuffers = await Promise.all(
  icoSizes.map((size) =>
    sharp(svgBuffer).resize(size, size).png().toBuffer()
  )
);

// ICO Windows (multi-resolution)
const ico = await pngToIco(icoBuffers);
await writeFile(path.join(OUT_DIR, "icon.ico"), ico);
console.log("✓ icon.ico (Windows multi-res)");

// ICNS Mac (a partir do PNG 1024x1024)
// png2icons.createICNS aceita um PNG buffer e gera ICNS multi-resolution
const icns = png2icons.createICNS(png1024, png2icons.BILINEAR, 0);
if (!icns) {
  console.error("✗ Falha ao gerar icon.icns");
  process.exit(1);
}
await writeFile(path.join(OUT_DIR, "icon.icns"), icns);
console.log("✓ icon.icns (Mac multi-res)");

console.log("\nDone. Forge resolve src/assets/icon.{ico,icns,png} automaticamente.");
