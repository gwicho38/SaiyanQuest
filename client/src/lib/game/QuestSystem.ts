export interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  isCompleted: boolean;
  isActive: boolean;
  requiredLevel?: number;
  prerequisites?: string[]; // Quest IDs that must be completed first
}

export interface QuestObjective {
  id: string;
  description: string;
  type: 'kill' | 'collect' | 'talk' | 'reach' | 'survive';
  target?: string;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
}

export interface QuestReward {
  type: 'experience' | 'health' | 'energy' | 'ability';
  amount?: number;
  abilityId?: string;
}

export class QuestSystem {
  private static instance: QuestSystem;
  private quests: Map<string, Quest> = new Map();
  private activeQuests: Set<string> = new Set();

  static getInstance(): QuestSystem {
    if (!this.instance) {
      this.instance = new QuestSystem();
    }
    return this.instance;
  }

  constructor() {
    this.initializeQuests();
  }

  private initializeQuests(): void {
    // Starting quest - retrieve dirty magazines for Master Roshi
    this.addQuest({
      id: 'dirty_magazines',
      title: 'Master Roshi\'s Request',
      description: 'Find 3 dirty magazines for Master Roshi at Kame House.',
      objectives: [
        {
          id: 'collect_magazines',
          description: 'Collect 3 dirty magazines',
          type: 'collect',
          target: 'dirty_magazine',
          targetCount: 3,
          currentCount: 0,
          isCompleted: false
        }
      ],
      rewards: [
        {
          type: 'experience',
          amount: 50
        }
      ],
      isCompleted: false,
      isActive: true
    });

    // Bridge building quest
    this.addQuest({
      id: 'build_bridge',
      title: 'Help the Old Man',
      description: 'Collect stones to help the old man build a bridge.',
      objectives: [
        {
          id: 'collect_stones',
          description: 'Collect 5 stones',
          type: 'collect',
          target: 'stone',
          targetCount: 5,
          currentCount: 0,
          isCompleted: false
        }
      ],
      rewards: [
        {
          type: 'experience',
          amount: 75
        }
      ],
      isCompleted: false,
      isActive: false,
      prerequisites: ['dirty_magazines']
    });

    // Solar Flare learning quest
    this.addQuest({
      id: 'learn_solar_flare',
      title: 'Master the Solar Flare',
      description: 'Help villagers and learn the Solar Flare technique.',
      objectives: [
        {
          id: 'find_sue',
          description: 'Find Sue',
          type: 'talk',
          target: 'sue',
          targetCount: 1,
          currentCount: 0,
          isCompleted: false
        },
        {
          id: 'get_flowers',
          description: 'Get flowers for the girl',
          type: 'collect',
          target: 'flowers',
          targetCount: 1,
          currentCount: 0,
          isCompleted: false
        }
      ],
      rewards: [
        {
          type: 'ability',
          abilityId: 'solar_flare'
        },
        {
          type: 'experience',
          amount: 100
        }
      ],
      isCompleted: false,
      isActive: false,
      prerequisites: ['build_bridge']
    });
  }

  addQuest(quest: Quest): void {
    this.quests.set(quest.id, quest);
    if (quest.isActive) {
      this.activeQuests.add(quest.id);
    }
  }

  activateQuest(questId: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest) return false;

    // Check prerequisites
    if (quest.prerequisites) {
      for (const prereq of quest.prerequisites) {
        const prereqQuest = this.quests.get(prereq);
        if (!prereqQuest || !prereqQuest.isCompleted) {
          console.log(`Cannot activate quest ${questId}: prerequisite ${prereq} not completed`);
          return false;
        }
      }
    }

    quest.isActive = true;
    this.activeQuests.add(questId);
    console.log(`Quest activated: ${quest.title}`);
    return true;
  }

  updateObjective(questId: string, objectiveId: string, progress: number = 1): boolean {
    const quest = this.quests.get(questId);
    if (!quest || !quest.isActive) return false;

    const objective = quest.objectives.find(obj => obj.id === objectiveId);
    if (!objective || objective.isCompleted) return false;

    objective.currentCount = Math.min(objective.currentCount + progress, objective.targetCount);
    
    if (objective.currentCount >= objective.targetCount) {
      objective.isCompleted = true;
      console.log(`Objective completed: ${objective.description}`);
    }

    // Check if all objectives are completed
    if (quest.objectives.every(obj => obj.isCompleted)) {
      this.completeQuest(questId);
    }

    return true;
  }

  completeQuest(questId: string): void {
    const quest = this.quests.get(questId);
    if (!quest) return;

    quest.isCompleted = true;
    quest.isActive = false;
    this.activeQuests.delete(questId);

    console.log(`Quest completed: ${quest.title}`);

    // Grant rewards
    // Note: This would integrate with the player store to actually grant rewards
    quest.rewards.forEach(reward => {
      console.log(`Reward granted: ${reward.type} ${reward.amount || reward.abilityId}`);
    });

    // Check for follow-up quests
    this.checkForNewQuests();
  }

  private checkForNewQuests(): void {
    for (const [questId, quest] of this.quests) {
      if (!quest.isActive && !quest.isCompleted) {
        if (!quest.prerequisites || quest.prerequisites.every(prereq => {
          const prereqQuest = this.quests.get(prereq);
          return prereqQuest && prereqQuest.isCompleted;
        })) {
          this.activateQuest(questId);
        }
      }
    }
  }

  getActiveQuests(): Quest[] {
    return Array.from(this.activeQuests).map(id => this.quests.get(id)!).filter(Boolean);
  }

  getQuest(questId: string): Quest | undefined {
    return this.quests.get(questId);
  }

  getAllQuests(): Quest[] {
    return Array.from(this.quests.values());
  }
}
