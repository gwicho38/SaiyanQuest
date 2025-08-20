#ifndef RPG_SYSTEM_H
#define RPG_SYSTEM_H

#include "player.h"

u32 GetRequiredExp(u16 level);
void GainExperience(PlayerCharacter* player, u32 exp);

#endif // RPG_SYSTEM_H
