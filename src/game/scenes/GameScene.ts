import Phaser from "phaser";
import { useGameStore } from "../../store/gameStore";

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1500;

type NpcData = { id: string; name: string; x: number; y: number; color: number; dialogue: string };

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private coins!: Phaser.Physics.Arcade.Group;
  private items!: Phaser.Physics.Arcade.Group;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private npcs: Array<{ data: NpcData; sprite: Phaser.Physics.Arcade.Sprite; prompt: Phaser.GameObjects.Text }> = [];

  constructor() { super("GameScene"); }

  create() {
    this.makeTextures();
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.drawWorld();
    this.obstacles = this.physics.add.staticGroup();

    this.createObstacle(1200, 280, 280, 220);
    this.createObstacle(1780, 780, 190, 160);
    this.createObstacle(360, 260, 170, 120);

    this.player = this.physics.add.sprite(500, 650, "player-1").setDepth(20);
    this.player.setCollideWorldBounds(true).setDrag(850, 850).setMaxVelocity(180, 180);
    this.player.setBodySize(24, 34).setOffset(12, 20);

    this.physics.add.collider(this.player, this.obstacles);

    this.createNpc({ id: "elder", name: "အဘိုး", x: 900, y: 520, color: 0x8b5cf6, dialogue: "မြေးလေးရေ၊ ရွာထဲက ရွှေ Coin ၅ ခုကို စုဆောင်းပြီး ငါ့ဆီ ပြန်လာခဲ့ပါ။" });
    this.createNpc({ id: "farmer", name: "လယ်သမား", x: 1540, y: 980, color: 0x16a34a, dialogue: "ဒီဘက်က လယ်ကွင်းတွေကို သတိထားပြီး ဖြတ်သွားနော်။" });
    this.createNpc({ id: "child", name: "ကလေး", x: 680, y: 1030, color: 0xea580c, dialogue: "ရေကန်ဘက်မှာ Item လေးတွေ တွေ့တယ်လို့ ကြားတယ်!" });

    this.coins = this.physics.add.group();
    [[650,700],[820,720],[990,720],[1120,650],[1500,600],[1650,900],[480,900],[1050,1000]].forEach(([x,y],i) => {
      const coin = this.coins.create(x,y,"coin").setDepth(12) as Phaser.Physics.Arcade.Sprite;
      coin.setCircle(12,12,12);
      this.tweens.add({ targets: coin, y: y - 8, duration: 600 + i * 30, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      this.tweens.add({ targets: coin, angle: 360, duration: 1800, repeat: -1, ease: "Linear" });
    });
    this.physics.add.overlap(this.player, this.coins, (_p, object) => {
      const coin = object as Phaser.Physics.Arcade.Sprite;
      if (!coin.active) return;
      this.tweens.add({ targets: coin, scale: 1.7, alpha: 0, duration: 160, onComplete: () => coin.disableBody(true, true) });
      useGameStore.getState().addCoin();
    });

    this.items = this.physics.add.group();
    [[420,1080],[1330,1030],[1880,560]].forEach(([x,y],i) => {
      const item = this.items.create(x,y,"leaf").setDepth(12) as Phaser.Physics.Arcade.Sprite;
      item.setCircle(10,14,14);
      this.tweens.add({ targets: item, y: y - 7, duration: 700 + i * 80, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    });
    this.physics.add.overlap(this.player, this.items, (_p, object) => {
      const item = object as Phaser.Physics.Arcade.Sprite;
      if (!item.active) return;
      item.disableBody(true, true);
      useGameStore.getState().addItem();
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D,E,ESC") as Record<string, Phaser.Input.Keyboard.Key>;

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.setDeadzone(130, 85);

    this.add.text(28, 28, "MYANMAR 2D  •  V0.0.3", {
      fontFamily: "Arial", fontSize: "15px", color: "#eaf6ff",
      backgroundColor: "#07141ed9", padding: { x: 10, y: 7 }
    }).setScrollFactor(0).setDepth(50);

    this.events.on("shutdown", () => useGameStore.getState().setNearNpc(null));
  }

  update() {
    const state = useGameStore.getState();
    if (state.dialogue) {
      this.player.setVelocity(0, 0);
      if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) state.closeDialogue();
      return;
    }

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;
    let x = Number(right) - Number(left);
    let y = Number(down) - Number(up);

    if (x || y) {
      const len = Math.hypot(x, y);
      x /= len; y /= len;
      this.player.setVelocity(x * 175, y * 175);
      this.player.anims.play(x < 0 ? "walk-left" : "walk-right", true);
    } else {
      this.player.setVelocity(0, 0);
      this.player.anims.stop();
    }

    let nearest: typeof this.npcs[number] | null = null;
    let nearestDistance = 110;
    for (const npc of this.npcs) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.sprite.x, npc.sprite.y);
      const near = distance < nearestDistance;
      npc.prompt.setVisible(near);
      npc.prompt.setPosition(npc.sprite.x, npc.sprite.y - 62);
      if (near) { nearest = npc; nearestDistance = distance; }
    }

    state.setNearNpc(nearest?.data.id ?? null);
    if (nearest && Phaser.Input.Keyboard.JustDown(this.keys.E)) {
      if (nearest.data.id === "elder" && !state.questStarted) {
        state.startQuest();
        state.openDialogue("အဘိုး", "Quest စတင်ပြီ! ရွာထဲက Coin ၅ ခုကို စုဆောင်းပြီး ငါ့ဆီ ပြန်လာပါ။");
      } else if (nearest.data.id === "elder" && state.questStarted && state.coins >= 5 && !state.questComplete) {
        state.completeQuest();
        state.openDialogue("အဘိုး", "ကောင်းတယ် မြေးလေး! မင်း Quest ကို အောင်မြင်စွာ ပြီးမြောက်ပြီ။");
      } else {
        state.openDialogue(nearest.data.name, nearest.data.dialogue);
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) state.closeDialogue();
  }

  private createNpc(data: NpcData) {
    const sprite = this.physics.add.sprite(data.x, data.y, "npc").setDepth(20);
    sprite.setImmovable(true).setBodySize(26, 34).setOffset(11, 20);
    this.physics.add.collider(sprite, this.obstacles);
    const prompt = this.add.text(data.x, data.y - 62, "E  TALK", {
      fontFamily: "Arial", fontSize: "12px", fontStyle: "bold", color: "#fff7c2",
      backgroundColor: "#12212bdd", padding: { x: 8, y: 5 }
    }).setOrigin(.5).setDepth(45).setVisible(false);
    this.tweens.add({ targets: prompt, y: "-=5", duration: 600, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    this.npcs.push({ data, sprite, prompt });
  }

  private createObstacle(x: number, y: number, w: number, h: number) {
    const body = this.obstacles.create(x + w / 2, y + h / 2, "pixel").setVisible(false);
    body.setSize(w, h).setDisplaySize(w, h).refreshBody();
  }

  private drawWorld() {
    const g = this.add.graphics();
    g.fillStyle(0x78b96d).fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    g.fillStyle(0x8bca78).fillRect(0, 0, WORLD_WIDTH, 560);
    g.fillStyle(0xd7b98e).fillRect(0, 560, WORLD_WIDTH, 190);
    g.fillStyle(0x6eaa62).fillRect(0, 750, WORLD_WIDTH, 400);
    g.fillStyle(0x4a9bd0).fillRect(0, 1150, WORLD_WIDTH, 350);

    for (let x = 0; x < WORLD_WIDTH; x += 72) {
      g.lineStyle(2, 0x88ccef, .55);
      g.lineBetween(x, 1210, x + 34, 1210);
    }
    this.drawHouse(g, 1200, 280);
    this.drawHouse(g, 1780, 780, 190, 160);
    this.drawTree(g, 260, 260); this.drawTree(g, 520, 320); this.drawTree(g, 1750, 250);
    this.drawTree(g, 1950, 500); this.drawTree(g, 300, 1000); this.drawTree(g, 1800, 1050);
    this.drawFence(g, 90, 535, 420); this.drawFence(g, 1540, 535, 220);

    g.fillStyle(0xead7a0).fillRect(735, 500, 220, 12);
    g.fillStyle(0x7b4b2a).fillRect(760, 470, 12, 65);
    g.fillStyle(0xfff1c1).fillRect(770, 470, 180, 42);
    this.add.text(800, 479, "ရွာထဲ", { fontSize: "19px", fontStyle: "bold", color: "#3b2417" }).setDepth(4);
  }

  private drawHouse(g: Phaser.GameObjects.Graphics, x: number, y: number, w = 280, h = 220) {
    g.fillStyle(0x8b3e2f).fillTriangle(x - 35, y, x + w / 2, y - 150, x + w + 35, y);
    g.fillStyle(0xc98b5b).fillRect(x, y, w, h);
    g.fillStyle(0x6e3328).fillRect(x + w * .42, y + h * .48, 48, 112);
    g.fillStyle(0x9ed8e8).fillRect(x + 35, y + 55, 58, 52).fillRect(x + w - 93, y + 55, 58, 52);
  }

  private drawTree(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillStyle(0x654321).fillRect(x - 12, y + 20, 24, 62);
    g.fillStyle(0x286b34).fillCircle(x, y, 55);
    g.fillStyle(0x3b8a42).fillCircle(x - 27, y + 10, 38);
    g.fillStyle(0x52a34e).fillCircle(x + 24, y - 8, 34);
  }

  private drawFence(g: Phaser.GameObjects.Graphics, x: number, y: number, length: number) {
    g.lineStyle(7, 0x8b5a32).lineBetween(x, y, x + length, y);
    for (let p = x; p <= x + length; p += 38) g.fillStyle(0x9b673a).fillRect(p - 3, y - 18, 6, 36);
  }

  private makeTextures() {
    const make = (key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      draw(g); g.generateTexture(key, w, h); g.destroy();
    };
    make("pixel", 2, 2, g => g.fillStyle(0xffffff).fillRect(0, 0, 2, 2));
    make("player-1", 48, 56, g => this.drawCharacter(g, 0x2563eb, 0x172554, false));
    make("player-2", 48, 56, g => this.drawCharacter(g, 0x2563eb, 0x172554, true));
    make("npc", 48, 56, g => this.drawCharacter(g, 0x16a34a, 0x713f12, false));
    make("coin", 48, 48, g => {
      g.fillStyle(0xfacc15).fillCircle(24, 24, 14);
      g.lineStyle(3, 0xf59e0b).strokeCircle(24, 24, 14);
      g.fillStyle(0xfff7ae).fillCircle(19, 19, 4);
    });
    make("leaf", 44, 44, g => {
      g.fillStyle(0x22c55e).fillEllipse(22, 20, 24, 16);
      g.fillStyle(0x14532d).fillRect(21, 20, 3, 16);
      g.fillStyle(0x86efac).fillCircle(17, 17, 3);
    });
    this.anims.create({ key: "walk-right", frames: [{ key: "player-1" }, { key: "player-2" }], frameRate: 6, repeat: -1 });
    this.anims.create({ key: "walk-left", frames: [{ key: "player-2" }, { key: "player-1" }], frameRate: 6, repeat: -1 });
  }

  private drawCharacter(g: Phaser.GameObjects.Graphics, shirt: number, hair: number, step: boolean) {
    g.fillStyle(hair).fillCircle(24, 12, 12);
    g.fillStyle(0xf2c094).fillCircle(24, 16, 9);
    g.fillStyle(shirt).fillRoundedRect(10, 26, 28, 24, 5);
    g.fillStyle(0xfacc15).fillRect(16, 29, 16, 5);
    g.fillStyle(0x111827).fillRect(step ? 11 : 13, 48, 8, 8).fillRect(step ? 29 : 27, 48, 8, 8);
  }
}