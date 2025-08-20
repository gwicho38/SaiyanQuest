pub mod player;
pub mod combat;
pub mod rpg;
pub mod quest;

use agb::{Gba, input::Button};
use player::PlayerCharacter;
use combat::CombatSystem;
use rpg::RpgSystem;
use quest::QuestManager;

pub struct GameState {
    pub player: PlayerCharacter,
    pub combat_system: CombatSystem,
    pub rpg_system: RpgSystem,
    pub quest_manager: QuestManager,
    pub frame_counter: u32,
}

impl GameState {
    pub fn new(gba: &mut Gba) -> Self {
        // Initialize display and objects
        let (_objects, _) = gba.display.object.get_object_manager();
        
        Self {
            player: PlayerCharacter::new(),
            combat_system: CombatSystem::new(),
            rpg_system: RpgSystem::new(),
            quest_manager: QuestManager::new(),
            frame_counter: 0,
        }
    }
    
    pub fn update(&mut self, gba: &mut Gba) {
        self.frame_counter = self.frame_counter.wrapping_add(1);
        
        // Handle input
        let input = gba.input.read();
        
        // Update player
        self.player.update(&input);
        
        // Update combat system
        if input.just_pressed(Button::A) {
            self.combat_system.process_attack(&mut self.player);
        }
        
        // Update RPG systems
        self.rpg_system.update(&mut self.player);
        
        // Update quest system
        self.quest_manager.update(&mut self.player);
    }
}