import Phaser from "phaser";
import { useGameStore } from "../../store/gameStore";

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private npc!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private coins!: Phaser.Physics.Arcade.Group;

  constructor(){super("GameScene");}

  create(){
    this.makeTextures();
    this.physics.world.setBounds(0,0,2200,1400);
    this.drawWorld();

    this.player=this.physics.add.sprite(500,650,"player");
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(700,700);
    this.player.setMaxVelocity(190,190);

    this.npc=this.physics.add.sprite(900,520,"npc");
    this.npc.setImmovable(true);

    this.coins=this.physics.add.group({key:"coin",repeat:7,setXY:{x:650,y:700,stepX:170}});
    this.physics.add.overlap(this.player,this.coins,(_p,c)=>{
      (c as Phaser.Physics.Arcade.Sprite).disableBody(true,true);
      useGameStore.getState().addCoin();
    });

    this.cursors=this.input.keyboard!.createCursorKeys();
    this.keys=this.input.keyboard!.addKeys("W,A,S,D,E") as Record<string,Phaser.Input.Keyboard.Key>;

    this.cameras.main.setBounds(0,0,2200,1400);
    this.cameras.main.startFollow(this.player,true,0.08,0.08);

    this.add.text(30,30,"MYANMAR 2D GAME • v0.0.1",{
      fontFamily:"Arial",fontSize:"18px",color:"#ffffff",
      backgroundColor:"#111827",padding:{x:10,y:7}
    }).setScrollFactor(0).setDepth(20);
  }

  update(){
    const left=this.cursors.left.isDown||this.keys.A.isDown;
    const right=this.cursors.right.isDown||this.keys.D.isDown;
    const up=this.cursors.up.isDown||this.keys.W.isDown;
    const down=this.cursors.down.isDown||this.keys.S.isDown;
    const speed=170;
    let vx=0,vy=0;
    if(left)vx=-speed;if(right)vx=speed;if(up)vy=-speed;if(down)vy=speed;
    this.player.setVelocity(vx,vy);
    if(vx||vy)this.player.setFlipX(vx<0);

    const distance=Phaser.Math.Distance.Between(this.player.x,this.player.y,this.npc.x,this.npc.y);
    if(distance<95 && Phaser.Input.Keyboard.JustDown(this.keys.E)){
      useGameStore.getState().openDialogue("မင်္ဂလာပါ! ဒီရွာကို ကြိုဆိုပါတယ်။ Coin တွေ စုကြည့်ပါ။");
    }
  }

  private drawWorld(){
    const g=this.add.graphics();
    g.fillStyle(0x7bc47f).fillRect(0,0,2200,1400);
    g.fillStyle(0xd7b98e).fillRect(0,570,2200,180);
    g.fillStyle(0x5c9f62).fillRect(0,750,2200,400);
    g.fillStyle(0x4ea5d9).fillRect(0,1150,2200,250);

    // House
    g.fillStyle(0xc98b5b).fillRect(1200,280,280,220);
    g.fillStyle(0x8b3e2f);
    g.fillTriangle(1160,280,1340,130,1520,280);
    g.fillStyle(0x4a2c20).fillRect(1310,390,60,110);
    g.fillStyle(0x9ed8e8).fillRect(1235,335,55,55).fillRect(1390,335,55,55);

    // Trees
    for(const [x,y] of [[260,260],[520,320],[1750,250],[1950,500],[300,1000],[1800,1050]] as number[][]){
      g.fillStyle(0x6b4226).fillRect(x-14,y,28,75);
      g.fillStyle(0x2f7d32).fillCircle(x,y,58);
      g.fillStyle(0x3e9441).fillCircle(x-28,y+8,42);
    }

    for(let x=0;x<2200;x+=80){
      g.lineStyle(2,0x8fd3f4);
      g.lineBetween(x,1210,x+35,1210);
    }

    g.fillStyle(0x7b4b2a).fillRect(760,485,12,65);
    g.fillStyle(0xfff1c1).fillRect(770,485,180,45);
    this.add.text(790,495,"ရွာထဲ",{fontSize:"20px",color:"#3b2417"});
  }

  private makeTextures(){
    const make=(key:string,draw:(g:Phaser.GameObjects.Graphics)=>void)=>{
      const g=this.make.graphics({x:0,y:0,add:false});
      draw(g);g.generateTexture(key,48,48);g.destroy();
    };
    make("player",(g)=>{
      g.fillStyle(0x2563eb).fillCircle(24,14,11);
      g.fillStyle(0xf2c094).fillCircle(24,16,8);
      g.fillStyle(0x1e40af).fillRect(12,26,24,18);
    });
    make("npc",(g)=>{
      g.fillStyle(0x16a34a).fillCircle(24,14,11);
      g.fillStyle(0xf2c094).fillCircle(24,16,8);
      g.fillStyle(0x15803d).fillRect(12,26,24,18);
    });
    make("coin",(g)=>{
      g.fillStyle(0xfacc15).fillCircle(24,24,13);
      g.lineStyle(3,0xf59e0b).strokeCircle(24,24,13);
    });
  }
}