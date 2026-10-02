import { Sprite, Texture, Graphics } from 'pixi.js';
import type { InputState } from '../core/InputManager';
import type { GameConfig } from '../types/config';
import { BaseShip } from './BaseShip';
import { Projectile } from './Projectile';
import { soundManager } from '../core/SoundManager';

export class PlayerShip extends BaseShip {
  private config: GameConfig;
  private primaryCooldownTimer: number = 0;
  private sideCooldownTimer: number = 0;

  constructor(x: number, y: number, config: GameConfig) {
    super('player', x, y, 22, config.playerMaxHealth, 'playerShip', 40, -35);
    this.rotation = -Math.PI / 2; // Virado para cima inicialmente
    this.config = config;

    this.view.rotation = this.rotation;
    this.initView();
  }

  protected override getHealthBarColor(percent: number): number {
    return percent > 0.5 ? 0x22c55e : percent > 0.25 ? 0xeab308 : 0xef4444;
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

    this.initHealthBar();
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

    // Atualização dos Cooldowns (única fonte de decremento)
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
      
      soundManager.play('cannonFire', 0.9);

      onSpawnProjectile(
        new Projectile(
          null,
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
      soundManager.play('cannonBroadside');
      this.fireBroadside(-Math.PI / 2, onSpawnProjectile);
    }

    // Disparo Lateral Direito (3 projéteis paralelos)
    if (input.fireSideRight && this.sideCooldownTimer <= 0) {
      this.sideCooldownTimer = this.config.playerSideCannonCooldown;
      soundManager.play('cannonBroadside');
      this.fireBroadside(Math.PI / 2, onSpawnProjectile);
    }

    this.syncView();
  }

  private fireBroadside(sideAngleOffset: number, onSpawnProjectile: (p: Projectile) => void): void {
    const fireAngle = this.rotation + sideAngleOffset;
    const offsets = [-14, 0, 14]; // 3 posições ao longo do casco

    offsets.forEach((offset) => {
      // Posição ao longo do navio (eixo longitudinal)
      const px = this.x + Math.cos(this.rotation) * offset + Math.cos(fireAngle) * 12;
      const py = this.y + Math.sin(this.rotation) * offset + Math.sin(fireAngle) * 12;

      onSpawnProjectile(
        new Projectile(
          null,
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

  public override update(_deltaTime: number): void {
    // Sem decremento redundante de cooldown aqui
  }
}
