# Myanmar 2D Game

Playable **v0.0.4** prototype built with React + TypeScript + Phaser.

## Core game idea

You play as a fictional Myanmar village thief. Your home village is small, so at night you ride out to nearby villages and a town, collect as much loot as possible in **60 seconds**, then automatically ride a horse back home. Your earnings can be used to grow and upgrade your village.

## v0.0.4

- Tiled-style JSON tilemap + external tileset
- Real SVG sprite-sheet loading and frame animation for the thief
- Horse sprite-sheet animation for the return trip
- Day/home phase and night raid phase
- **60-second raid timer**
- Multiple raid areas: neighboring village + town
- Loot interaction with **E**
- Inventory UI with rice, cloth, gems, medicine and coins
- Quest UI
- Village level and building progression
- Horse return animation after the timer ends
- Synthesized sound effects for raid, loot and return events
- React + Zustand + Phaser state sharing
- Camera follow, map collision and building collision
- Responsive HUD

## Controls

- **WASD / Arrow Keys** — move
- **E** — start the night raid near the horse / collect loot
- **ESC** — close dialogue

## Gameplay loop

1. Start in your own village.
2. Walk to the horse and press **E**.
3. The world becomes night and a **60-second timer** begins.
4. Travel to the neighboring village and town.
5. Press **E** near loot to collect it.
6. When the timer reaches zero, the horse automatically carries you home.
7. Open **Inventory** to inspect loot.
8. Open **Quest** to see objectives and use money to upgrade your village.

## Run

```bash
npm install
npm run dev
```

## Roadmap

**v0.0.5:** guards / stealth detection, more houses, stronger sprite sheets, music, save/load.

**v0.1.0:** multiple nights, procedural village upgrades, shops, NPC relationships, more maps, mobile controls and persistent save data.
