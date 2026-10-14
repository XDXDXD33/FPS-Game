extends Node3D

const PLAYER_SCENE: PackedScene = preload("res://scenes/player.tscn")
const ENEMY_SCENE: PackedScene = preload("res://scenes/enemy.tscn")

var player: FPSPlayer
var game_started := false
var game_over := false
var kills := 0
var total_enemies := 8
var enemies_remaining := 0
var hud_label: Label
var health_bar: ProgressBar
var ammo_label: Label
var status_label: Label
var overlay: ColorRect
var overlay_title: Label
var overlay_body: Label
var overlay_button: Button
var crosshair: Label
var world_environment: WorldEnvironment

func _ready() -> void:
    randomize()
    _build_environment()
    _build_map()
    _build_ui()
    _spawn_player()
    _show_overlay("FPS // TRAINING GROUND", "清除訓練場內的所有敵人。\nWASD 移動 · 滑鼠瞄準與射擊 · R 換彈 · Shift 奔跑 · Space 跳躍", "開始任務")

func _build_environment() -> void:
    world_environment = WorldEnvironment.new()
    var env := Environment.new()
    env.background_mode = Environment.BG_SKY
    var sky := Sky.new()
    var sky_material := ProceduralSkyMaterial.new()
    sky_material.sky_top_color = Color(0.025, 0.055, 0.105)
    sky_material.sky_horizon_color = Color(0.18, 0.22, 0.28)
    sky_material.ground_bottom_color = Color(0.025, 0.03, 0.04)
    sky_material.ground_horizon_color = Color(0.12, 0.14, 0.16)
    sky.sky_material = sky_material
    env.sky = sky
    env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
    env.ambient_light_color = Color(0.45, 0.52, 0.66)
    env.ambient_light_energy = 0.65
    env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
    world_environment.environment = env
    add_child(world_environment)

    var sun := DirectionalLight3D.new()
    sun.rotation_degrees = Vector3(-48, -28, 0)
    sun.light_energy = 1.35
    sun.shadow_enabled = true
    add_child(sun)

func _build_map() -> void:
    _add_box("Floor", Vector3(0, -0.5, 0), Vector3(42, 1, 42), Color(0.16, 0.19, 0.22))
    _add_box("NorthWall", Vector3(0, 2, -21), Vector3(42, 4, 0.8), Color(0.24, 0.28, 0.32))
    _add_box("SouthWall", Vector3(0, 2, 21), Vector3(42, 4, 0.8), Color(0.24, 0.28, 0.32))
    _add_box("WestWall", Vector3(-21, 2, 0), Vector3(0.8, 4, 42), Color(0.24, 0.28, 0.32))
    _add_box("EastWall", Vector3(21, 2, 0), Vector3(0.8, 4, 42), Color(0.24, 0.28, 0.32))
    var cover := [
        [Vector3(-8, 1, -7), Vector3(5, 2, 1.4)],
        [Vector3(7, 1, -8), Vector3(1.5, 2, 6)],
        [Vector3(-3, 1, 1), Vector3(6, 2, 1.4)],
        [Vector3(9, 1, 4), Vector3(5, 2, 1.4)],
        [Vector3(-10, 1, 9), Vector3(1.5, 2, 5)],
        [Vector3(1, 1, 11), Vector3(6, 2, 1.4)],
        [Vector3(-14, 0.8, -3), Vector3(2.2, 1.6, 2.2)],
        [Vector3(14, 0.8, -12), Vector3(2.2, 1.6, 2.2)],
        [Vector3(13, 0.8, 12), Vector3(2.2, 1.6, 2.2)],
        [Vector3(-3, 0.8, -14), Vector3(2.2, 1.6, 2.2)]
    ]
    for item in cover:
        _add_box("Cover", item[0], item[1], Color(0.31, 0.35, 0.38))
    for i in range(7):
        _add_box("LaneMarker", Vector3(-15 + i * 5, 0.012, 0), Vector3(0.08, 0.02, 30), Color(0.68, 0.42, 0.12))

func _add_box(node_name: String, position: Vector3, size: Vector3, color: Color) -> StaticBody3D:
    var body := StaticBody3D.new()
    body.name = node_name
    body.position = position
    var mesh_instance := MeshInstance3D.new()
    var mesh := BoxMesh.new()
    mesh.size = size
    mesh_instance.mesh = mesh
    var material := StandardMaterial3D.new()
    material.albedo_color = color
    material.roughness = 0.82
    mesh_instance.material_override = material
    body.add_child(mesh_instance)
    var collision := CollisionShape3D.new()
    var shape := BoxShape3D.new()
    shape.size = size
    collision.shape = shape
    body.add_child(collision)
    add_child(body)
    return body

func _spawn_player() -> void:
    player = PLAYER_SCENE.instantiate() as FPSPlayer
    player.position = Vector3(0, 0.05, 16)
    add_child(player)
    player.set_active(false)
    player.health_changed.connect(_on_health_changed)
    player.ammo_changed.connect(_on_ammo_changed)
    player.killed_enemy.connect(_on_kill)
    player.player_died.connect(_on_player_died)

func _spawn_enemies() -> void:
    for enemy in get_tree().get_nodes_in_group("enemies"):
        enemy.queue_free()
    var spots := [Vector3(-15, 0.05, -14), Vector3(-7, 0.05, -16), Vector3(2, 0.05, -14), Vector3(14, 0.05, -14), Vector3(-15, 0.05, 4), Vector3(15, 0.05, 1), Vector3(-7, 0.05, 14), Vector3(8, 0.05, 14)]
    for spot in spots:
        var enemy := ENEMY_SCENE.instantiate() as FPSEnemy
        enemy.position = spot
        enemy.died.connect(_on_enemy_died)
        add_child(enemy)
    total_enemies = spots.size()
    enemies_remaining = total_enemies
    kills = 0
    _update_hud()

func _build_ui() -> void:
    var layer := CanvasLayer.new()
    layer.name = "UI"
    add_child(layer)

    var top_panel := PanelContainer.new()
    top_panel.position = Vector2(20, 18)
    top_panel.custom_minimum_size = Vector2(290, 84)
    layer.add_child(top_panel)
    var top_box := VBoxContainer.new()
    top_box.add_theme_constant_override("separation", 5)
    top_panel.add_child(top_box)
    hud_label = Label.new()
    hud_label.text = "FPS // TRAINING GROUND"
    hud_label.add_theme_font_size_override("font_size", 18)
    top_box.add_child(hud_label)
    status_label = Label.new()
    status_label.text = "KILLS  0 / 8"
    status_label.add_theme_color_override("font_color", Color(0.95, 0.68, 0.24))
    top_box.add_child(status_label)

    var bottom_panel := PanelContainer.new()
    bottom_panel.anchor_left = 0.0
    bottom_panel.anchor_top = 1.0
    bottom_panel.anchor_right = 0.0
    bottom_panel.anchor_bottom = 1.0
    bottom_panel.offset_left = 20
    bottom_panel.offset_top = -112
    bottom_panel.offset_right = 300
    bottom_panel.offset_bottom = -20
    layer.add_child(bottom_panel)
    var bottom_box := VBoxContainer.new()
    bottom_box.add_theme_constant_override("separation", 8)
    bottom_panel.add_child(bottom_box)
    var health_title := Label.new()
    health_title.text = "VITALS"
    bottom_box.add_child(health_title)
    health_bar = ProgressBar.new()
    health_bar.custom_minimum_size = Vector2(250, 22)
    health_bar.max_value = 100
    health_bar.value = 100
    health_bar.show_percentage = false
    bottom_box.add_child(health_bar)
    ammo_label = Label.new()
    ammo_label.text = "AMMO  12 / 72"
    ammo_label.add_theme_font_size_override("font_size", 19)
    bottom_box.add_child(ammo_label)

    crosshair = Label.new()
    crosshair.text = "+"
    crosshair.add_theme_font_size_override("font_size", 30)
    crosshair.add_theme_color_override("font_color", Color(0.95, 0.96, 1.0))
    crosshair.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
    crosshair.position = Vector2(-8, -22)
    crosshair.size = Vector2(20, 40)
    layer.add_child(crosshair)

    overlay = ColorRect.new()
    overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    overlay.color = Color(0.015, 0.025, 0.04, 0.88)
    layer.add_child(overlay)
    var center := CenterContainer.new()
    center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    overlay.add_child(center)
    var panel := PanelContainer.new()
    panel.custom_minimum_size = Vector2(560, 310)
    center.add_child(panel)
    var content := VBoxContainer.new()
    content.alignment = BoxContainer.ALIGNMENT_CENTER
    content.add_theme_constant_override("separation", 18)
    panel.add_child(content)
    overlay_title = Label.new()
    overlay_title.text = "FPS // TRAINING GROUND"
    overlay_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    overlay_title.add_theme_font_size_override("font_size", 30)
    content.add_child(overlay_title)
    overlay_body = Label.new()
    overlay_body.text = "Clear the training ground."
    overlay_body.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    overlay_body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    content.add_child(overlay_body)
    overlay_button = Button.new()
    overlay_button.text = "開始任務"
    overlay_button.custom_minimum_size = Vector2(220, 48)
    overlay_button.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
    overlay_button.pressed.connect(_on_overlay_button)
    content.add_child(overlay_button)
    _update_hud()

func _show_overlay(title: String, body: String, button_text: String) -> void:
    overlay_title.text = title
    overlay_body.text = body
    overlay_button.text = button_text
    overlay.visible = true

func _on_overlay_button() -> void:
    if game_over:
        get_tree().reload_current_scene()
        return
    game_started = true
    overlay.visible = false
    player.global_position = Vector3(0, 0.05, 16)
    player.health = player.max_health
    player.ammo = player.magazine_size
    player.reserve_ammo = 72
    player.health_changed.emit(player.health, player.max_health)
    player.ammo_changed.emit(player.ammo, player.reserve_ammo)
    player.set_active(true)
    _spawn_enemies()
    Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _on_health_changed(current: int, maximum: int) -> void:
    if is_instance_valid(health_bar):
        health_bar.max_value = maximum
        health_bar.value = current

func _on_ammo_changed(current: int, reserve: int) -> void:
    if is_instance_valid(ammo_label):
        ammo_label.text = "AMMO  %02d / %02d" % [current, reserve]

func _on_kill() -> void:
    kills += 1
    _update_hud()

func _on_enemy_died(_enemy: Node3D) -> void:
    enemies_remaining = maxi(0, enemies_remaining - 1)
    _update_hud()
    if enemies_remaining <= 0 and game_started and not game_over:
        game_over = true
        game_started = false
        player.set_active(false)
        Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
        _show_overlay("MISSION COMPLETE", "訓練場已清空。\n擊殺數：%d / %d\n按下按鈕再次挑戰。" % [kills, total_enemies], "再次遊玩")

func _on_player_died() -> void:
    if game_over:
        return
    game_over = true
    game_started = false
    Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
    _show_overlay("MISSION FAILED", "生命值歸零。\n擊殺數：%d / %d\n調整戰術，再試一次。" % [kills, total_enemies], "重新開始")

func _update_hud() -> void:
    if is_instance_valid(status_label):
        status_label.text = "KILLS  %d / %d     HOSTILES  %d" % [kills, total_enemies, enemies_remaining]

func _notification(what: int) -> void:
    if what == NOTIFICATION_WM_CLOSE_REQUEST:
        Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
