/**
 * @file Generate PWA PNG icons from the SVG source.
 * Produces 192x192 and 512x512 PNGs in public/icons/.
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const svgPath = resolve(root, 'public/icons/icon-192x192.svg');
const outDir = resolve(root, 'public/icons');

mkdirSync(outDir, { recursive: true });

const svgBuffer = readFileSync(svgPath);

const sizes = [192, 512];

for (const size of sizes) {
  // Re-render SVG at target size for crisp output
  const resizedSvg = svgBuffer
    .toString()
    .replace(/width="192"/, `width="${size}"`)
    .replace(/height="192"/, `height="${size}"`)
    .replace(/viewBox="0 0 192 192"/, `viewBox="0 0 192 192"`);

  await sharp(Buffer.from(resizedSvg))
    .resize(size, size)
    .png()
    .toFile(resolve(outDir, `icon-${size}x${size}.png`));

  console.log(`✓ icon-${size}x${size}.png`);
}

console.log('Done!');
