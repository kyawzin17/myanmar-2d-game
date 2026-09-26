import Phaser from "phaser";
import { useGameStore } from "../../store/gameStore";

const WORLD_WIDTH = 2200;
const WORLD_HEIGHT = 1400;

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private npc!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private coins!: Phaser.Physics.Arcade.Group;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private prompt!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;

  constructor(){super("GameScene");}

  create(){
    this.makeTextures();
    this.physics.world.setBounds(0,0,WORLD_WIDTH,WORLD_HEIGHT);
    this.drawWorld();

    this.obstacles=this.physics.add.staticGroup();
    this.createObstacle(1200,280,280,220);
    this.createObstacle(1780,780,170,150);

    this.player=this.physics.add.sprite(500,650,"player").setDepth(10);
    this.player.setCollideWorldBounds(true).setDrag(800,800).setMaxVelocity(190,190);
    this.player.setBodySize(24,32).setOffset(12,14);

    this.npc=this.physics.add.sprite(900,520,"npc").setDepth(10);
    this.npc.setImmovable(true).setBodySize(26,34).setOffset(11,10);

    this.physics.add.collider(this.player,this.obstacles);
    this.physics.add.collider(this.npc,this.obstacles);

    this.coins=this.physics.add.group();
    const coinPositions=[[650,700],[820,720],[990,720],[1120,650],[1500,600],[1650,900],[480,900],[1050,1000]];
    coinPositions.forEach(([x,y],index)=>{
      const coin=this.coins.create(x,y,"coin").setDepth(8);
      coin.setCircle(12,12,12);
      this.tweens.add({targets:coin,y:y-8,duration:650+index*40,yoyo:true,repeat:-1,ease:"Sine.inOut"});
      this.tweens.add({targets:coin,angle:360,duration:1800,repeat:-1,ease:"Linear"});
    });
    this.physics.add.overlap(this.player,this.coins,(_player,object)=>{
      const coin=object as Phaser.Physics.Arcade.Sprite;
      if(!coin.active)return;
      this.tweens.add({targets:coin,scale:1.8,alpha:0,duration:180,onComplete:()=>coin.disableBody(true,true)});
      useGameStore.getState().addCoin();
    });

    this.cursors=this.input.keyboard!.createCursorKeys();
    this.keys=this.input.keyboard!.addKeys("W,A,S,D,E,ESC") as Record<string,Phaser.Input.Keyboard.Key>;

    this.cameras.main.setBounds(0,0,WORLD_WIDTH,WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player,true,0.09,0.09);
    this.cameras.main.setDeadzone(120,80);

    this.prompt=this.add.text(this.npc.x,this.npc.y-62,"E  TALK",{
      fontFamily:"Arial",fontSize:"14px",fontStyle:"bold",color:"#fff7c2",
      backgroundColor:"#12212bdd",padding:{x:9,y:6}
    }).setOrigin(.5).setDepth(30).setVisible(false);
    this.tweens.add({targets:this.prompt,y:"-=6",duration:650,yoyo:true,repeat:-1,ease:"Sine.inOut"});

    this.timeText=this.add.text(30,30,"08:30 AM",{fontFamily:"Arial",fontSize:"13px",color:"#eaf6ff",backgroundColor:"#0b1822cc",padding:{x:9,y:6}}).setScrollFactor(0).setDepth(30);

    this.events.on("shutdown",()=>this.cleanupStore());
  }

  update(){
    const blocked=useGameStore.getState().dialogue!==null;
    const left=this.cursors.left.isDown||this.keys.A.isDown;
    const right=this.cursors.right.isDown||this.keys.D.isDown;
    const up=this.cursors.up.isDown||this.keys.W.isDown;
    const down=this.cursors.down.isDown||this.keys.S.isDown;

    if(blocked){this.player.setVelocity(0,0);return;}

    let x=(right?1:0)-(left?1:0);
    let y=(down?1:0)-(up?1:0);
    if(x||y){const length=Math.hypot(x,y);x/=length;y/=length;this.player.setVelocity(x*170,y*170);this.player.anims.play("player-walk",true);this.player.setFlipX(x<0);}
    else{this.player.setVelocity(0,0);this.player.anims.stop();}

    const distance=Phaser.Math.Distance.Between(this.player.x,this.player.y,this.npc.x,this.npc.y);
    const near=distance<105;
    useGameStore.getState().setNearNpc(near);
    this.prompt.setVisible(near);
    this.prompt.setPosition(this.npc.x,this.npc.y-64);

    if(near&&Phaser.Input.Keyboard.JustDown(this.keys.E)){
      useGameStore.getState().openDialogue("မင်္ဂလာပါ! ဒီရွာကို ကြိုဆိုပါတယ်။ ရွာထဲက Coin ၈ ခုကို စုကြည့်ပါ။ နောက် version မှာ quest တွေလည်း ထည့်ပေးမယ်။");
    }
    if(Phaser.Input.Keyboard.JustDown(this.keys.ESC))useGameStore.getState().closeDialogue();
  }

  private createObstacle(x:number,y:number,w:number,h:number){
    const body=this.obstacles.create(x+w/2,y+h/2,"pixel").setVisible(false);
    body.setSize(w,h).setDisplaySize(w,h).refreshBody();
  }

  private drawWorld(){
    const g=this.add.graphics();
    g.fillStyle(0x78b96d).fillRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);
    g.fillStyle(0x83c979).fillRect(0,0,WORLD_WIDTH,560);
    g.fillStyle(0xd7b98e).fillRect(0,560,WORLD_WIDTH,190);
    g.fillStyle(0x6eaa62).fillRect(0,750,WORLD_WIDTH,400);
    g.fillStyle(0x4a9bd0).fillRect(0,1150,WORLD_WIDTH,250);

    for(let x=0;x<WORLD_WIDTH;x+=72){g.lineStyle(2,0x88ccef,.55);g.lineBetween(x,1210,x+34,1210);}

    this.drawHouse(g,1200,280);
    this.drawHouse(g,1780,780,170,150);
    [[260,260],[520,320],[1750,250],[1950,500],[300,1000],[1800,1050],[1050,270]].forEach(([x,y])=>this.drawTree(g,x,y));
    this.drawFence(g,90,535,420);
    this.drawFence(g,1540,535,220);

    g.fillStyle(0xead7a0);g.fillRect(735,500,220,12);
    g.fillStyle(0x7b4b2a);g.fillRect(760,470,12,65);
    g.fillStyle(0xfff1c1);g.fillRect(770,470,180,42);
    this.add.text(800,479,"ရွာထဲ",{fontSize:"19px",fontStyle:"bold",color:"#3b2417"}).setDepth(4);

    g.fillStyle(0xffffff,.13);
    for(let x=80;x<WORLD_WIDTH;x+=180)for(let y=90;y<1100;y+=180)g.fillCircle(x,y,2);
  }

  private drawHouse(g:Phaser.GameObjects.Graphics,x:number,y:number,w=280,h=220){
    g.fillStyle(0x8b3e2f);g.fillTriangle(x-35,y,x+w/2,y-150,x+w+35,y);
    g.fillStyle(0xc98b5b);g.fillRect(x,y,w,h);
    g.fillStyle(0x6e3328);g.fillRect(x+w*.42,y+h*.48,48,112);
    g.fillStyle(0x9ed8e8);g.fillRect(x+35,y+55,58,52);g.fillRect(x+w-93,y+55,58,52);
    g.lineStyle(4,0xffffff,.25);g.strokeRect(x+35,y+55,58,52);g.strokeRect(x+w-93,y+55,58,52);
  }

  private drawTree(g:Phaser.GameObjects.Graphics,x:number,y:number){
    g.fillStyle(0x654321);g.fillRect(x-12,y+20,24,62);
    g.fillStyle(0x286b34);g.fillCircle(x,y,55);
    g.fillStyle(0x3b8a42);g.fillCircle(x-27,y+10,38);
    g.fillStyle(0x52a34e);g.fillCircle(x+24,y-8,34);
  }

  private drawFence(g:Phaser.GameObjects.Graphics,x:number,y:number,length:number){
    g.lineStyle(7,0x8b5a32);g.lineBetween(x,y,x+length,y);
    for(let p=x;p<=x+length;p+=38)g.fillStyle(0x9b673a).fillRect(p-3,y-18,6,36);
  }

  private makeTextures(){
    const make=(key:string,w:number,h:number,draw:(g:Phaser.GameObjects.Graphics)=>void)=>{
      const g=this.make.graphics({x:0,y:0,add:false});draw(g);g.generateTexture(key,w,h);g.destroy();
    };
    make("pixel",2,2,g=>g.fillStyle(0xffffff).fillRect(0,0,2,2));
    make("player",48,56,g=>{
      g.fillStyle(0x172554).fillCircle(24,12,12);g.fillStyle(0xf2c094).fillCircle(24,16,9);
      g.fillStyle(0x2563eb).fillRoundedRect(11,26,26,24,5);g.fillStyle(0xfacc15).fillRect(17,28,14,4);
      g.fillStyle(0x111827).fillRect(13,48,8,8);g.fillRect(27,48,8,8);
    });
    make("npc",48,56,g=>{
      g.fillStyle(0x713f12).fillCircle(24,12,12);g.fillStyle(0xf2c094).fillCircle(24,16,9);
      g.fillStyle(0x16a34a).fillRoundedRect(10,26,28,24,5);g.fillStyle(0xfef3c7).fillRect(16,29,16,5);
      g.fillStyle(0x111827).fillRect(13,48,8,8);g.fillRect(27,48,8,8);
    });
    make("coin",48,48,g=>{g.fillStyle(0xfacc15).fillCircle(24,24,14);g.lineStyle(3,0xf59e0b);g.strokeCircle(24,24,14);g.fillStyle(0xfff7ae).fillCircle(19,19,4);});
    this.anims.create({key:"player-walk",frames:[{key:"player"},{key:"player"}],frameRate:5,repeat:-1});
  }

  private cleanupStore(){
    useGameStore.getState().setNearNpc(false);
  }
}