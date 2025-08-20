#include <gba.h>
#include "player.h"
#include "rpg_system.h"

// Basic game state
volatile u16 frame_counter = 0;

void VBlankHandler(void) {
    frame_counter++;
}

int main(void) {
    // Initialize hardware
    irqInit();
    irqSet(IRQ_VBLANK, VBlankHandler);
    irqEnable(IRQ_VBLANK);

    // Initialize systems
    InitVideo();
    InitSprites();
    InitBackgrounds();
    InitAudio();
    InitInput();

    // Load initial game state
    PlayerCharacter player = {0};
    player.level = 1;
    player.max_hp = player.current_hp = 100;
    player.max_ki = player.current_ki = 50;

    while (1) {
        scanKeys();
        u16 keys_held = keysHeld();
        u16 keys_pressed = keysDown();

        UpdatePlayer(&player, keys_held, keys_pressed);
        GainExperience(&player, 0); // placeholder call

        VBlankIntrWait();
    }

    return 0;
}
