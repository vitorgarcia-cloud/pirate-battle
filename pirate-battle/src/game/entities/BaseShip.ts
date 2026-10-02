import { Container, Sprite, Texture, Graphics } from 'pixi.js';
import type { Entity } from './Entity';

export abstract class BaseShip implements Entity {
  public id: string;
  public x: number;
  public y: number;
  public rotation: number = 0;
  public radius: number;
  public isDead: boolean = false;

  public health: number;
  public maxHealth: number;

  public view: Container;
  protected sprite!: Sprite;
  protected healthBar!: Graphics;
  protected currentDamageStage: number = 1;

  protected baseTextureAlias: string;
  protected healthBarWidth: number;
  protected healthBarYOffset: number;

  constructor(
    id: string,
    x: number,
    y: number,
    radius: number,
    maxHealth: number,
    baseTextureAlias: string,
    healthBarWidth: number = 36,
    healthBarYOffset: number = -30
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.health = maxHealth;
    this.maxHealth = maxHealth;
    this.baseTextureAlias = baseTextureAlias;
    this.healthBarWidth = healthBarWidth;
    this.healthBarYOffset = healthBarYOffset;

    this.view = new Container();
    this.view.x = x;
    this.view.y = y;
  }

  protected initHealthBar(): void {
    this.healthBar = new Graphics();
    this.view.addChild(this.healthBar);
    this.updateHealthBar();
  }

  protected updateHealthBar(): void {
    if (!this.healthBar) return;
    this.healthBar.clear();
    const barHeight = 4;
    const percent = Math.max(0, this.health / this.maxHealth);

    // Fundo da barra
    this.healthBar.rect(-this.healthBarWidth / 2, this.healthBarYOffset, this.healthBarWidth, barHeight);
    this.healthBar.fill({ color: 0x334155 });

    // Vida restante
    this.healthBar.rect(-this.healthBarWidth / 2, this.healthBarYOffset, this.healthBarWidth * percent, barHeight);
    this.healthBar.fill({ color: this.getHealthBarColor(percent) });
  }

  protected getHealthBarColor(_percent: number): number {
    return 0xef4444; // Cor padrão (vermelho)
  }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();
    this.updateDamageVisual();

    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  protected updateDamageVisual(): void {
    if (!this.sprite || !this.baseTextureAlias) return;
    const percent = this.health / this.maxHealth;

    let stage = 1;
    let textureAlias = `${this.baseTextureAlias}_full`;

    if (percent <= 0.33) {
      stage = 3;
      textureAlias = `${this.baseTextureAlias}_critical`;
    } else if (percent <= 0.66) {
      stage = 2;
      textureAlias = `${this.baseTextureAlias}_damaged`;
    }

    if (this.currentDamageStage !== stage) {
      this.currentDamageStage = stage;
      try {
        this.sprite.texture = Texture.from(textureAlias);
      } catch (err) {
        console.warn(`[BaseShip] Could not load texture '${textureAlias}':`, err);
      }
    }
  }

  public syncView(): void {
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
