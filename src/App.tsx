import { useEffect } from "react";
import Phaser from "phaser";
import { gameConfig } from "./game/config/gameConfig";
import { useGameStore } from "./store/gameStore";

export default function App() {
  const coins = useGameStore((s) => s.coins);
  const items = useGameStore((s) => s.items);
  const dialogue = useGameStore((s) => s.dialogue);
  const dialogueName = useGameStore((s) => s.dialogueName);
  const nearNpc = useGameStore((s) => s.nearNpc);
  const questStarted = useGameStore((s) => s.questStarted);
  const questComplete = useGameStore((s) => s.questComplete);
  const closeDialogue = useGameStore((s) => s.closeDialogue);

  useEffect(() => {
    const game = new Phaser.Game(gameConfig);
    return () => game.destroy(true);
  }, []);

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">MM</span>
          <div><strong>MYANMAR 2D</strong><small>Village Adventure · v0.0.3</small></div>
        </div>
        <div className="stats">
          <div className="stat"><span>🪙</span><b>{coins}</b><small>Coins</small></div>
          <div className="stat"><span>🎒</span><b>{items}</b><small>Items</small></div>
          <div className="stat"><span>📜</span><b>{questComplete ? "✓" : questStarted ? "1" : "—"}</b><small>Quest</small></div>
        </div>
      </header>

      <section className="game-card">
        <div id="game-container" />
        <div className="controls">
          <span><kbd>WASD</kbd> Move</span><span><kbd>E</kbd> Interact</span><span><kbd>ESC</kbd> Close</span>
        </div>
        {nearNpc && !dialogue && <div className="interact">Press <kbd>E</kbd> to interact</div>}
      </section>

      <footer className="footer">
        <span>v0.0.3 · Explore · Collect · Talk · Quest</span>
        <span>Find the village elder to start your first quest.</span>
      </footer>

      {dialogue && (
        <div className="dialogue-backdrop" onClick={closeDialogue}>
          <div className="dialogue" onClick={(event) => event.stopPropagation()}>
            <div className="dialogue-avatar">{dialogueName === "အဘိုး" ? "👴🏻" : "🧑🏻"}</div>
            <div className="dialogue-content">
              <div className="dialogue-name">{dialogueName}</div>
              <p>{dialogue}</p>
              <button onClick={closeDialogue}>Continue <span>↵</span></button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}