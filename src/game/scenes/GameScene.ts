import Phaser from "phaser";
import { useGameStore, type InventoryItem } from "../../store/gameStore";

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1504;
const HOME = { x: 430, y: 650 };
const RAID_DURATION = 60;

type LootSpot = { id: string; name: string; x: number; y: number; item: InventoryItem; value: number };

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private horse?: Phaser.Physics.Arcade.Sprite;
  private mapLayer!: Phaser.Tilemaps.TilemapLayer;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private lootSpots: Array<LootSpot & { sprite: Phaser.GameObjects.Rectangle; prompt: Phaser.GameObjects.Text }> = [];
  private nearestLoot: string | null = null;
  private raidEndsAt = 0;
  private lastTimerSecond = -1;
  private nightOverlay!: Phaser.GameObjects.Rectangle;
  private timerText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private sceneHomeHint!: Phaser.GameObjects.Text;

  constructor() { super("GameScene"); }

  preload() {
    this.load.tilemapTiledJSON("village-map", "/assets/village-map.json");
    this.load.image("tiles", "/assets/tileset.svg");
    this.load.spritesheet("thief-sheet", "/assets/thief-sheet.svg", { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet("horse-sheet", "/assets/horse-sheet.svg", { frameWidth: 64, frameHeight: 64 });
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    const map = this.make.tilemap({ key: "village-map" });
    const tileset = map.addTilesetImage("myanmar_tiles", "tiles");
    if (!tileset) throw new Error("Tileset failed to load.");
    this.mapLayer = map.createLayer("Ground", tileset, 0, 0)!;
    if (!this.mapLayer) throw new Error("Ground tilemap layer failed to load.");
    this.mapLayer.setCollisionByProperty({ collides: true });

    this.makePixelTexture();
    this.makeAnimations();
    this.drawVillage();
    this.createStaticObstacles();

    this.player = this.physics.add.sprite(HOME.x, HOME.y, "thief-sheet", 0).setDepth(30);
    this.player.setCollideWorldBounds(true).setBodySize(22, 30).setOffset(13, 29);
    this.physics.add.collider(this.player, this.mapLayer);
    this.physics.add.collider(this.player, this.obstacles);

    this.createLootSpots();
    this.createUI();
    this.createInput();

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(140, 90);
  }

  update() {
    const state = useGameStore.getState();
    if (state.dialogue) {
      this.player.setVelocity(0, 0);
      if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) state.closeDialogue();
      return;
    }
    if (state.phase === "returning") { this.player.setVelocity(0, 0); this.updateHud(); return; }
    if (state.phase === "raid") this.updateRaidTimer();
    this.updatePlayer();
    this.updateInteraction();
    this.updateHud();
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) state.closeDialogue();
  }

  private updateRaidTimer() {
    const state = useGameStore.getState();
    const seconds = Math.max(0, Math.ceil((this.raidEndsAt - this.time.now) / 1000));
    if (seconds !== this.lastTimerSecond) {
      this.lastTimerSecond = seconds;
      state.setRaidTimeLeft(seconds);
    }
    if (seconds <= 0) this.startHorseReturn();
  }

  private updatePlayer() {
    const state = useGameStore.getState();
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;
    let x = Number(right) - Number(left);
    let y = Number(down) - Number(up);

    if (x || y) {
      const length = Math.hypot(x, y);
      x /= length; y /= length;
      this.player.setVelocity(x * (state.phase === "raid" ? 190 : 165), y * (state.phase === "raid" ? 190 : 165));
      this.player.anims.play(x < -0.15 ? "thief-left" : x > 0.15 ? "thief-right" : y < 0 ? "thief-up" : "thief-down", true);
    } else {
      this.player.setVelocity(0, 0);
      this.player.anims.stop();
    }
  }

  private updateInteraction() {
    const state = useGameStore.getState();
    if (state.phase === "raid") {
      let best: (LootSpot & { sprite: Phaser.GameObjects.Rectangle; prompt: Phaser.GameObjects.Text }) | null = null;
      let bestDistance = 95;
      for (const spot of this.lootSpots) {
        if (!spot.sprite.visible) { spot.prompt.setVisible(false); continue; }
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, spot.x, spot.y);
        const near = distance < bestDistance;
        spot.prompt.setVisible(near);
        spot.prompt.setPosition(spot.x, spot.y - 48);
        if (near) { best = spot; bestDistance = distance; }
      }
      state.setNearLoot(best?.id ?? null);
      if (best && Phaser.Input.Keyboard.JustDown(this.keys.E)) this.takeLoot(best);
    } else {
      state.setNearLoot(null);
      const nearHorse = Phaser.Math.Distance.Between(this.player.x, this.player.y, 560, 650) < 110;
      this.sceneHomeHint.setVisible(nearHorse);
      if (nearHorse && Phaser.Input.Keyboard.JustDown(this.keys.E)) this.startRaid();
    }
  }

  private takeLoot(spot: LootSpot & { sprite: Phaser.GameObjects.Rectangle; prompt: Phaser.GameObjects.Text }) {
    const state = useGameStore.getState();
    spot.sprite.setVisible(false);
    spot.prompt.setVisible(false);
    const icon = spot.sprite.getData("icon") as Phaser.GameObjects.Text | undefined;
    icon?.setVisible(false);
    state.addLoot(spot.value, spot.item);
    this.beep(520, 0.08, "square");
    this.openFloatingText(spot.x, spot.y - 25, `+1 ${spot.item.name}`, "#ffe58a");
  }

  private startRaid() {
    const state = useGameStore.getState();
    if (state.phase === "raid") return;
    state.startRaid();
    state.startQuest();
    for (const spot of this.lootSpots) {
      spot.sprite.setVisible(true);
      spot.prompt.setVisible(false);
      (spot.sprite.getData("icon") as Phaser.GameObjects.Text | undefined)?.setVisible(true);
    }
    this.raidEndsAt = this.time.now + RAID_DURATION * 1000;
    this.lastTimerSecond = -1;
    this.nightOverlay.setVisible(true);
    this.phaseText.setText("🌙 ညဘက် — ခိုးထွက်နေပြီ");
    this.beep(260, 0.18, "sine");
    this.openFloatingText(this.player.x, this.player.y - 70, "60 seconds!", "#ffe58a");
  }

  private startHorseReturn() {
    const state = useGameStore.getState();
    if (state.phase !== "raid") return;
    state.finishRaid();
    this.nightOverlay.setVisible(false);
    this.phaseText.setText("🐎 မြင်းနဲ့ ရွာပြန်နေပြီ");
    this.beep(180, 0.25, "sine");

    this.player.anims.stop();
    this.horse = this.physics.add.sprite(this.player.x, this.player.y + 18, "horse-sheet", 0).setDepth(25);
    this.horse.anims.play("horse-run", true);
    this.tweens.add({
      targets: this.horse, x: HOME.x, y: HOME.y + 18, duration: 5000, ease: "Sine.inOut",
      onUpdate: () => {
        if (!this.horse) return;
        this.player.setPosition(this.horse.x, this.horse.y - 30);
        this.player.setFrame(Math.floor(this.time.now / 130) % 2);
      },
      onComplete: () => {
        this.player.setPosition(HOME.x, HOME.y);
        this.horse?.destroy();
        this.horse = undefined;
        state.completeQuest();
        state.finishReturn();
        this.phaseText.setText("🏠 ရွာပြန်ရောက်ပြီ");
        this.openFloatingText(HOME.x, HOME.y - 70, `Loot: ${state.loot}`, "#9ef5c8");
        this.openDialogue("ရွာသူကြီး", "ဒီညရတဲ့ပစ္စည်းတွေနဲ့ ရွာကို ပိုကောင်းအောင် တည်ဆောက်နိုင်ပြီ။ Inventory နဲ့ Quest panel ကိုကြည့်ပါ။");
      }
    });
  }

  private createLootSpots() {
    const items: LootSpot[] = [
      { id: "rice1", name: "ဆန်အိမ်", x: 980, y: 510, item: { id: "rice", name: "ဆန်အိတ်", icon: "🌾", amount: 0, value: 12 }, value: 12 },
      { id: "cloth1", name: "အထည်ဆိုင်", x: 1160, y: 540, item: { id: "cloth", name: "အထည်", icon: "🧵", amount: 0, value: 18 }, value: 18 },
      { id: "coin1", name: "အိမ် صندوق", x: 1320, y: 650, item: { id: "coin", name: "ရွှေဒင်္ဂါး", icon: "🪙", amount: 0, value: 1 }, value: 1 },
      { id: "gem1", name: "မြို့ဆိုင်", x: 1600, y: 560, item: { id: "gem", name: "ကျောက်မျက်", icon: "💎", amount: 0, value: 45 }, value: 45 },
      { id: "med1", name: "ဆေးဆိုင်", x: 1810, y: 620, item: { id: "medicine", name: "ဆေးဝါး", icon: "🧪", amount: 0, value: 25 }, value: 25 },
      { id: "coin2", name: "ဈေးတန်း", x: 1980, y: 760, item: { id: "coin", name: "ရွှေဒင်္ဂါး", icon: "🪙", amount: 0, value: 1 }, value: 1 },
      { id: "rice2", name: "ဂိုဒေါင်", x: 1540, y: 960, item: { id: "rice", name: "ဆန်အိတ်", icon: "🌾", amount: 0, value: 12 }, value: 12 },
      { id: "gem2", name: "ကုန်သည်အိမ်", x: 2060, y: 980, item: { id: "gem", name: "ကျောက်မျက်", icon: "💎", amount: 0, value: 45 }, value: 45 },
    ];

    for (const spot of items) {
      const sprite = this.add.rectangle(spot.x, spot.y, 30, 30, 0x9a6a3a).setDepth(15);
      const icon = this.add.text(spot.x, spot.y - 2, spot.item.icon, { fontSize: "20px" }).setOrigin(0.5).setDepth(16);
      const prompt = this.add.text(spot.x, spot.y - 48, "E  ခိုးယူ", {
        fontFamily: "Arial", fontSize: "12px", fontStyle: "bold", color: "#ffe9a3",
        backgroundColor: "#16120ddf", padding: { x: 7, y: 4 }
      }).setOrigin(0.5).setDepth(45).setVisible(false);
      sprite.setData("icon", icon);
      this.lootSpots.push({ ...spot, sprite, prompt });
    }
  }

  private createStaticObstacles() {
    this.obstacles = this.physics.add.staticGroup();
    const buildings = [[360,260,260,170],[760,300,250,180],[1050,380,220,160],[1450,400,260,180],[1780,500,260,180],[1940,860,250,180],[250,920,240,170]];
    for (const [x,y,w,h] of buildings) {
      const body = this.obstacles.create(x + w / 2, y + h / 2, "pixel").setVisible(false);
      body.setSize(w, h).setDisplaySize(w, h).refreshBody();
    }
  }

  private drawVillage() {
    const g = this.add.graphics().setDepth(3);
    this.drawHouse(g,360,260,260,170,"ကိုယ့်ရွာ");
    this.drawHouse(g,760,300,250,180,"အိမ်");
    this.drawHouse(g,1050,380,220,160,"ဆန်အိမ်");
    this.drawHouse(g,1450,400,260,180,"အိမ်");
    this.drawHouse(g,1780,500,260,180,"မြို့ဆိုင်");
    this.drawHouse(g,1940,860,250,180,"ကုန်သည်");
    this.drawHouse(g,250,920,240,170,"ဂိုဒေါင်");
    g.fillStyle(0x2c5b35).fillRect(520,600,90,55);
    g.fillStyle(0x8b5a32).fillRect(540,575,50,45);
    g.fillStyle(0xd2a24c).fillRect(560,580,10,30);
    for (const [x,y] of [[150,180],[640,180],[1330,220],[2220,240],[2250,720],[120,800],[1200,1080],[2240,1120]]) this.drawTree(g,x,y);
    this.add.text(390,600,"ကိုယ့်ရွာ",{fontFamily:"Arial",fontSize:"24px",fontStyle:"bold",color:"#fff3c4"}).setDepth(10);
    this.add.text(1520,340,"အိမ်နီးချင်းရွာ",{fontFamily:"Arial",fontSize:"18px",fontStyle:"bold",color:"#ffe9b0"}).setDepth(10);
    this.add.text(1890,450,"မြို့",{fontFamily:"Arial",fontSize:"22px",fontStyle:"bold",color:"#ffe9b0"}).setDepth(10);
  }

  private drawHouse(g: Phaser.GameObjects.Graphics, x:number, y:number, w:number, h:number, label:string) {
    g.fillStyle(0x743c2e).fillTriangle(x-24,y,x+w/2,y-85,x+w+24,y);
    g.fillStyle(0xb97950).fillRect(x,y,w,h);
    g.fillStyle(0x61362b).fillRect(x+w*.44,y+h*.48,42,h*.52);
    g.fillStyle(0x9bd9e6).fillRect(x+28,y+42,52,42);
    g.fillStyle(0x9bd9e6).fillRect(x+w-80,y+42,52,42);
    this.add.text(x+w/2,y+h+8,label,{fontSize:"11px",color:"#f9edc8"}).setOrigin(.5).setDepth(8);
  }

  private drawTree(g: Phaser.GameObjects.Graphics, x:number, y:number) {
    g.fillStyle(0x654321).fillRect(x-9,y+20,18,50);
    g.fillStyle(0x286b34).fillCircle(x,y,42);
    g.fillStyle(0x3b8a42).fillCircle(x-20,y+8,29);
    g.fillStyle(0x52a34e).fillCircle(x+20,y-8,27);
  }

  private createUI() {
    this.nightOverlay = this.add.rectangle(480,270,960,540,0x08102b,.64).setScrollFactor(0).setDepth(80).setVisible(false);
    this.timerText = this.add.text(480,24,"",{fontFamily:"Arial",fontSize:"28px",fontStyle:"bold",color:"#ffe38b",backgroundColor:"#0b1220e8",padding:{x:14,y:7}}).setOrigin(.5,0).setScrollFactor(0).setDepth(90);
    this.phaseText = this.add.text(20,20,"🏠 ကိုယ့်ရွာ — ညမထွက်သေး",{fontFamily:"Arial",fontSize:"14px",fontStyle:"bold",color:"#eaf6ff",backgroundColor:"#07141ee8",padding:{x:10,y:7}}).setScrollFactor(0).setDepth(90);
    this.sceneHomeHint = this.add.text(560,585,"E  ညဘက်ခိုးထွက်မယ်",{fontFamily:"Arial",fontSize:"12px",fontStyle:"bold",color:"#ffe58a",backgroundColor:"#111a15ee",padding:{x:8,y:5}}).setOrigin(.5).setDepth(50);
    this.add.text(760,495,"🌙 အိမ်နီးချင်းရွာ → မြို့",{fontFamily:"Arial",fontSize:"13px",color:"#d9e7ff",backgroundColor:"#07141ebd",padding:{x:9,y:6}}).setDepth(12);
  }

  private updateHud() {
    const state = useGameStore.getState();
    this.timerText.setText(state.phase === "raid" ? `${state.raidTimeLeft}s` : state.phase === "returning" ? "🐎" : "");
    this.timerText.setVisible(state.phase === "raid" || state.phase === "returning");
  }

  private createInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D,E,ESC") as Record<string, Phaser.Input.Keyboard.Key>;
  }

  private makePixelTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff).fillRect(0, 0, 2, 2);
    g.generateTexture("pixel", 2, 2);
    g.destroy();
  }

  private makeAnimations() {
    this.anims.create({key:"thief-down",frames:this.anims.generateFrameNumbers("thief-sheet",{start:0,end:1}),frameRate:6,repeat:-1});
    this.anims.create({key:"thief-right",frames:this.anims.generateFrameNumbers("thief-sheet",{start:0,end:1}),frameRate:7,repeat:-1});
    this.anims.create({key:"thief-left",frames:this.anims.generateFrameNumbers("thief-sheet",{start:2,end:3}),frameRate:7,repeat:-1});
    this.anims.create({key:"thief-up",frames:this.anims.generateFrameNumbers("thief-sheet",{start:2,end:3}),frameRate:6,repeat:-1});
    this.anims.create({key:"horse-run",frames:this.anims.generateFrameNumbers("horse-sheet",{start:0,end:3}),frameRate:8,repeat:-1});
  }

  private openFloatingText(x:number,y:number,text:string,color:string) {
    const label=this.add.text(x,y,text,{fontFamily:"Arial",fontSize:"16px",fontStyle:"bold",color,stroke:"#111827",strokeThickness:4}).setOrigin(.5).setDepth(100);
    this.tweens.add({targets:label,y:y-40,alpha:0,duration:900,onComplete:()=>label.destroy()});
  }

  private beep(frequency:number,duration:number,type:OscillatorType) {
    if(!useGameStore.getState().soundEnabled)return;
    const AudioContextClass=window.AudioContext || (window as typeof window & {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
    if(!AudioContextClass)return;
    const context=new AudioContextClass();
    const oscillator=context.createOscillator();
    const gain=context.createGain();
    oscillator.type=type; oscillator.frequency.value=frequency;
    gain.gain.setValueAtTime(.035,context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001,context.currentTime+duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime+duration);
    window.setTimeout(()=>void context.close(),(duration+.1)*1000);
  }
}