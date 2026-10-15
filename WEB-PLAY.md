# Browser game

The `web/` folder contains a playable, self-contained exploration game. The root `index.html` contains the same game so that both branch-based Pages and the Actions deployment can serve a playable homepage.

## Play locally

Open `index.html` directly in a modern browser. No server or external assets are required.

## Controls

- Desktop: use `W`, `A`, `S`, `D` or the arrow keys to move.
- Mobile: use the on-screen directional pad.
- Collect all eight glowing shards and avoid the roaming garden guardians.
- Press `Esc` to pause on desktop; use the on-screen pause button on mobile.

## GitHub Pages

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Open **Actions** and check that the latest deployment succeeds.
4. Visit `https://xdxdx33.github.io/FPS-Game/`.

The deployment workflow publishes the `web/` directory. The browser game is plain HTML/CSS/JavaScript and does not need a game server or third-party downloads.
