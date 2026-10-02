import { Application, Container, Sprite, Texture } from 'pixi.js';
import { EventEmitter } from './EventEmitter';
import { InputManager } from './InputManager';
import { EffectManager } from './EffectManager';
import { DEFAULT_GAME_CONFIG, type GameConfig } from '../types/config';
import { PlayerShip } from '../entities/PlayerShip';
import { ChaserEnemy, ShooterEnemy, type Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Island } from '../entities/Island';
import { checkCircleCollision, clamp } from '../systems/CollisionSystem';
import { soundManager } from './SoundManager';

export class GameEngine {
  public app: Application;
  public events: EventEmitter;
  public config: GameConfig;
  public input: InputManager;
  public effects: EffectManager;

  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public score: number = 0;
  public timeRemaining: number = 0;

  // Entidades
  public player!: PlayerShip;
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public islands: Island[] = [];

  // Spawn timer
  private spawnTimer: number = 0;
  private playerWakeTimer: number = 0;
  private enemyWakeTimer: number = 0;

  // Camadas de renderização
  public backgroundLayer: Container;
  public islandLayer: Container;
  public entityLayer: Container;
  public effectLayer: Container;
  public uiLayer: Container;

  private boundTick: (ticker: { deltaMS: number }) => void;

  private boundVisibilityChange: () => void;
  private boundWindowBlur: () => void;

  constructor(app: Application, config: GameConfig = DEFAULT_GAME_CONFIG) {
    this.app = app;
    this.config = { ...config };
    this.events = new EventEmitter();
    this.input = new InputManager();

    this.backgroundLayer = new Container();
    this.islandLayer = new Container();
    this.entityLayer = new Container();
    this.effectLayer = new Container();
    this.uiLayer = new Container();

    this.effects = new EffectManager(this.effectLayer);

    this.app.stage.addChild(this.backgroundLayer);
    this.app.stage.addChild(this.islandLayer);
    this.app.stage.addChild(this.entityLayer);
    this.app.stage.addChild(this.effectLayer);
    this.app.stage.addChild(this.uiLayer);

    this.boundTick = this.update.bind(this);
    this.boundVisibilityChange = () => {
      if (document.hidden) {
        this.pause();
      }
    };
    this.boundWindowBlur = () => {
      this.pause();
    };

    this.timeRemaining = this.config.sessionDuration;
  }

  public async init(): Promise<void> {
    this.createIslands();
    this.createBackground();
    this.createPlayer();
  }

  private createBackground(): void {
    const { width, height } = this.app.screen;
    const tileSize = 64;

    try {
      const deepWaterTexture = Texture.from('waterTile');
      let shallowWaterTexture: Texture | null = null;
      try {
        shallowWaterTexture = Texture.from('shallowWaterTile');
      } catch {
        shallowWaterTexture = deepWaterTexture;
      }

      for (let x = 0; x < width; x += tileSize) {
        for (let y = 0; y < height; y += tileSize) {
          const tileCenterX = x + tileSize / 2;
          const tileCenterY = y + tileSize / 2;

          // Detecta se o tile de água contorna qualquer bloco sólido de terra de qualquer ilha
          let isNearIsland = false;
          for (const island of this.islands) {
            for (const block of island.solidBlocks) {
              const dx = tileCenterX - block.x;
              const dy = tileCenterY - block.y;
              const distSq = dx * dx + dy * dy;
              const shallowThreshold = block.radius + tileSize * 0.95;

              if (distSq <= shallowThreshold * shallowThreshold) {
                isNearIsland = true;
                break;
              }
            }
            if (isNearIsland) break;
          }

          const chosenTexture = isNearIsland && shallowWaterTexture ? shallowWaterTexture : deepWaterTexture;
          const tile = new Sprite(chosenTexture);
          tile.x = x;
          tile.y = y;
          tile.width = tileSize;
          tile.height = tileSize;
          this.backgroundLayer.addChild(tile);
        }
      }
    } catch (e) {
      console.warn('Water texture fallback', e);
    }
  }

  private createIslands(): void {
    // 1. ILHA 1: Formato 3x3 Clássico (Noroeste)
    const matrix1: (string | null)[][] = [
      ['island_tl', 'island_t', 'island_tr'],
      ['island_l', 'island_c', 'island_r'],
      ['island_bl', 'island_b', 'island_br'],
    ];
    const island1 = new Island('island_1', 280, 240, matrix1, 64);

    // 2. ILHA 2: Formato em "L" (Nordeste)
    const matrix2: (string | null)[][] = [
      ['island_tl', 'island_tr', null],
      ['island_l', 'island_r', null],
      ['island_l', 'island_r', null],
      ['island_bl', 'island_br', null],
    ];
    const island2 = new Island('island_2', 920, 260, matrix2, 64 + 21);

    // 3. ILHA 3: Formato em Ferradura / Atol em "U" com baía central (Centro-Sul) - 3x3
    const matrix3: (string | null)[][] = [
      ['island_tl', 'island_t', 'island_tr'],
      ['island_l', 'island_c', 'island_r'],
      ['island_bl', 'island_b', 'island_br'],
    ];
    const island3 = new Island('island_3', 600, 520, matrix3, 64);

    this.islands.push(island1, island2, island3);
    this.islandLayer.addChild(island1.view);
    this.islandLayer.addChild(island2.view);
    this.islandLayer.addChild(island3.view);
  }

  private createPlayer(): void {
    const startX = this.app.screen.width / 2;
    const startY = this.app.screen.height - 120;
    this.player = new PlayerShip(startX, startY, this.config);
    this.entityLayer.addChild(this.player.view);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.input.startListening();
    this.app.ticker.add(this.boundTick);

    document.addEventListener('visibilitychange', this.boundVisibilityChange);
    window.addEventListener('blur', this.boundWindowBlur);

    soundManager.playBGM('oceanAmbience');
    soundManager.play('gameStart');

    this.events.emit('game:started', { time: this.timeRemaining });
  }

  public pause(): void {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    this.input.reset();
    soundManager.play('gamePause');
    this.events.emit('game:paused');
  }

  public resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    soundManager.play('gameResume');
    this.events.emit('game:resumed');
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.input.stopListening();
    this.app.ticker.remove(this.boundTick);

    soundManager.stopBGM();

    document.removeEventListener('visibilitychange', this.boundVisibilityChange);
    window.removeEventListener('blur', this.boundWindowBlur);
  }

  public addProjectile(p: Projectile): void {
    this.projectiles.push(p);
    this.entityLayer.addChild(p.view);
  }

  private lastEmittedTime: number = -1;
  private lastEmittedHealth: number = -1;

  private update(ticker: { deltaMS: number }): void {
    if (!this.isRunning || this.isPaused) return;

    const dt = ticker.deltaMS / 1000;

    // Atualiza tempo
    this.timeRemaining = Math.max(0, this.timeRemaining - dt);
    const roundedTime = Math.ceil(this.timeRemaining);
    if (roundedTime !== this.lastEmittedTime) {
      this.lastEmittedTime = roundedTime;
      this.events.emit('time:update', roundedTime);
    }

    if (this.timeRemaining <= 0) {
      this.endGame('time_up');
      return;
    }

    // 0. Atualiza Efeitos Visuais
    this.effects.update(dt);

    // 1. Atualiza Player com Inputs
    const prevPlayerX = this.player.x;
    const prevPlayerY = this.player.y;

    this.player.updateWithInput(dt, this.input.getState(), (proj) => this.addProjectile(proj));

    // Efeito de esteira d'água ao navegar
    const isPlayerMoving = this.input.getState().forward || Math.hypot(this.player.x - prevPlayerX, this.player.y - prevPlayerY) > 0.5;
    if (isPlayerMoving && !this.player.isDead) {
      this.playerWakeTimer += dt;
      if (this.playerWakeTimer >= 0.08) {
        this.playerWakeTimer = 0;
        const wakeX = this.player.x - Math.cos(this.player.rotation) * (this.player.radius + 4);
        const wakeY = this.player.y - Math.sin(this.player.rotation) * (this.player.radius + 4);
        this.effects.createWaterWake(wakeX, wakeY, this.player.rotation, this.player.radius);
      }
    }

    // Restringe Player aos limites da arena
    this.player.x = clamp(this.player.x, this.player.radius, this.app.screen.width - this.player.radius);
    this.player.y = clamp(this.player.y, this.player.radius, this.app.screen.height - this.player.radius);

    // Colisão do Player com Ilhas (formato preciso da terra firme)
    for (const island of this.islands) {
      if (island.collidesWith(this.player, this.player.radius)) {
        this.player.x = prevPlayerX;
        this.player.y = prevPlayerY;
        soundManager.play('shipCollision', 0.4);
        break;
      }
    }
    this.player.view.x = this.player.x;
    this.player.view.y = this.player.y;

    // Emite vida do player para UI SOMENTE quando o valor mudar
    if (this.player.health !== this.lastEmittedHealth) {
      this.lastEmittedHealth = this.player.health;
      this.events.emit('player:health', { health: this.player.health, maxHealth: this.player.maxHealth });
    }

    if (this.player.isDead) {
      this.effects.createExplosion(this.player.x, this.player.y);
      soundManager.play('shipSinking');
      soundManager.play('explosion');
      this.endGame('player_destroyed');
      return;
    }

    // 2. Spawn de Inimigos
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.config.enemySpawnInterval) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // Efeito periódico de esteira d'água para inimigos em movimento
    this.enemyWakeTimer += dt;
    const shouldEmitEnemyWake = this.enemyWakeTimer >= 0.12;
    if (shouldEmitEnemyWake) {
      this.enemyWakeTimer = 0;
    }

    // 3. Atualiza Inimigos
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const prevX = enemy.x;
      const prevY = enemy.y;

      enemy.updateAI(dt, this.player, this.islands, (proj) => this.addProjectile(proj));

      // Emite esteira de água se o inimigo se moveu
      if (shouldEmitEnemyWake && !enemy.isDead && Math.hypot(enemy.x - prevX, enemy.y - prevY) > 0.2) {
        const wakeX = enemy.x - Math.cos(enemy.rotation) * (enemy.radius + 3);
        const wakeY = enemy.y - Math.sin(enemy.rotation) * (enemy.radius + 3);
        this.effects.createWaterWake(wakeX, wakeY, enemy.rotation, enemy.radius * 0.9);
      }

      // Limites da arena e sincronização de visão
      enemy.x = clamp(enemy.x, enemy.radius, this.app.screen.width - enemy.radius);
      enemy.y = clamp(enemy.y, enemy.radius, this.app.screen.height - enemy.radius);
      enemy.view.x = enemy.x;
      enemy.view.y = enemy.y;

      // Colisão de Inimigos (Chaser & Shooter) com Player (Impacto direto)
      if (!enemy.isDead && !this.player.isDead) {
        if (checkCircleCollision(enemy, enemy.radius, this.player, this.player.radius)) {
          enemy.takeDamage(999); // Auto-destrói
          this.player.takeDamage(enemy.damage);
          this.effects.createExplosion(enemy.x, enemy.y);
          soundManager.play('shipCollision');
          soundManager.play('explosion');
        }
      }

      // Remove inimigo morto
      if (enemy.isDead) {
        this.entityLayer.removeChild(enemy.view);
        enemy.destroy();
        this.enemies.splice(i, 1);
      }
    }

    // 4. Atualiza Projéteis
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);

      // Saiu da arena?
      if (p.x < 0 || p.x > this.app.screen.width || p.y < 0 || p.y > this.app.screen.height) {
        p.isDead = true;
      }

      // Colidiu com Ilhas?
      if (!p.isDead) {
        for (const island of this.islands) {
          if (island.collidesWith(p, p.radius)) {
            p.isDead = true;
            this.effects.createExplosion(p.x, p.y);
            soundManager.play('waterHit', 0.6);
            break;
          }
        }
      }

      // Projétil do Jogador -> atinge Inimigos
      if (!p.isDead && p.owner === 'player') {
        for (const enemy of this.enemies) {
          if (!enemy.isDead && checkCircleCollision(p, p.radius, enemy, enemy.radius)) {
            p.isDead = true;
            enemy.takeDamage(p.damage);
            this.effects.createExplosion(p.x, p.y);
            soundManager.play('woodHit', 0.7);

            if (enemy.isDead) {
              this.score += 1;
              soundManager.play('explosion');
              soundManager.play('scorePoint');
              this.events.emit('score:update', this.score);
            }
            break;
          }
        }
      }

      // Projétil do Inimigo -> atinge Jogador
      if (!p.isDead && p.owner === 'enemy') {
        if (!this.player.isDead && checkCircleCollision(p, p.radius, this.player, this.player.radius)) {
          p.isDead = true;
          this.player.takeDamage(p.damage);
          this.effects.createExplosion(p.x, p.y);
          soundManager.play('woodHit', 0.8);
          soundManager.play('explosion', 0.5);
        }
      }

      if (p.isDead) {
        this.entityLayer.removeChild(p.view);
        p.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }

  private spawnEnemy(): void {
    // Spawna no topo ou laterais longe do jogador
    const side = Math.random();
    let sx = Math.random() * this.app.screen.width;
    let sy = 30;

    if (side < 0.3) {
      sx = 30;
      sy = Math.random() * (this.app.screen.height * 0.5);
    } else if (side > 0.7) {
      sx = this.app.screen.width - 30;
      sy = Math.random() * (this.app.screen.height * 0.5);
    }

    const type = Math.random() > 0.5 ? 'chaser' : 'shooter';
    const id = `enemy_${Date.now()}_${Math.random()}`;

    const enemy: Enemy =
      type === 'chaser'
        ? new ChaserEnemy(id, sx, sy, this.config)
        : new ShooterEnemy(id, sx, sy, this.config);

    this.enemies.push(enemy);
    this.entityLayer.addChild(enemy.view);
  }

  public endGame(reason: 'time_up' | 'player_destroyed' | 'surrender'): void {
    this.stop();
    this.events.emit('game:over', {
      score: this.score,
      duration: this.config.sessionDuration - this.timeRemaining,
      reason,
    });
  }

  public destroy(): void {
    this.stop();
    this.events.clear();
    this.backgroundLayer.destroy({ children: true });
    this.islandLayer.destroy({ children: true });
    this.entityLayer.destroy({ children: true });
    this.effectLayer.destroy({ children: true });
    this.uiLayer.destroy({ children: true });
  }
}

