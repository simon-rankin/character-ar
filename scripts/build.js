import { OfflineCompiler } from 'mind-ar/src/image-target/offline-compiler.js';
import { loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const cardsConfigPath = path.join(root, 'cards.json');
const cardsDir = path.join(root, 'cards');
const videosDir = path.join(root, 'videos');
const webDir = path.join(root, 'docs');
const webVideosDir = path.join(webDir, 'videos');

const config = JSON.parse(fs.readFileSync(cardsConfigPath, 'utf-8'));

if (config.length === 0) {
  console.error('cards.json is empty — add at least one card entry first.');
  process.exit(1);
}

fs.mkdirSync(webVideosDir, { recursive: true });

const images = [];
const manifest = [];

for (const entry of config) {
  const cardPath = path.join(cardsDir, entry.card);
  const videoPath = path.join(videosDir, entry.video);

  if (!fs.existsSync(cardPath)) {
    console.error(`Missing card image for "${entry.slug}": ${cardPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(videoPath)) {
    console.error(`Missing video for "${entry.slug}": ${videoPath}`);
    process.exit(1);
  }

  console.log(`Loading card "${entry.slug}"...`);
  const img = await loadImage(cardPath);
  images.push(img);

  const destVideo = path.join(webVideosDir, `${entry.slug}.mp4`);
  fs.copyFileSync(videoPath, destVideo);

  manifest.push({
    slug: entry.slug,
    label: entry.label || entry.slug,
    video: `videos/${entry.slug}.mp4`,
    width: img.width,
    height: img.height,
  });
}

console.log(`Compiling ${images.length} card target(s) — this can take a while per image...`);
const compiler = new OfflineCompiler();
await compiler.compileImageTargets(images, (progress) => {
  process.stdout.write(`\rProgress: ${progress.toFixed(1)}%   `);
});
console.log('\nDone compiling.');

const buffer = compiler.exportData();
fs.writeFileSync(path.join(webDir, 'targets.mind'), Buffer.from(buffer));
fs.writeFileSync(path.join(webDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log(`\nWrote docs/targets.mind and docs/manifest.json with ${manifest.length} card(s):`);
manifest.forEach((m, i) => console.log(`  [${i}] ${m.label} -> ${m.video}`));
