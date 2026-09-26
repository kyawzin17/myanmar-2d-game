import { useEffect } from "react";
import Phaser from "phaser";
import { gameConfig } from "./game/config/gameConfig";
import { useGameStore } from "./store/gameStore";

export default function App() {
  const coins = useGameStore((s) => s.coins);
  const loot = useGameStore((s) => s.loot);
  const phase = useGameStore((s) => s.phase);
  const raidTimeLeft = useGameStore((s) => s.raidTimeLeft);
  const inventory = useGameStore((s) => s.inventory);
  const inventoryOpen = useGameStore((s) => s.inventoryOpen);
  const questOpen = useGameStore((s) => s.questOpen);
  const questStarted = useGameStore((s) => s.questStarted);
  const questComplete = useGameStore((s) => s.questComplete);
  const villageLevel = useGameStore((s) => s.villageLevel);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const dialogue = useGameStore((s) => s.dialogue);
  const dialogueName = useGameStore((s) => s.dialogueName);
  const nearLoot = useGameStore((s) => s.nearLoot);
  const toggleInventory = useGameStore((s) => s.toggleInventory);
  const toggleQuest = useGameStore((s) => s.toggleQuest);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const buildVillage = useGameStore((s) => s.buildVillage);
  const closeDialogue = useGameStore((s) => s.closeDialogue);

  useEffect(() => {
    const game = new Phaser.Game(gameConfig);
    return () => game.destroy(true);
  }, []);

  const phaseLabel = phase === "raid" ? "🌙 NIGHT RAID" : phase === "returning" ? "🐎 RETURNING" : "🏠 YOUR VILLAGE";

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">MM</span>
          <div><strong>MYANMAR 2D</strong><small>Night Thief · Village Builder · v0.0.4</small></div>
        </div>
        <div className="top-actions">
          <button className="ui-btn" onClick={toggleInventory}>🎒 Inventory</button>
          <button className="ui-btn" onClick={toggleQuest}>📜 Quest</button>
          <button className="ui-btn" onClick={toggleSound}>{soundEnabled ? "🔊" : "🔇"}</button>
        </div>
        <div className="stats">
          <div className="stat"><span>🪙</span><b>{coins}</b><small>Money</small></div>
          <div className="stat"><span>💰</span><b>{loot}</b><small>Loot</small></div>
          <div className="stat"><span>🏘️</span><b>Lv.{villageLevel}</b><small>Village</small></div>
        </div>
      </header>

      <section className="game-card">
        <div id="game-container" />
        <div className="controls">
          <span><kbd>WASD</kbd> Move</span><span><kbd>E</kbd> Raid / Loot</span><span><kbd>ESC</kbd> Close</span>
        </div>
        {nearLoot && phase === "raid" && <div className="interact">Press <kbd>E</kbd> to steal loot</div>}
        {phase === "raid" && <div className="raid-banner">⏱ {raidTimeLeft}s — Get as much loot as you can!</div>}
      </section>

      <footer className="footer">
        <span>{phaseLabel}</span>
        <span>60 seconds outside → horse ride home → build your village</span>
      </footer>

      {inventoryOpen && (
        <aside className="side-panel">
          <div className="panel-head"><div><b>🎒 Inventory</b><small>ဒီညရထားတဲ့ပစ္စည်းများ</small></div><button onClick={toggleInventory}>×</button></div>
          <div className="inventory-grid">
            {inventory.map((item) => (
              <div className="inventory-item" key={item.id}>
                <span>{item.icon}</span><div><b>{item.name}</b><small>x{item.amount} · value {item.value}</small></div>
              </div>
            ))}
          </div>
          <div className="panel-total">Total money <b>{coins}</b> 🪙</div>
        </aside>
      )}

      {questOpen && (
        <aside className="quest-panel">
          <div className="panel-head"><div><b>📜 Quest</b><small>Night raid objective</small></div><button onClick={toggleQuest}>×</button></div>
          <div className="quest-card">
            <div className="quest-title">🌙 ညဘက် စုဆောင်းမယ်</div>
            <p>၁ မိနစ်အတွင်း အိမ်နီးချင်းရွာနဲ့ မြို့ထဲက loot တွေကို တတ်နိုင်သလောက် စုဆောင်းပါ။</p>
            <div className={questStarted ? "quest-row done" : "quest-row"}><span>{questStarted ? "✓" : "1"}</span> ညဘက်ခိုးထွက်</div>
            <div className={questComplete ? "quest-row done" : "quest-row"}><span>{questComplete ? "✓" : "2"}</span> ရွာကို ပြန်ရောက်</div>
            <div className="quest-reward">Reward: village money + building progress</div>
          </div>
          <div className="build-box">
            <div><b>🏘️ ရွာတည်ဆောက်</b><small>Level {villageLevel} → {Math.min(5, villageLevel + 1)}</small></div>
            <button disabled={villageLevel >= 5 || coins < (villageLevel + 1) * 5} onClick={buildVillage}>
              {villageLevel >= 5 ? "MAX" : `Build · ${(villageLevel + 1) * 5} 🪙`}
            </button>
          </div>
        </aside>
      )}

      {dialogue && (
        <div className="dialogue-backdrop" onClick={closeDialogue}>
          <div className="dialogue" onClick={(event) => event.stopPropagation()}>
            <div className="dialogue-avatar">{dialogueName === "ရွာသူကြီး" ? "👴🏻" : "🧑🏻"}</div>
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