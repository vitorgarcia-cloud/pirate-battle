import { Container, Sprite, Texture, Graphics } from 'pixi.js';
import type { Entity } from './Entity';
import type { PlayerShip } from './PlayerShip';
import type { Island } from './Island';
import type { GameConfig } from '../types/config';
import { Projectile } from './Projectile';

export interface Enemy extends Entity {
  type: 'chaser' | 'shooter';
  health: number;
  maxHealth: number;
  view: Container;
  takeDamage(amount: number): void;
  updateAI(
    deltaTime: number,
    player: PlayerShip,
    islands: Island[],
    onSpawnProjectile: (p: Projectile) => void
  ): void;
}

// ----------------- CHASER ENEMY -----------------
export class ChaserEnemy implements Enemy {
  public id: string;
  public type = 'chaser' as const;
  public x: number;
  public y: number;
  public rotation: number = 0;
  public radius: number = 18;
  public isDead: boolean = false;

  public health: number;
  public maxHealth: number;
  public damage: number;
  public speed: number;

  public view: Container;
  private sprite!: Sprite;
  private healthBar!: Graphics;

  constructor(id: string, x: number, y: number, config: GameConfig) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.health = config.chaserHealth;
    this.maxHealth = config.chaserHealth;
    this.damage = config.chaserDamage;
    this.speed = config.chaserSpeed;

    this.view = new Container();
    this.view.x = x;
    this.view.y = y;

    this.initView();
  }

  private initView(): void {
    try {
      const texture = Texture.from('chaserShip');
      this.sprite = new Sprite(texture);
      this.sprite.anchor.set(0.5);
      this.sprite.scale.set(0.6);
      this.sprite.rotation = Math.PI / 2;
      this.view.addChild(this.sprite);
    } catch {
      const g = new Graphics();
      g.circle(0, 0, this.radius);
      g.fill({ color: 0xef4444 });
      this.view.addChild(g);
    }

    this.healthBar = new Graphics();
    this.view.addChild(this.healthBar);
    this.updateHealthBar();
  }

  private updateHealthBar(): void {
    this.healthBar.clear();
    const barWidth = 32;
    const barHeight = 4;
    const percent = Math.max(0, this.health / this.maxHealth);

    this.healthBar.rect(-barWidth / 2, -28, barWidth, barHeight);
    this.healthBar.fill({ color: 0x334155 });

    this.healthBar.rect(-barWidth / 2, -28, barWidth * percent, barHeight);
    this.healthBar.fill({ color: 0xef4444 });
  }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();
    if (this.sprite) {
      this.sprite.alpha = 0.5 + 0.5 * (this.health / this.maxHealth);
    }
    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  public updateAI(deltaTime: number, player: PlayerShip, _islands: Island[]): void {
    if (this.isDead || player.isDead) return;

    // Ângulo em direção ao jogador
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const targetAngle = Math.atan2(dy, dx);

    // Rotação suave em direção ao alvo
    let diff = targetAngle - this.rotation;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.rotation += diff * Math.min(1, 4 * deltaTime);

    // Avança em linha reta
    this.x += Math.cos(this.rotation) * this.speed * deltaTime;
    this.y += Math.sin(this.rotation) * this.speed * deltaTime;

    this.view.x = this.x;
    this.view.y = this.y;
    this.view.rotation = this.rotation;
  }

  public update(_deltaTime: number): void {}

  public destroy(): void {
    this.isDead = true;
    this.view.destroy({ children: true });
  }
}

// ----------------- SHOOTER ENEMY -----------------
export class ShooterEnemy implements Enemy {
  public id: string;
  public type = 'shooter' as const;
  public x: number;
  public y: number;
  public rotation: number = 0;
  public radius: number = 20;
  public isDead: boolean = false;

  public health: number;
  public maxHealth: number;
  public speed: number;
  public attackRange: number;
  public cooldown: number;
  public bulletSpeed: number;
  public bulletDamage: number;

  private cooldownTimer: number = 0;
  public view: Container;
  private sprite!: Sprite;
  private healthBar!: Graphics;

  constructor(id: string, x: number, y: number, config: GameConfig) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.health = config.shooterHealth;
    this.maxHealth = config.shooterHealth;
    this.speed = config.shooterSpeed;
    this.attackRange = config.shooterAttackRange;
    this.cooldown = config.shooterCooldown;
    this.bulletSpeed = config.shooterBulletSpeed;
    this.bulletDamage = config.shooterBulletDamage;

    this.view = new Container();
    this.view.x = x;
    this.view.y = y;

    this.initView();
  }

  private initView(): void {
    try {
      const texture = Texture.from('shooterShip');
      this.sprite = new Sprite(texture);
      this.sprite.anchor.set(0.5);
      this.sprite.scale.set(0.65);
      this.sprite.rotation = Math.PI / 2;
      this.view.addChild(this.sprite);
    } catch {
      const g = new Graphics();
      g.circle(0, 0, this.radius);
      g.fill({ color: 0xf59e0b });
      this.view.addChild(g);
    }

    this.healthBar = new Graphics();
    this.view.addChild(this.healthBar);
    this.updateHealthBar();
  }

  private updateHealthBar(): void {
    this.healthBar.clear();
    const barWidth = 36;
    const barHeight = 4;
    const percent = Math.max(0, this.health / this.maxHealth);

    this.healthBar.rect(-barWidth / 2, -30, barWidth, barHeight);
    this.healthBar.fill({ color: 0x334155 });

    this.healthBar.rect(-barWidth / 2, -30, barWidth * percent, barHeight);
    this.healthBar.fill({ color: 0xf59e0b });
  }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();
    if (this.sprite) {
      this.sprite.alpha = 0.5 + 0.5 * (this.health / this.maxHealth);
    }
    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  public updateAI(
    deltaTime: number,
    player: PlayerShip,
    _islands: Island[],
    onSpawnProjectile: (p: Projectile) => void
  ): void {
    if (this.isDead || player.isDead) return;

    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= deltaTime;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const targetAngle = Math.atan2(dy, dx);

    // Ajusta rotação
    let diff = targetAngle - this.rotation;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.rotation += diff * Math.min(1, 3 * deltaTime);

    // Se estiver fora do alcance, avança. Se estiver perto demais, recua ligeiramente
    if (dist > this.attackRange) {
      this.x += Math.cos(this.rotation) * this.speed * deltaTime;
      this.y += Math.sin(this.rotation) * this.speed * deltaTime;
    } else if (dist < this.attackRange * 0.5) {
      this.x -= Math.cos(this.rotation) * (this.speed * 0.5) * deltaTime;
      this.y -= Math.sin(this.rotation) * (this.speed * 0.5) * deltaTime;
    }

    // Dispara projétil se estiver no alcance e cooldown zerado
    if (dist <= this.attackRange && this.cooldownTimer <= 0) {
      this.cooldownTimer = this.cooldown;
      const frontX = this.x + Math.cos(this.rotation) * (this.radius + 6);
      const frontY = this.y + Math.sin(this.rotation) * (this.radius + 6);

      onSpawnProjectile(
        new Projectile(
          `bullet_enemy_${Date.now()}_${Math.random()}`,
          frontX,
          frontY,
          this.rotation,
          this.bulletSpeed,
          this.bulletDamage,
          2.0,
          'enemy'
        )
      );
    }

    this.view.x = this.x;
    this.view.y = this.y;
    this.view.rotation = this.rotation;
  }

  public update(_deltaTime: number): void {}

  public destroy(): void {
    this.isDead = true;
    this.view.destroy({ children: true });
  }
}
