import { Application, Container, Sprite, Texture } from 'pixi.js';
import { EventEmitter } from './EventEmitter';
import { AssetLoader } from './AssetLoader';
import { InputManager } from './InputManager';
import { EffectManager } from './EffectManager';
import { DEFAULT_GAME_CONFIG, type GameConfig } from '../types/config';
import { PlayerShip } from '../entities/PlayerShip';
import { ChaserEnemy, ShooterEnemy, type Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Island } from '../entities/Island';
import { checkCircleCollision, clamp } from '../systems/CollisionSystem';

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
    await AssetLoader.loadAll();
    this.createBackground();
    this.createIslands();
    this.createPlayer();
  }

  private createBackground(): void {
    const { width, height } = this.app.screen;
    try {
      const waterTexture = Texture.from('waterTile');
      const tileSize = 64;
      for (let x = 0; x < width; x += tileSize) {
        for (let y = 0; y < height; y += tileSize) {
          const tile = new Sprite(waterTexture);
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
    // Adiciona 2 ilhas bloqueadoras estratégicas na arena
    const island1 = new Island('island_1', 220, 200, 128, 128);
    const island2 = new Island('island_2', 580, 380, 128, 128);

    this.islands.push(island1, island2);
    this.islandLayer.addChild(island1.view);
    this.islandLayer.addChild(island2.view);
  }

  private createPlayer(): void {
    const startX = this.app.screen.width / 2;
    const startY = this.app.screen.height - 100;
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

    this.events.emit('game:started', { time: this.timeRemaining });
  }

  public pause(): void {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    this.input.reset();
    this.events.emit('game:paused');
  }

  public resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.events.emit('game:resumed');
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.input.stopListening();
    this.app.ticker.remove(this.boundTick);

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

    // Restringe Player aos limites da arena
    this.player.x = clamp(this.player.x, this.player.radius, this.app.screen.width - this.player.radius);
    this.player.y = clamp(this.player.y, this.player.radius, this.app.screen.height - this.player.radius);

    // Colisão do Player com Ilhas
    for (const island of this.islands) {
      if (checkCircleCollision(this.player, this.player.radius, island, island.radius)) {
        this.player.x = prevPlayerX;
        this.player.y = prevPlayerY;
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
      this.endGame('player_destroyed');
      return;
    }

    // 2. Spawn de Inimigos
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.config.enemySpawnInterval) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // 3. Atualiza Inimigos
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const prevX = enemy.x;
      const prevY = enemy.y;

      enemy.updateAI(dt, this.player, this.islands, (proj) => this.addProjectile(proj));

      // Limites da arena
      enemy.x = clamp(enemy.x, enemy.radius, this.app.screen.width - enemy.radius);
      enemy.y = clamp(enemy.y, enemy.radius, this.app.screen.height - enemy.radius);

      // Colisão de inimigo com ilhas
      for (const island of this.islands) {
        if (checkCircleCollision(enemy, enemy.radius, island, island.radius)) {
          enemy.x = prevX;
          enemy.y = prevY;
          break;
        }
      }
      enemy.view.x = enemy.x;
      enemy.view.y = enemy.y;

      // Colisão de Chaser com Player (Impacto direto suicida)
      if (enemy.type === 'chaser' && !enemy.isDead && !this.player.isDead) {
        if (checkCircleCollision(enemy, enemy.radius, this.player, this.player.radius)) {
          enemy.takeDamage(999); // Auto-destrói
          this.player.takeDamage((enemy as ChaserEnemy).damage);
          this.effects.createExplosion(enemy.x, enemy.y);
          // Auto-destruição NÃO gera ponto
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
          if (checkCircleCollision(p, p.radius, island, island.radius)) {
            p.isDead = true;
            this.effects.createExplosion(p.x, p.y);
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

            if (enemy.isDead) {
              this.score += 1;
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

