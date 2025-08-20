#include <gba_input.h>
#include "player.h"

void UpdatePlayer(PlayerCharacter* player, u16 keys_held, u16 keys_pressed) {
    (void)keys_pressed;
    // Simple movement placeholder
    if (keys_held & KEY_UP)    player->y -= 1;
    if (keys_held & KEY_DOWN)  player->y += 1;
    if (keys_held & KEY_LEFT)  player->x -= 1;
    if (keys_held & KEY_RIGHT) player->x += 1;
}
