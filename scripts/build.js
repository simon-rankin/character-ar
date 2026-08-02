import { OfflineCompiler } from 'mind-ar/src/image-target/offline-compiler.js';
import { loadImage, createCanvas } from 'canvas';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Source videos are masters and often far larger than they need to be (some
// exports run 30+ Mbps). The AR overlay only ever renders at card size on a
// phone, so re-encode a web-sized copy rather than shipping the master.
const MAX_WIDTH = 720;
const CRF = 26;

// Poster images for the watch.html gallery. Wide enough to stay sharp at 2x on
// a two-column phone grid, small enough that 20+ of them load quickly.
const THUMB_WIDTH = 420;

const transcode = (src, dest) => {
  execFileSync('ffmpeg', [
    '-y', '-i', src,
    // Only ever downscale — never upscale a smaller source.
    '-vf', `scale='min(${MAX_WIDTH},iw)':-2`,
    '-c:v', 'libx264', '-crf', String(CRF), '-preset', 'slow',
    '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '96k',
    // Put the index up front so playback can start before the full download.
    '-movflags', '+faststart',
    dest,
  ], { stdio: 'pipe' });
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const cardsConfigPath = path.join(root, 'cards.json');
const cardsDir = path.join(root, 'cards');
const videosDir = path.join(root, 'videos');
const webDir = path.join(root, 'docs');
const webVideosDir = path.join(webDir, 'videos');
const webThumbsDir = path.join(webDir, 'thumbs');

const writeThumbnail = (img, dest) => {
  const w = THUMB_WIDTH;
  const h = Math.round((img.height / img.width) * w);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.patternQuality = 'best';
  ctx.quality = 'best';
  ctx.drawImage(img, 0, 0, w, h);
  fs.writeFileSync(dest, canvas.toBuffer('image/jpeg', { quality: 0.78 }));
};

const config = JSON.parse(fs.readFileSync(cardsConfigPath, 'utf-8'));

if (config.length === 0) {
  console.error('cards.json is empty — add at least one card entry first.');
  process.exit(1);
}

try {
  execFileSync('ffmpeg', ['-version'], { stdio: 'pipe' });
} catch {
  console.error('ffmpeg not found — install it with:  brew install ffmpeg');
  process.exit(1);
}

fs.mkdirSync(webVideosDir, { recursive: true });
fs.mkdirSync(webThumbsDir, { recursive: true });

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
  const stale = !fs.existsSync(destVideo)
    || fs.statSync(videoPath).mtimeMs > fs.statSync(destVideo).mtimeMs;

  if (stale) {
    const srcMB = fs.statSync(videoPath).size / 1e6;
    process.stdout.write(`  optimising video (${srcMB.toFixed(1)}MB)... `);
    transcode(videoPath, destVideo);
    const outMB = fs.statSync(destVideo).size / 1e6;
    console.log(`-> ${outMB.toFixed(1)}MB`);
  }

  writeThumbnail(img, path.join(webThumbsDir, `${entry.slug}.jpg`));

  manifest.push({
    slug: entry.slug,
    label: entry.label || entry.slug,
    video: `videos/${entry.slug}.mp4`,
    thumb: `thumbs/${entry.slug}.jpg`,
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

const totalMB = manifest
  .reduce((sum, m) => sum + fs.statSync(path.join(webDir, m.video)).size, 0) / 1e6;
console.log(`\nTotal published video: ${totalMB.toFixed(1)}MB (only the scanned card's video is downloaded).`);

const thumbsKB = manifest
  .reduce((sum, m) => sum + fs.statSync(path.join(webDir, m.thumb)).size, 0) / 1e3;
console.log(`Gallery thumbnails: ${thumbsKB.toFixed(0)}KB for ${manifest.length} (watch.html grid).`);
