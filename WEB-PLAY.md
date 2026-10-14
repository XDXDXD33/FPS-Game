# Browser version: FPS-Game Web

A JavaScript + Three.js browser FPS is available in the `web/` folder. The original Godot project remains unchanged.

## Play locally

Because the browser version uses JavaScript ES modules, open it through a local HTTP server rather than double-clicking `index.html`.

For example, from the repository root:

```bash
python -m http.server 8000
```

Then open http://localhost:8000/web/ in a modern browser. An internet connection is needed to load Three.js from jsDelivr.

## Controls

Desktop:
- `W A S D`: move
- Mouse: aim (click the game canvas to capture the pointer)
- Left mouse button: fire
- `R`: reload
- `Shift`: sprint
- `Space`: jump

Mobile:
- Left virtual stick: move
- Drag the right side of the screen: aim
- FIRE: shoot
- 換彈 / 跳躍: reload / jump

## Publish with GitHub Pages

1. Open this repository's **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions** and save.
3. Open the **Actions** tab and select **Deploy browser FPS to GitHub Pages**.
4. Select **Run workflow** on the `main` branch if the latest run did not automatically start after enabling Pages.
5. Wait until the run succeeds. The game URL is typically:

   `https://xdxdx33.github.io/FPS-Game/`

The workflow publishes only the `web/` folder. The deployed version is static and does not need a game server. The first visit needs an internet connection for the Three.js CDN import.

The workflow cannot enable the Pages site itself because the connected GitHub integration does not have permission to create repository Pages settings. Enable Pages once manually as described above; subsequent pushes to `web/` will deploy automatically.

## Current scope

This is a standalone browser implementation, not an automatic conversion of GDScript. It includes a procedural arena, first-person movement, hitscan shooting, reload, eight chasing enemies, health/ammo HUD, win/lose states, and basic touch controls. The scene is intentionally asset-free.

It should be treated as an initial playable prototype. Test it on target browsers and devices before relying on it; mobile performance and pointer-lock behavior vary by browser.
