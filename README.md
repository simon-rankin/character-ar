# Character AR Cards

A no-install "scan the card, watch the video" AR experience. Visitors open a link
in their phone's browser (no app to install), point the camera at a printed
card, and the matching character video plays in perspective right over the card.

Built with [MindAR.js](https://hiukim.github.io/mind-ar-js-doc/) image tracking + three.js.

Live site (via GitHub Pages): https://simon-rankin.github.io/character-ar/

## How it works

1. `cards/` holds the printed card artwork (one image per character).
2. `videos/` holds the source character videos.
3. `cards.json` lists which card pairs with which video.
4. Running the build script compiles all the cards into one tracking file and
   copies the paired videos into `docs/`, which is the folder GitHub Pages
   actually hosts.

You never hand-edit anything inside `docs/targets.mind` or `docs/manifest.json` —
they're regenerated every time you run the build.

## Adding a new card

1. Drop the finished, print-ready card artwork into `cards/` — name it something
   simple like `isabella.png` (lowercase, no spaces).
2. Make sure its matching video is in `videos/`.
3. Add one entry to `cards.json`:

   ```json
   {
     "slug": "isabella",
     "label": "Isabella Valenti",
     "card": "isabella.png",
     "video": "m4p_e1_valenti_isabella_v1.mp4"
   }
   ```

4. Run the build:

   ```bash
   npm run build
   ```

5. Commit and push `docs/` — GitHub Pages redeploys automatically. You can have
   as many entries in `cards.json` as you like; the app tracks all of them at
   once, so any card in the set can be scanned.

If you'd rather not touch the JSON yourself, just tell me the character name,
card image, and video file, and I'll add the entry, run the build, and push it
for you.

## Removing a card

1. Delete its entry from `cards.json`.
2. Run `npm run build` again, then commit and push `docs/`.

You don't need to delete the actual image/video files — anything not listed in
`cards.json` is simply ignored.

## Card artwork design constraints

This is *image tracking*, not a QR code — the phone's camera locks onto visual
detail in the artwork itself, so the design needs enough of it:

- **Avoid** large flat/solid-colour areas, simple gradients, or symmetric/
  repeating patterns — these don't give the tracker enough unique detail to lock
  onto reliably.
- **High local contrast helps**: sharp edges, varied texture, photographic
  detail. A detailed portrait photo (e.g. a yearbook-style headshot) tracks
  very well — better than a clean/minimal graphic design would.
- Export the artwork at a decent resolution — at least ~600px on the short
  side — so fine detail survives.
- Once a design is close to final, send it over and I'll test-compile it and
  tell you if it tracks well before it goes to print.

## Video loading and file size

Only the card actually being scanned is downloaded. The app uses a single video
element whose source is repointed when a target is recognised, so opening the
page costs one small `manifest.json` fetch and nothing else — adding more cards
doesn't slow down the first load.

`npm run build` also re-encodes each video for the web (capped at 720px wide,
CRF 26, `+faststart`) on its way into `docs/`. Files in `videos/` are treated as
untouched masters, so you can drop in whatever your editing app exports without
worrying about size — some originals were over 30 Mbps, which is far more than
a card-sized overlay on a phone can show. Re-encoding is skipped when a video
hasn't changed since the last build.

If a video ever looks too soft, raise `MAX_WIDTH` or lower `CRF` at the top of
`scripts/build.js` and rebuild.

## Device support and fallback messages

The experience needs a browser with import maps, WebGL and camera access —
in practice **iOS 16.4+** or a reasonably current Android browser. Rather than
failing silently, anything that can't run shows a full-screen explanation:

| Situation | What the visitor sees |
|---|---|
| Browser too old | "Sorry — this phone isn't supported", naming the iOS version needed and how to update |
| Opened inside Instagram/Facebook/TikTok etc. | "Open this in Safari/Chrome", with a copy-link button and a *Try anyway* option |
| Camera permission off | Step-by-step settings instructions for that exact phone and browser |
| Camera in use by another app | Told to close the other app and reload |
| No camera | Told to try a phone or tablet |
| Page served over http | Told it must be opened over https |
| Scripts fail to download | Suggests a different network |

The checks run in a plain (non-module) script deliberately, because browsers too
old to parse the main module would otherwise show a Start button that does
nothing at all. Camera permission is also requested directly rather than via
MindAR, which discards the underlying error — the difference between "blocked in
settings" and "no camera" is exactly what the visitor needs to be told.

`targets.mind` is the largest thing a visitor downloads (~11MB at 21 cards, and
it grows roughly 535KB per card). It starts downloading while the intro screen
is still on show, so the wait overlaps with reading rather than stalling after
Start.

Worth knowing: on some Android phones `facingMode: 'environment'` picks the
ultra-wide lens, whose distortion can weaken tracking. It's device-specific and
not something the page can reliably override.

## Video shape vs. card shape

The character videos aren't all the same aspect ratio (most are tall 1080×1920
portrait clips, but a few are different — one is even landscape). The app
automatically crops each video to fill the card's shape without stretching it
(like CSS `object-fit: cover`), so mismatched videos still look correct, but a
badly-mismatched one will have more of its frame cropped off. Worth keeping new
source videos close to the same portrait shape as the printed cards if possible.

## Note on privacy

`videos/`, `cards/`, and `cards.json` are git-ignored and stay local to this
Mac — the source videos and `cards.json` reference real people by filename,
and shouldn't be published. Only `docs/` (which uses generic slugs like
`char-01`) is committed and hosted. See `cards.json.example` for the format if
you need to recreate a local `cards.json` from scratch.

## Current status

- 21 cards are live: 14 character animations plus 7 kinetic-type exercises.
  Each uses a still frame from its own video as the tracking image.
- 4 of the original source videos remain excluded because their aspect ratio
  doesn't match the rest (one is landscape, others unusually tall or square).
- Hosted on GitHub Pages from this repo's `docs/` folder.
