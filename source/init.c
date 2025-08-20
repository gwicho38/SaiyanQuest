#include <gba.h>

// Simple initialization function implementations for GBA

void InitVideo(void) {
    // Set up video mode - Mode 0 with background and sprites enabled
    REG_DISPCNT = MODE_0 | BG0_ON | BG1_ON | OBJ_ON;
}

void InitSprites(void) {
    // Basic sprite initialization
    // Clear OAM (Object Attribute Memory)
    for (int i = 0; i < 128; i++) {
        OAM[i].attr0 = ATTR0_DISABLED;
        OAM[i].attr1 = 0;
        OAM[i].attr2 = 0;
    }
}

void InitBackgrounds(void) {
    // Basic background initialization
    // Set up background control registers
    REG_BG0CNT = BG_SIZE_0 | BG_256_COLOR | CHAR_BASE(0) | SCREEN_BASE(28);
    REG_BG1CNT = BG_SIZE_0 | BG_256_COLOR | CHAR_BASE(1) | SCREEN_BASE(29);
}

void InitAudio(void) {
    // Basic audio initialization
    // Enable sound
    REG_SOUNDCNT_X = SNDSTAT_ENABLE;
    REG_SOUNDCNT_H = SNDA_VOL_100 | SNDB_VOL_100 | SNDA_L_ENABLE | SNDA_R_ENABLE | 
                     SNDB_L_ENABLE | SNDB_R_ENABLE;
    REG_SOUNDCNT_L = 0x7777; // Enable all channels at max volume
}

void InitInput(void) {
    // Input initialization is mostly handled by libgba's scanKeys()
    // This is a placeholder for any input-related setup
}