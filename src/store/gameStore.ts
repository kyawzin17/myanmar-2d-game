import { create } from "zustand";

type GameState = {
  coins: number;
  dialogue: string | null;
  nearNpc: boolean;
  setNearNpc: (value: boolean) => void;
  addCoin: () => void;
  openDialogue: (text: string) => void;
  closeDialogue: () => void;
};

export const useGameStore = create<GameState>((set) => ({
  coins: 0,
  dialogue: null,
  nearNpc: false,
  setNearNpc: (value) => set({ nearNpc: value }),
  addCoin: () => set((state) => ({ coins: state.coins + 1 })),
  openDialogue: (text) => set({ dialogue: text }),
  closeDialogue: () => set({ dialogue: null }),
}));