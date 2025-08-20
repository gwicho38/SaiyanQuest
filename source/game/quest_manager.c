#include "quest.h"

// Placeholder quest list
Quest main_quests[] = {
    {1, "Rescue Gohan", "Save Gohan from Raditz", QUEST_INACTIVE, 0, 1, 0, 500, 0},
    {2, "Snake Way", "Reach King Kai's planet", QUEST_INACTIVE, 0, 0, 0, 1000, 0},
};

const int NUM_MAIN_QUESTS = sizeof(main_quests) / sizeof(Quest);
