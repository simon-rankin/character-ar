import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cardsDir = path.join(__dirname, '..', 'cards');

const palettes = [
  ['#1b1f3b', '#3a1f5d', ['#ff6b6b', '#ffd93d', '#6bcbef', '#7bed9f', '#ffffff']],
  ['#0b3d2e', '#0f5c46', ['#ffb703', '#fb8500', '#219ebc', '#8ecae6', '#ffffff']],
  ['#3a0ca3', '#7209b7', ['#f72585', '#4cc9f0', '#4361ee', '#ffd60a', '#ffffff']],
  ['#1a1a2e', '#16213e', ['#e94560', '#0f3460', '#53354a', '#f9c784', '#ffffff']],
  ['#2b2d42', '#8d99ae', ['#ef233c', '#d90429', '#edf2f4', '#2b2d42', '#ffffff']],
  ['#03071e', '#370617', ['#6a040f', '#9d0208', '#e85d04', '#ffba08', '#ffffff']],
  ['#004b23', '#006400', ['#007200', '#38b000', '#70e000', '#ccff33', '#ffffff']],
  ['#480ca8', '#560bad', ['#7209b7', '#b5179e', '#f72585', '#4361ee', '#ffffff']],
  ['#231942', '#5e548e', ['#9f86c0', '#be95c4', '#e0b1cb', '#ffffff', '#4361ee']],
  ['#001219', '#005f73', ['#0a9396', '#94d2bd', '#ee9b00', '#ca6702', '#ffffff']],
  ['#540b0e', '#9e2a2b', ['#e09f3e', '#fff3b0', '#335c67', '#ffffff', '#e85d04']],
  ['#10002b', '#240046', ['#3c096c', '#5a189a', '#9d4edd', '#e0aaff', '#ffffff']],
  ['#212f45', '#3f4b3b', ['#606c38', '#dda15e', '#bc6c25', '#fefae0', '#ffffff']],
  ['#03045e', '#0077b6', ['#00b4d8', '#90e0ef', '#caf0f8', '#ffffff', '#0077b6']],
];

const entries = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'cards.json'), 'utf-8'));

for (const entry of entries) {
  const outPath = path.join(cardsDir, entry.card);
  if (fs.existsSync(outPath)) continue; // don't clobber an already-designed card

  const idx = parseInt(entry.slug.replace(/\D/g, ''), 10) - 1;
  const [bg1, bg2, shapeColors] = palettes[idx % palettes.length];

  const W = 750, H = 1050;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, bg1);
  grad.addColorStop(1, bg2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    const r = Math.random() * 2.5 + 0.5;
    ctx.fillStyle = `rgba(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.random() * 0.5 + 0.1})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = shapeColors[i % shapeColors.length];
    const x = Math.random() * W, y = Math.random() * H, s = Math.random() * 90 + 30;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.random() * Math.PI);
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.restore();
  }

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 14;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, H - 160, W, 160);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(entry.label.toUpperCase(), W / 2, H - 95);
  ctx.font = '28px sans-serif';
  ctx.fillText('TEST TRACKING CARD', W / 2, H - 50);

  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  console.log('Wrote', outPath);
}
