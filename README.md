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

- 14 test cards are wired up end-to-end, each using a generated placeholder
  image (not final artwork) paired with one of the source videos.
- 4 source videos were excluded because their aspect ratio/orientation doesn't
  match the rest (one is landscape, others are unusually tall or square) —
  worth deciding whether to re-export those before adding them.
- Hosted on GitHub Pages from this repo's `docs/` folder.
