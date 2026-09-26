import { useEffect } from "react";
import Phaser from "phaser";
import { gameConfig } from "./game/config/gameConfig";
import { useGameStore } from "./store/gameStore";

export default function App() {
  const coins = useGameStore((state) => state.coins);
  const dialogue = useGameStore((state) => state.dialogue);
  const nearNpc = useGameStore((state) => state.nearNpc);
  const closeDialogue = useGameStore((state) => state.closeDialogue);

  useEffect(() => {
    const game = new Phaser.Game(gameConfig);
    return () => game.destroy(true);
  }, []);

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">MM</span>
          <div>
            <strong>MYANMAR 2D</strong>
            <small>Village Adventure · v0.0.2</small>
          </div>
        </div>
        <div className="stats">
          <div className="stat"><span>🪙</span><b>{coins}</b><small>Coins</small></div>
          <div className="stat"><span>🌿</span><b>1</b><small>Village</small></div>
        </div>
      </header>

      <section className="game-card">
        <div id="game-container" />
        <div className="controls">
          <span><kbd>WASD</kbd> Move</span>
          <span><kbd>E</kbd> Talk</span>
          <span><kbd>ESC</kbd> Close</span>
        </div>
        {nearNpc && !dialogue && <div className="interact">Press <kbd>E</kbd> to talk</div>}
      </section>

      <footer className="footer">
        <span>Prototype · Built with React + TypeScript + Phaser</span>
        <span>Explore the village and collect all 8 coins.</span>
      </footer>

      {dialogue && (
        <div className="dialogue-backdrop" onClick={closeDialogue}>
          <div className="dialogue" onClick={(event) => event.stopPropagation()}>
            <div className="dialogue-avatar">🧑🏻</div>
            <div className="dialogue-content">
              <div className="dialogue-name">ရွာသား</div>
              <p>{dialogue}</p>
              <button onClick={closeDialogue}>Continue <span>↵</span></button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}