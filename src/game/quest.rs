use super::player::PlayerCharacter;

#[derive(Clone, Copy, PartialEq)]
pub enum QuestStatus {
    Inactive,
    Active,
    Complete,
}

#[derive(Clone)]
pub struct Quest {
    pub id: u16,
    pub name: &'static str,
    pub description: &'static str,
    pub status: QuestStatus,
    pub required_item_id: u16,
    pub required_enemy_kills: u16,
    pub current_progress: u16,
    pub exp_reward: u32,
    pub item_reward: u16,
}

pub struct QuestManager {
    pub quests: [Option<Quest>; 32], // Maximum 32 quests
    pub active_quest_count: u8,
}

impl QuestManager {
    pub fn new() -> Self {
        let mut manager = Self {
            quests: [None; 32],
            active_quest_count: 0,
        };
        
        // Initialize main story quests following DBZ saga
        manager.add_quest(Quest {
            id: 1,
            name: "Rescue Gohan",
            description: "Save Gohan from Raditz",
            status: QuestStatus::Active,
            required_item_id: 0,
            required_enemy_kills: 1,
            current_progress: 0,
            exp_reward: 500,
            item_reward: 1, // Senzu Bean
        });
        
        manager.add_quest(Quest {
            id: 2,
            name: "Snake Way",
            description: "Reach King Kai's planet",
            status: QuestStatus::Inactive,
            required_item_id: 0,
            required_enemy_kills: 0,
            current_progress: 0,
            exp_reward: 1000,
            item_reward: 2, // Weighted Clothes
        });
        
        manager.add_quest(Quest {
            id: 3,
            name: "Defeat Nappa",
            description: "Stop the Saiyan warrior",
            status: QuestStatus::Inactive,
            required_item_id: 0,
            required_enemy_kills: 1,
            current_progress: 0,
            exp_reward: 2000,
            item_reward: 3, // Scouter
        });
        
        manager
    }
    
    fn add_quest(&mut self, quest: Quest) {
        for slot in &mut self.quests {
            if slot.is_none() {
                *slot = Some(quest);
                if quest.status == QuestStatus::Active {
                    self.active_quest_count += 1;
                }
                break;
            }
        }
    }
    
    pub fn update(&mut self, player: &mut PlayerCharacter) {
        // Check quest completion conditions
        for quest_slot in &mut self.quests {
            if let Some(quest) = quest_slot {
                if quest.status == QuestStatus::Active {
                    self.check_quest_completion(quest, player);
                }
            }
        }
    }
    
    fn check_quest_completion(&mut self, quest: &mut Quest, player: &mut PlayerCharacter) {
        let mut completed = false;
        
        match quest.id {
            1 => {
                // Rescue Gohan - completed when Raditz is defeated
                if quest.current_progress >= quest.required_enemy_kills {
                    completed = true;
                }
            }
            2 => {
                // Snake Way - completed when reaching a certain position or level
                if player.level >= 10 {
                    completed = true;
                }
            }
            3 => {
                // Defeat Nappa - completed when Nappa is defeated
                if quest.current_progress >= quest.required_enemy_kills {
                    completed = true;
                }
            }
            _ => {}
        }
        
        if completed {
            self.complete_quest(quest, player);
        }
    }
    
    fn complete_quest(&mut self, quest: &mut Quest, player: &mut PlayerCharacter) {
        quest.status = QuestStatus::Complete;
        self.active_quest_count -= 1;
        
        // Award experience
        crate::game::rpg::RpgSystem::gain_experience(player, quest.exp_reward);
        
        // Award item (simplified - in full implementation would add to inventory)
        // For now, just increase stats based on reward
        match quest.item_reward {
            1 => {
                // Senzu Bean - full heal
                player.current_hp = player.max_hp;
                player.current_ki = player.max_ki;
            }
            2 => {
                // Weighted Clothes - increase stats
                player.attack_power += 5;
                player.defense += 3;
            }
            3 => {
                // Scouter - increase detection abilities
                player.speed += 2;
            }
            _ => {}
        }
        
        // Activate next quest in chain
        self.activate_next_quest(quest.id);
    }
    
    fn activate_next_quest(&mut self, completed_quest_id: u16) {
        let next_quest_id = completed_quest_id + 1;
        
        for quest_slot in &mut self.quests {
            if let Some(quest) = quest_slot {
                if quest.id == next_quest_id && quest.status == QuestStatus::Inactive {
                    quest.status = QuestStatus::Active;
                    self.active_quest_count += 1;
                    break;
                }
            }
        }
    }
    
    pub fn progress_quest(&mut self, quest_id: u16, progress: u16) {
        for quest_slot in &mut self.quests {
            if let Some(quest) = quest_slot {
                if quest.id == quest_id && quest.status == QuestStatus::Active {
                    quest.current_progress += progress;
                    break;
                }
            }
        }
    }
    
    pub fn get_active_quests(&self) -> impl Iterator<Item = &Quest> {
        self.quests.iter()
            .filter_map(|q| q.as_ref())
            .filter(|q| q.status == QuestStatus::Active)
    }
}