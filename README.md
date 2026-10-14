# FPS-Game

A small, self-contained 3D first-person shooter prototype made with **Godot 4 + GDScript**. The arena is built procedurally from primitive meshes, so the project does not need third-party assets.

## Features

- First-person mouse-look and CharacterBody3D movement
- WASD movement, sprinting, jumping, shooting, and reloading
- Hitscan shooting with a visible first-person weapon
- Enemy AI that chases the player and attacks at close range
- Health, ammunition, kill count, mission-complete and mission-failed screens
- Procedurally built training arena with walls and cover
- No external asset downloads or add-on dependencies

## Requirements

- Godot **4.2 or newer** (Godot 4.x recommended)
- Windows, macOS, or Linux desktop

## Run

1. Download or clone this repository.
2. Open Godot Project Manager.
3. Click **Import** and select the `project.godot` file in this folder.
4. Open the project and press **F6** (current scene) or **F5** (project).
5. Click **開始任務** to begin. The mouse is captured while playing.

## Controls

| Action | Control |
|---|---|
| Move | `W` `A` `S` `D` |
| Look / aim | Mouse |
| Fire | Left mouse button |
| Reload | `R` |
| Sprint | `Shift` |
| Jump | `Space` |
| Release mouse | `Esc` |

Click the start/retry button to begin a round. Defeat all eight hostiles to win. If your health reaches zero, choose restart to try again.

## Project layout

```text
FPS-Game/
├── project.godot
├── README.md
├── LICENSE
├── .gitignore
├── scenes/
│   ├── main.tscn
│   ├── player.tscn
│   └── enemy.tscn
└── scripts/
    ├── main.gd
    ├── player.gd
    └── enemy.gd
```

## Notes / next improvements

This is a playable prototype rather than a finished commercial game. The arena and characters use simple primitive geometry. Possible next steps include sound effects, weapon switching, better enemy navigation/pathfinding, settings, more levels, and export presets.
