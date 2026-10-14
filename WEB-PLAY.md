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

The workflow at `.github/workflows/deploy-pages.yml` publishes the `web/` folder to GitHub Pages when changes are pushed to `main`. In repository Settings → Pages, choose **GitHub Actions** as the build and deployment source if it is not already enabled. After the workflow succeeds, the game URL is typically:

`https://xdxdx33.github.io/FPS-Game/`

The deployed version is static and does not need a game server. The first visit needs an internet connection for the Three.js CDN import.

## Current scope

This is a standalone browser implementation, not an automatic conversion of GDScript. It includes a procedural arena, first-person movement, hitscan shooting, reload, eight chasing enemies, health/ammo HUD, win/lose states, and basic touch controls. The scene is intentionally asset-free.

It should be treated as an initial playable prototype. Test it on target browsers and devices before relying on it; mobile performance and pointer-lock behavior vary by browser.
