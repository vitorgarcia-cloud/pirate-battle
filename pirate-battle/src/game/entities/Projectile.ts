import { Container, Sprite, Texture, Graphics } from 'pixi.js';
import type { Entity } from './Entity';

export type ProjectileOwner = 'player' | 'enemy';

export class Projectile implements Entity {
  public id: string;
  public x: number;
  public y: number;
  public rotation: number;
  public radius: number = 6;
  public isDead: boolean = false;
  
  public speed: number;
  public damage: number;
  public lifetime: number;
  public owner: ProjectileOwner;

  public view: Container;

  constructor(
    id: string,
    x: number,
    y: number,
    angle: number,
    speed: number,
    damage: number,
    lifetime: number,
    owner: ProjectileOwner
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.rotation = angle;
    this.speed = speed;
    this.damage = damage;
    this.lifetime = lifetime;
    this.owner = owner;

    this.view = new Container();
    this.view.x = x;
    this.view.y = y;
    this.view.rotation = angle;

    this.createView();
  }

  private createView(): void {
    try {
      const texture = Texture.from('cannonBall');
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      sprite.scale.set(0.8);
      this.view.addChild(sprite);
    } catch {
      const g = new Graphics();
      g.circle(0, 0, this.radius);
      g.fill({ color: this.owner === 'player' ? 0xffea00 : 0xff3333 });
      this.view.addChild(g);
    }
  }

  public update(deltaTime: number): void {
    if (this.isDead) return;

    this.lifetime -= deltaTime;
    if (this.lifetime <= 0) {
      this.isDead = true;
      return;
    }

    // Avança na direção da rotação
    this.x += Math.cos(this.rotation) * this.speed * deltaTime;
    this.y += Math.sin(this.rotation) * this.speed * deltaTime;

    this.view.x = this.x;
    this.view.y = this.y;
  }

  public destroy(): void {
    this.isDead = true;
    this.view.destroy({ children: true });
  }
}
