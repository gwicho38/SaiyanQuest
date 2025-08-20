#include "rpg_system.h"

u32 GetRequiredExp(u16 level) {
    return level * level * 100;
}

void GainExperience(PlayerCharacter* player, u32 exp) {
    player->experience += exp;
    while (player->experience >= GetRequiredExp(player->level + 1)) {
        player->level++;
        player->max_hp += 10 + (player->level * 2);
        player->max_ki += 5 + player->level;
        player->attack_power += 3;
        player->defense += 2;
        player->current_hp = player->max_hp;
        player->current_ki = player->max_ki;
    }
}
