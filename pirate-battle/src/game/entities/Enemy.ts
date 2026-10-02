import { Container, Sprite, Texture, Graphics } from 'pixi.js';
import type { Entity, Position } from './Entity';
import type { PlayerShip } from './PlayerShip';
import type { Island } from './Island';
import type { GameConfig } from '../types/config';
import { BaseShip } from './BaseShip';
import { Projectile } from './Projectile';
import { soundManager } from '../core/SoundManager';
import {
  calculateObstacleAvoidance,
  smoothRotateTowards,
  moveWithIslandSliding,
} from '../systems/NavigationAI';

export interface Enemy extends Entity {
  type: 'chaser' | 'shooter';
  health: number;
  maxHealth: number;
  damage: number;
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
export class ChaserEnemy extends BaseShip implements Enemy {
  public type = 'chaser' as const;
  public damage: number;
  public speed: number;

  private stuckTimer: number = 0;
  private evadeTimer: number = 0;
  private evadeAngle: number = 0;
  private lastX: number = 0;
  private lastY: number = 0;

  constructor(id: string, x: number, y: number, config: GameConfig) {
    super(id, x, y, 18, config.chaserHealth, 'chaserShip', 32, -28);
    this.damage = config.chaserDamage;
    this.speed = config.chaserSpeed;
    this.lastX = x;
    this.lastY = y;

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

    this.initHealthBar();
  }

  public updateAI(deltaTime: number, player: PlayerShip, islands: Island[]): void {
    if (this.isDead || player.isDead) return;

    // Detecta se o navio ficou imóvel travado em canto
    const distMoved = Math.hypot(this.x - this.lastX, this.y - this.lastY);
    this.lastX = this.x;
    this.lastY = this.y;

    if (this.evadeTimer > 0) {
      this.evadeTimer -= deltaTime;
      this.rotation = smoothRotateTowards(this.rotation, this.evadeAngle, 6.0, deltaTime);
      const moveX = Math.cos(this.rotation) * this.speed * deltaTime;
      const moveY = Math.sin(this.rotation) * this.speed * deltaTime;
      const escapePos = moveWithIslandSliding({ x: this.x, y: this.y }, moveX, moveY, this.radius, islands);
      this.x = escapePos.x;
      this.y = escapePos.y;
      this.syncView();
      return;
    }

    if (distMoved < 0.2 * this.speed * deltaTime) {
      this.stuckTimer += deltaTime;
    } else {
      this.stuckTimer = Math.max(0, this.stuckTimer - deltaTime * 2);
    }

    if (this.stuckTimer > 0.25) {
      this.evadeTimer = 0.7;
      this.stuckTimer = 0;
      this.evadeAngle = this.rotation + (Math.random() > 0.5 ? Math.PI * 0.75 : -Math.PI * 0.75);
    }

    // Context Steering + Obstacle Avoidance
    const steering = calculateObstacleAvoidance(
      { x: this.x, y: this.y },
      this.rotation,
      { x: player.x, y: player.y },
      this.speed,
      deltaTime,
      this.radius,
      islands,
      130
    );

    this.rotation = smoothRotateTowards(this.rotation, steering.desiredRotation, 5.5, deltaTime);

    const newPos = moveWithIslandSliding(
      { x: this.x, y: this.y },
      steering.moveX,
      steering.moveY,
      this.radius,
      islands
    );

    this.x = newPos.x;
    this.y = newPos.y;

    this.syncView();
  }
}

// ----------------- SHOOTER ENEMY -----------------
export class ShooterEnemy extends BaseShip implements Enemy {
  public type = 'shooter' as const;
  public speed: number;
  public damage: number;
  public attackRange: number;
  public cooldown: number;
  public bulletSpeed: number;
  public bulletDamage: number;

  private cooldownTimer: number = 0;
  private stuckTimer: number = 0;
  private evadeTimer: number = 0;
  private evadeAngle: number = 0;
  private lastX: number = 0;
  private lastY: number = 0;

  constructor(id: string, x: number, y: number, config: GameConfig) {
    super(id, x, y, 20, config.shooterHealth, 'shooterShip', 36, -30);
    this.speed = config.shooterSpeed;
    this.damage = config.chaserDamage;
    this.attackRange = config.shooterAttackRange;
    this.cooldown = config.shooterCooldown;
    this.bulletSpeed = config.shooterBulletSpeed;
    this.bulletDamage = config.shooterBulletDamage;
    this.lastX = x;
    this.lastY = y;

    this.initView();
  }

  protected override getHealthBarColor(_percent: number): number {
    return 0xf59e0b;
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

    this.initHealthBar();
  }
  public updateAI(
    deltaTime: number,
    player: PlayerShip,
    islands: Island[],
    onSpawnProjectile: (p: Projectile) => void
  ): void {
    if (this.isDead || player.isDead) return;

    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= deltaTime;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 0.001;
    const angleToPlayer = Math.atan2(dy, dx);

    // 1. Detecta se o navio ficou imóvel travado em canto
    const distMoved = Math.hypot(this.x - this.lastX, this.y - this.lastY);
    this.lastX = this.x;
    this.lastY = this.y;

    if (this.evadeTimer > 0) {
      this.evadeTimer -= deltaTime;
      this.rotation = smoothRotateTowards(this.rotation, this.evadeAngle, 5.0, deltaTime);
      const moveX = Math.cos(this.rotation) * this.speed * deltaTime;
      const moveY = Math.sin(this.rotation) * this.speed * deltaTime;
      const escapePos = moveWithIslandSliding({ x: this.x, y: this.y }, moveX, moveY, this.radius, islands);
      this.x = escapePos.x;
      this.y = escapePos.y;
      this.syncView();
      return;
    }

    if (distMoved < 0.15 * this.speed * deltaTime) {
      this.stuckTimer += deltaTime;
    } else {
      this.stuckTimer = Math.max(0, this.stuckTimer - deltaTime * 2);
    }

    if (this.stuckTimer > 0.4) {
      this.evadeTimer = 0.6;
      this.stuckTimer = 0;
      this.evadeAngle = this.rotation + (Math.random() > 0.5 ? Math.PI * 0.6 : -Math.PI * 0.6);
    }

    // 2. Define Posição Tática de Movimento (sem recuo brusco de 180°)
    let targetPos: Position;
    if (dist > this.attackRange * 0.75) {
      targetPos = { x: player.x, y: player.y };
    } else if (dist < this.attackRange * 0.35) {
      // Se estiver muito próximo, orbita suavemente afastando em ângulo tangencial
      const perpAngle = angleToPlayer + Math.PI * 0.6;
      targetPos = { x: this.x + Math.cos(perpAngle) * 60, y: this.y + Math.sin(perpAngle) * 60 };
    } else {
      // Mantém patrulha tática em arco
      const strafeAngle = angleToPlayer + Math.PI * 0.35;
      targetPos = { x: this.x + Math.cos(strafeAngle) * 50, y: this.y + Math.sin(strafeAngle) * 50 };
    }

    // 3. Calcula Navegação Desviando de Ilhas
    const steering = calculateObstacleAvoidance(
      { x: this.x, y: this.y },
      this.rotation,
      targetPos,
      this.speed,
      deltaTime,
      this.radius,
      islands,
      110
    );

    // 4. Lógica de Mira vs Rotação
    // Se a frente estiver bloqueada por ilha, prioriza evitar a ilha. Caso contrário, mira no player.
    const targetRotation = (steering.isBlockedAhead || dist > this.attackRange)
      ? steering.desiredRotation
      : angleToPlayer;

    this.rotation = smoothRotateTowards(this.rotation, targetRotation, 4.0, deltaTime);

    // Movimentação tática (reduz velocidade durante combate para estabilizar mira)
    const moveSpeedMult = (dist <= this.attackRange && !steering.isBlockedAhead) ? 0.45 : 1.0;
    const intendedMoveX = Math.cos(this.rotation) * this.speed * moveSpeedMult * deltaTime;
    const intendedMoveY = Math.sin(this.rotation) * this.speed * moveSpeedMult * deltaTime;

    const newPos = moveWithIslandSliding(
      { x: this.x, y: this.y },
      intendedMoveX,
      intendedMoveY,
      this.radius,
      islands
    );
    this.x = newPos.x;
    this.y = newPos.y;

    // 5. Disparo de Projétil com Verificação de Mira
    // Só dispara se estiver no alcance, cooldown zerado E o navio estiver alinhado com o jogador (< 35°)
    let aimDiff = Math.abs(this.rotation - angleToPlayer);
    while (aimDiff > Math.PI) aimDiff = Math.abs(aimDiff - 2 * Math.PI);

    if (dist <= this.attackRange && this.cooldownTimer <= 0 && aimDiff < 0.6) {
      this.cooldownTimer = this.cooldown;
      const frontX = this.x + Math.cos(this.rotation) * (this.radius + 6);
      const frontY = this.y + Math.sin(this.rotation) * (this.radius + 6);

      soundManager.play('cannonFire', 0.5);

      onSpawnProjectile(
        new Projectile(
          null,
          frontX,
          frontY,
          angleToPlayer, // Dispara com mira direta no jogador!
          this.bulletSpeed,
          this.bulletDamage,
          2.0,
          'enemy'
        )
      );
    }

    this.syncView();
  }
}
