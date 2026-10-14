extends CharacterBody3D
class_name FPSPlayer

signal health_changed(current: int, maximum: int)
signal ammo_changed(current: int, reserve: int)
signal killed_enemy
signal player_died
signal reloaded

@export var walk_speed: float = 5.5
@export var sprint_speed: float = 8.0
@export var jump_velocity: float = 4.8
@export var mouse_sensitivity: float = 0.0018
@export var max_health: int = 100
@export var magazine_size: int = 12
@export var reserve_ammo: int = 72
@export var damage: int = 34
@export var fire_interval: float = 0.18

var health: int = 100
var ammo: int = 12
var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
var fire_cooldown := 0.0
var is_reloading := false
var is_active := false
var _reload_token := 0

@onready var head: Node3D = $Head
@onready var camera: Camera3D = $Head/Camera3D
@onready var gun: Node3D = $Head/WeaponPivot

func _ready() -> void:
    health = max_health
    ammo = magazine_size
    add_to_group("player")
    health_changed.emit(health, max_health)
    ammo_changed.emit(ammo, reserve_ammo)

func set_active(value: bool) -> void:
    is_active = value
    set_physics_process(value)
    set_process_input(value)

func _unhandled_input(event: InputEvent) -> void:
    if not is_active:
        return
    if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
        rotate_y(-event.relative.x * mouse_sensitivity)
        head.rotate_x(-event.relative.y * mouse_sensitivity)
        head.rotation.x = clamp(head.rotation.x, deg_to_rad(-85), deg_to_rad(85))
    elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
        shoot()
    elif event is InputEventKey and event.pressed and not event.echo:
        if event.keycode == KEY_R:
            reload_weapon()
        elif event.keycode == KEY_ESCAPE:
            Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

func _physics_process(delta: float) -> void:
    fire_cooldown = maxf(0.0, fire_cooldown - delta)
    if not is_on_floor():
        velocity.y -= gravity * delta
    elif Input.is_action_just_pressed("jump"):
        velocity.y = jump_velocity

    var input_dir := Input.get_vector("move_left", "move_right", "move_forward", "move_backward")
    var direction := (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
    var speed := sprint_speed if Input.is_key_pressed(KEY_SHIFT) else walk_speed
    if direction:
        velocity.x = direction.x * speed
        velocity.z = direction.z * speed
    else:
        velocity.x = move_toward(velocity.x, 0.0, walk_speed * 7.0 * delta)
        velocity.z = move_toward(velocity.z, 0.0, walk_speed * 7.0 * delta)
    move_and_slide()

func shoot() -> void:
    if not is_active or is_reloading or fire_cooldown > 0.0:
        return
    if ammo <= 0:
        reload_weapon()
        return
    ammo -= 1
    fire_cooldown = fire_interval
    ammo_changed.emit(ammo, reserve_ammo)
    gun.position.z = -0.42
    var tween := create_tween()
    tween.tween_property(gun, "position:z", -0.48, 0.08)

    var from := camera.global_position
    var to := from + (-camera.global_transform.basis.z * 100.0)
    var query := PhysicsRayQueryParameters3D.create(from, to)
    query.exclude = [self]
    query.collide_with_areas = true
    var hit := get_world_3d().direct_space_state.intersect_ray(query)
    if not hit.is_empty():
        var collider = hit.get("collider")
        if collider and collider.has_method("take_damage"):
            if collider.take_damage(damage):
                killed_enemy.emit()

func reload_weapon() -> void:
    if not is_active or is_reloading or ammo >= magazine_size or reserve_ammo <= 0:
        return
    is_reloading = true
    _reload_token += 1
    var token := _reload_token
    await get_tree().create_timer(1.15).timeout
    if not is_inside_tree() or token != _reload_token:
        return
    var needed := magazine_size - ammo
    var loaded := mini(needed, reserve_ammo)
    ammo += loaded
    reserve_ammo -= loaded
    is_reloading = false
    ammo_changed.emit(ammo, reserve_ammo)
    reloaded.emit()

func take_damage(amount: int) -> void:
    if health <= 0:
        return
    health = maxi(0, health - amount)
    health_changed.emit(health, max_health)
    if health <= 0:
        is_active = false
        set_physics_process(false)
        set_process_input(false)
        player_died.emit()
