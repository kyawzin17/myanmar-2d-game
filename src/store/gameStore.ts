import { create } from "zustand";

export type GamePhase = "home" | "raid" | "returning" | "village";
export type InventoryItem = { id: string; name: string; icon: string; amount: number; value: number };

type GameState = {
  coins: number;
  items: number;
  loot: number;
  raidTimeLeft: number;
  phase: GamePhase;
  questStarted: boolean;
  questComplete: boolean;
  inventoryOpen: boolean;
  questOpen: boolean;
  soundEnabled: boolean;
  villageLevel: number;
  dialogue: string | null;
  dialogueName: string;
  nearNpc: string | null;
  nearLoot: string | null;
  inventory: InventoryItem[];
  addCoin: () => void;
  addLoot: (amount: number, item: InventoryItem) => void;
  addItem: () => void;
  startRaid: () => void;
  setRaidTimeLeft: (seconds: number) => void;
  finishRaid: () => void;
  finishReturn: () => void;
  buildVillage: () => void;
  openDialogue: (name: string, text: string) => void;
  closeDialogue: () => void;
  setNearNpc: (id: string | null) => void;
  setNearLoot: (id: string | null) => void;
  startQuest: () => void;
  completeQuest: () => void;
  toggleInventory: () => void;
  toggleQuest: () => void;
  toggleSound: () => void;
};

const initialInventory: InventoryItem[] = [
  { id: "coin", name: "ရွှေဒင်္ဂါး", icon: "🪙", amount: 0, value: 1 },
  { id: "rice", name: "ဆန်အိတ်", icon: "🌾", amount: 0, value: 12 },
  { id: "cloth", name: "အထည်", icon: "🧵", amount: 0, value: 18 },
  { id: "gem", name: "ကျောက်မျက်", icon: "💎", amount: 0, value: 45 },
  { id: "medicine", name: "ဆေးဝါး", icon: "🧪", amount: 0, value: 25 },
];

export const useGameStore = create<GameState>((set) => ({
  coins: 0,
  items: 0,
  loot: 0,
  raidTimeLeft: 60,
  phase: "home",
  questStarted: false,
  questComplete: false,
  inventoryOpen: false,
  questOpen: true,
  soundEnabled: true,
  villageLevel: 1,
  dialogue: null,
  dialogueName: "ရွာသား",
  nearNpc: null,
  nearLoot: null,
  inventory: initialInventory,
  addCoin: () => set((state) => ({ coins: state.coins + 1, loot: state.loot + 1 })),
  addLoot: (amount, item) => set((state) => ({
    loot: state.loot + amount,
    inventory: state.inventory.map((entry) => entry.id === item.id ? { ...entry, amount: entry.amount + 1 } : entry),
  })),
  addItem: () => set((state) => ({ items: state.items + 1 })),
  startRaid: () => set({ phase: "raid", raidTimeLeft: 60 }),
  setRaidTimeLeft: (seconds) => set({ raidTimeLeft: seconds }),
  finishRaid: () => set({ phase: "returning", raidTimeLeft: 0 }),
  finishReturn: () => set({ phase: "village" }),
  buildVillage: () => set((state) => {
    const nextLevel = Math.min(5, state.villageLevel + 1);
    return state.coins >= nextLevel * 5 ? { coins: state.coins - nextLevel * 5, villageLevel: nextLevel } : state;
  }),
  openDialogue: (name, text) => set({ dialogue: text, dialogueName: name }),
  closeDialogue: () => set({ dialogue: null }),
  setNearNpc: (id) => set({ nearNpc: id }),
  setNearLoot: (id) => set({ nearLoot: id }),
  startQuest: () => set({ questStarted: true }),
  completeQuest: () => set({ questComplete: true }),
  toggleInventory: () => set((state) => ({ inventoryOpen: !state.inventoryOpen })),
  toggleQuest: () => set((state) => ({ questOpen: !state.questOpen })),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
}));