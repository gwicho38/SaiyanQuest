#ifndef PLAYER_H
#define PLAYER_H

#include <gba_types.h>

#define MAX_ABILITIES 16

typedef struct {
    u16 level;
    u32 experience;
    u16 max_hp;
    u16 current_hp;
    u16 max_ki;
    u16 current_ki;
    u16 attack_power;
    u16 defense;
    u16 speed;
    // Position and movement
    s32 x, y; // fixed-point not implemented yet
    s32 velocity_x, velocity_y;
    u8 direction;
    u8 animation_frame;
    // Combat
    u8 current_attack;
    u8 combo_counter;
    u16 invulnerability_timer;
    // Abilities
    u16 abilities[MAX_ABILITIES];
    u8 transformation_level;
} PlayerCharacter;

void UpdatePlayer(PlayerCharacter* player, u16 keys_held, u16 keys_pressed);

#endif // PLAYER_H
