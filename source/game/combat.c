#include <gba_input.h>
#include "combat.h"

#define COMBO_WINDOW_FRAMES 20

void CheckEnemyHits(int x, int y, int damage) {
    (void)x; (void)y; (void)damage; // placeholder
}

void ProcessMeleeAttack(PlayerCharacter* player, u16 keys_pressed) {
    static int combo_timer = 0;
    if (keys_pressed & KEY_A) {
        if (player->combo_counter < 3 && combo_timer > 0) {
            player->combo_counter++;
        } else {
            player->combo_counter = 1;
        }
        CheckEnemyHits(player->x, player->y, player->attack_power * player->combo_counter);
        combo_timer = COMBO_WINDOW_FRAMES;
    }
    if (combo_timer > 0) combo_timer--;
}
