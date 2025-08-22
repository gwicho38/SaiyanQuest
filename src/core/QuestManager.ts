import { SaveManager } from './SaveManager';

export interface QuestStep {
	id: string;
	description: string;
	// optional condition keys for simple triggers
	requiresFlag?: string;
	setFlag?: string;
}

export interface QuestDefinition {
	id: string;
	title: string;
	description: string;
	steps: QuestStep[];
}

export class QuestManager {
	private saveManager: SaveManager;
	private quests: Map<string, QuestDefinition> = new Map();

	constructor(saveManager: SaveManager) {
		this.saveManager = saveManager;
	}

	public registerQuest(def: QuestDefinition): void {
		this.quests.set(def.id, def);
	}

	public startQuest(questId: string): void {
		const def = this.quests.get(questId);
		if (!def) return;
		const save = this.saveManager.getCurrentSave() || this.saveManager.createNewSave();
		save.progress.activeQuests = save.progress.activeQuests || {};
		if (!save.progress.activeQuests[questId]) {
			save.progress.activeQuests[questId] = { step: def.steps[0]?.id || 'start' };
			this.saveManager.saveGame(save);
			console.log(`Quest started: ${def.title}`);
		}
	}

	public getActiveStep(questId: string): QuestStep | null {
		const def = this.quests.get(questId);
		const save = this.saveManager.getCurrentSave();
		if (!def || !save || !save.progress.activeQuests) return null;
		const stepId = save.progress.activeQuests[questId]?.step;
		return def.steps.find(s => s.id === stepId) || null;
	}

	public completeQuest(questId: string): void {
		const def = this.quests.get(questId);
		const save = this.saveManager.getCurrentSave();
		if (!def || !save || !save.progress.activeQuests) return;
		delete save.progress.activeQuests[questId];
		save.progress.completedQuests.push(questId);
		this.saveManager.saveGame(save);
		console.log(`Quest completed: ${def.title}`);
	}

	public advanceStep(questId: string, nextStepId: string): void {
		const def = this.quests.get(questId);
		const save = this.saveManager.getCurrentSave();
		if (!def || !save || !save.progress.activeQuests) return;
		if (def.steps.find(s => s.id === nextStepId)) {
			save.progress.activeQuests[questId].step = nextStepId;
			this.saveManager.saveGame(save);
			console.log(`Quest '${questId}' advanced to step '${nextStepId}'`);
		}
	}
}

