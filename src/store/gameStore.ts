import { create } from "zustand";
type GameState={coins:number;dialogue:string|null;addCoin:()=>void;openDialogue:(text:string)=>void;closeDialogue:()=>void};
export const useGameStore=create<GameState>((set)=>({coins:0,dialogue:null,addCoin:()=>set(s=>({coins:s.coins+1})),openDialogue:text=>set({dialogue:text}),closeDialogue:()=>set({dialogue:null})}));