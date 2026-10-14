extends CharacterBody3D
class_name FPSEnemy

signal died(enemy: Node3D)

@export var max_health: int = 100
@export var move_speed: float = 2.5
@export var attack_range: float = 1.7
@export var attack_damage: int = 10
@export var attack_cooldown: float = 1.1

var health: int = 100
var target: Node3D
var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
var attack_timer := 0.0
var alive := true

func _ready() -> void:
    health = max_health
    add_to_group("enemies")
    var body_material := StandardMaterial3D.new()
    body_material.albedo_color = Color(0.68, 0.16, 0.12)
    body_material.metallic = 0.25
    $Body.material_override = body_material
    var eye_material := StandardMaterial3D.new()
    eye_material.albedo_color = Color(1.0, 0.18, 0.08)
    eye_material.emission_enabled = true
    eye_material.emission = Color(1.0, 0.05, 0.02)
    eye_material.emission_energy_multiplier = 2.0
    $EyeGlow.material_override = eye_material

func _physics_process(delta: float) -> void:
    if not alive:
        return
    attack_timer = maxf(0.0, attack_timer - delta)
    if not is_on_floor():
        velocity.y -= gravity * delta
    if not is_instance_valid(target):
        var players := get_tree().get_nodes_in_group("player")
        if not players.is_empty():
            target = players[0]
    if is_instance_valid(target):
        var offset: Vector3 = target.global_position - global_position
        var flat := Vector3(offset.x, 0, offset.z)
        if flat.length() > attack_range:
            var direction := flat.normalized()
            velocity.x = direction.x * move_speed
            velocity.z = direction.z * move_speed
            if flat.length() > 0.1:
                look_at(Vector3(target.global_position.x, global_position.y, target.global_position.z), Vector3.UP)
        else:
            velocity.x = move_toward(velocity.x, 0.0, move_speed * 5.0 * delta)
            velocity.z = move_toward(velocity.z, 0.0, move_speed * 5.0 * delta)
            if attack_timer <= 0.0 and target.has_method("take_damage"):
                target.take_damage(attack_damage)
                attack_timer = attack_cooldown
    move_and_slide()

func take_damage(amount: int) -> bool:
    if not alive:
        return false
    health -= amount
    var body := get_node_or_null("Body")
    if body:
        var material := body.material_override as StandardMaterial3D
        if material:
            material.albedo_color = Color(1.0, 0.45, 0.12)
            var tween := create_tween()
            tween.tween_property(material, "albedo_color", Color(0.68, 0.16, 0.12), 0.15)
    if health <= 0:
        alive = false
        died.emit(self)
        queue_free()
        return true
    return false
