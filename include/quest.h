#ifndef QUEST_H
#define QUEST_H

#include <gba_types.h>

typedef enum {
    QUEST_INACTIVE,
    QUEST_ACTIVE,
    QUEST_COMPLETE
} QuestStatus;

typedef struct {
    u16 id;
    char name[64];
    char description[256];
    QuestStatus status;
    u16 required_item_id;
    u16 required_enemy_kills;
    u16 current_progress;
    u32 exp_reward;
    u16 item_reward;
} Quest;

#endif // QUEST_H
