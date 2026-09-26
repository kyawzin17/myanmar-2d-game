import { create } from "zustand";

type GameState = {
  coins: number;
  items: number;
  dialogue: string | null;
  dialogueName: string;
  nearNpc: string | null;
  questStarted: boolean;
  questComplete: boolean;
  addCoin: () => void;
  addItem: () => void;
  openDialogue: (name: string, text: string) => void;
  closeDialogue: () => void;
  setNearNpc: (id: string | null) => void;
  startQuest: () => void;
  completeQuest: () => void;
};

export const useGameStore = create<GameState>((set) => ({
  coins: 0,
  items: 0,
  dialogue: null,
  dialogueName: "ရွာသား",
  nearNpc: null,
  questStarted: false,
  questComplete: false,
  addCoin: () => set((state) => ({ coins: state.coins + 1 })),
  addItem: () => set((state) => ({ items: state.items + 1 })),
  openDialogue: (name, text) => set({ dialogue: text, dialogueName: name }),
  closeDialogue: () => set({ dialogue: null }),
  setNearNpc: (id) => set({ nearNpc: id }),
  startQuest: () => set({ questStarted: true }),
  completeQuest: () => set({ questComplete: true }),
}));