import { Container, Sprite, Texture, Graphics } from 'pixi.js';
import type { Entity } from './Entity';
import type { InputState } from '../core/InputManager';
import type { GameConfig } from '../types/config';
import { Projectile } from './Projectile';

export class PlayerShip implements Entity {
  public id: string = 'player';
  public x: number;
  public y: number;
  public rotation: number = -Math.PI / 2; // Virado para cima inicialmente
  public radius: number = 22;
  public isDead: boolean = false;

  public health: number;
  public maxHealth: number;

  private config: GameConfig;
  public view: Container;
  private sprite!: Sprite;
  private healthBar!: Graphics;

  private primaryCooldownTimer: number = 0;
  private sideCooldownTimer: number = 0;

  constructor(x: number, y: number, config: GameConfig) {
    this.x = x;
    this.y = y;
    this.config = config;
    this.health = config.playerMaxHealth;
    this.maxHealth = config.playerMaxHealth;

    this.view = new Container();
    this.view.x = x;
    this.view.y = y;
    this.view.rotation = this.rotation;

    this.initView();
  }

  private initView(): void {
    try {
      const texture = Texture.from('playerShip');
      this.sprite = new Sprite(texture);
      this.sprite.anchor.set(0.5);
      this.sprite.scale.set(0.7);
      // Ajuste de orientação do asset para que a proa aponte para a direita no ângulo 0
      this.sprite.rotation = Math.PI / 2;
      this.view.addChild(this.sprite);
    } catch {
      const g = new Graphics();
      g.poly([
        { x: 25, y: 0 },
        { x: -20, y: -15 },
        { x: -10, y: 0 },
        { x: -20, y: 15 },
      ]);
      g.fill({ color: 0x3b82f6 });
      this.view.addChild(g);
    }

    this.healthBar = new Graphics();
    this.view.addChild(this.healthBar);
    this.updateHealthBar();
  }

  private updateHealthBar(): void {
    this.healthBar.clear();
    const barWidth = 40;
    const barHeight = 4;
    const percent = Math.max(0, this.health / this.maxHealth);

    // Fundo da barra
    this.healthBar.rect(-barWidth / 2, -35, barWidth, barHeight);
    this.healthBar.fill({ color: 0x334155 });

    // Vida restante
    this.healthBar.rect(-barWidth / 2, -35, barWidth * percent, barHeight);
    const color = percent > 0.5 ? 0x22c55e : percent > 0.25 ? 0xeab308 : 0xef4444;
    this.healthBar.fill({ color });
  }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();

    // Feedback visual de deterioração (opacidade e cor)
    if (this.sprite) {
      const damageRatio = this.health / this.maxHealth;
      this.sprite.alpha = 0.5 + 0.5 * damageRatio;
    }

    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  public updateWithInput(
    deltaTime: number,
    input: Readonly<InputState>,
    onSpawnProjectile: (p: Projectile) => void
  ): void {
    if (this.isDead) return;

    // Rotação
    if (input.rotateLeft) {
      this.rotation -= this.config.playerRotationSpeed * deltaTime;
    }
    if (input.rotateRight) {
      this.rotation += this.config.playerRotationSpeed * deltaTime;
    }

    // Movimentação para frente
    if (input.forward) {
      this.x += Math.cos(this.rotation) * this.config.playerSpeed * deltaTime;
      this.y += Math.sin(this.rotation) * this.config.playerSpeed * deltaTime;
    }

    // Cooldowns
    if (this.primaryCooldownTimer > 0) {
      this.primaryCooldownTimer -= deltaTime;
    }
    if (this.sideCooldownTimer > 0) {
      this.sideCooldownTimer -= deltaTime;
    }

    // Disparo Frontal (1 projétil)
    if (input.firePrimary && this.primaryCooldownTimer <= 0) {
      this.primaryCooldownTimer = this.config.playerCannonCooldown;
      const frontX = this.x + Math.cos(this.rotation) * (this.radius + 5);
      const frontY = this.y + Math.sin(this.rotation) * (this.radius + 5);
      
      onSpawnProjectile(
        new Projectile(
          `bullet_p_${Date.now()}_${Math.random()}`,
          frontX,
          frontY,
          this.rotation,
          this.config.bulletSpeed,
          this.config.bulletDamage,
          this.config.bulletLifetime,
          'player'
        )
      );
    }

    // Disparo Lateral Esquerdo (3 projéteis paralelos)
    if (input.fireSideLeft && this.sideCooldownTimer <= 0) {
      this.sideCooldownTimer = this.config.playerSideCannonCooldown;
      this.fireBroadside(-Math.PI / 2, onSpawnProjectile);
    }

    // Disparo Lateral Direito (3 projéteis paralelos)
    if (input.fireSideRight && this.sideCooldownTimer <= 0) {
      this.sideCooldownTimer = this.config.playerSideCannonCooldown;
      this.fireBroadside(Math.PI / 2, onSpawnProjectile);
    }

    this.view.x = this.x;
    this.view.y = this.y;
    this.view.rotation = this.rotation;
  }

  private fireBroadside(sideAngleOffset: number, onSpawnProjectile: (p: Projectile) => void): void {
    const fireAngle = this.rotation + sideAngleOffset;
    const offsets = [-14, 0, 14]; // 3 posições ao longo do casco

    offsets.forEach((offset, idx) => {
      // Posição ao longo do navio (eixo longitudinal)
      const px = this.x + Math.cos(this.rotation) * offset + Math.cos(fireAngle) * 12;
      const py = this.y + Math.sin(this.rotation) * offset + Math.sin(fireAngle) * 12;

      onSpawnProjectile(
        new Projectile(
          `bullet_p_broad_${Date.now()}_${idx}_${Math.random()}`,
          px,
          py,
          fireAngle,
          this.config.bulletSpeed,
          this.config.bulletDamage,
          this.config.bulletLifetime,
          'player'
        )
      );
    });
  }

  public update(deltaTime: number): void {
    // Implementação básica de Entity
    if (this.primaryCooldownTimer > 0) this.primaryCooldownTimer -= deltaTime;
    if (this.sideCooldownTimer > 0) this.sideCooldownTimer -= deltaTime;
  }

  public destroy(): void {
    this.isDead = true;
    this.view.destroy({ children: true });
  }
}
