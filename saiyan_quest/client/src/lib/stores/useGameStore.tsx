import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GamePhase = "menu" | "playing" | "paused" | "gameOver";

interface GameState {
  gamePhase: GamePhase;
  currentArea: string;
  showDialogue: boolean;
  dialogueText: string;
  dialogueCharacter?: string;
  
  // Actions
  setGamePhase: (phase: GamePhase) => void;
  setCurrentArea: (area: string) => void;
  showDialogueBox: (text: string, character?: string) => void;
  hideDialogue: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set) => ({
    gamePhase: "playing",
    currentArea: "kame_house",
    showDialogue: false,
    dialogueText: "",
    dialogueCharacter: undefined,
    
    setGamePhase: (phase) => set({ gamePhase: phase }),
    
    setCurrentArea: (area) => set({ currentArea: area }),
    
    showDialogueBox: (text, character) => set({ 
      showDialogue: true, 
      dialogueText: text, 
      dialogueCharacter: character 
    }),
    
    hideDialogue: () => set({ 
      showDialogue: false, 
      dialogueText: "", 
      dialogueCharacter: undefined 
    }),
    
    resetGame: () => set({
      gamePhase: "playing",
      currentArea: "kame_house",
      showDialogue: false,
      dialogueText: "",
      dialogueCharacter: undefined
    })
  }))
);
