# FPS-Game

This repository contains the original Godot project and a separate browser-playable exploration game.

## Play in your browser

Open **https://xdxdx33.github.io/FPS-Game/** after GitHub Pages finishes deploying. The homepage is a playable canvas game, not just a text guide.

### Browser game controls

- **WASD** or **arrow keys**: move
- **Touch controls**: use the on-screen directional pad on phones
- Collect all **8 light shards**
- Avoid the roaming garden guardians
- If you pause, select **Continue Exploring** to resume

The browser game uses plain HTML, CSS, and JavaScript, so it does not need installation or external assets.

## Original Godot project

The original Godot project remains in the repository (`project.godot`, `scenes/`, and `scripts/`). Open the folder in Godot 4.x to work with that project.

## GitHub Pages

The root `index.html` is the playable homepage. The Actions deployment workflow publishes the `web/` folder, which contains the same browser game. In **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**. After a push to `web/`, check the Actions tab and wait for the deployment workflow to succeed before testing the live URL.
