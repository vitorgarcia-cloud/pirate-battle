import { Container, Sprite, Texture } from 'pixi.js';

interface ActiveEffect {
  sprite: Sprite;
  life: number;
  maxLife: number;
}

export class EffectManager {
  private container: Container;
  private activeEffects: ActiveEffect[] = [];

  constructor(container: Container) {
    this.container = container;
  }

  public createExplosion(x: number, y: number): void {
    try {
      const texture = Texture.from('explosion1');
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      sprite.x = x;
      sprite.y = y;
      sprite.scale.set(0.8);
      this.container.addChild(sprite);

      this.activeEffects.push({
        sprite,
        life: 0.3,
        maxLife: 0.3,
      });
    } catch {
      // Fallback silencioso se textura não existir
    }
  }

  public update(deltaTime: number): void {
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      effect.life -= deltaTime;

      if (effect.life <= 0 || effect.sprite.destroyed) {
        if (!effect.sprite.destroyed) {
          if (effect.sprite.parent) {
            effect.sprite.parent.removeChild(effect.sprite);
          }
          effect.sprite.destroy();
        }
        this.activeEffects.splice(i, 1);
        continue;
      }

      // Animação de expansão e fade out sincronizados com deltaTime
      const progress = 1 - effect.life / effect.maxLife;
      effect.sprite.alpha = Math.max(0, 1 - progress);
      const currentScale = 0.8 + progress * 0.4;
      effect.sprite.scale.set(currentScale);
    }
  }

  public clear(): void {
    for (const effect of this.activeEffects) {
      if (!effect.sprite.destroyed) {
        effect.sprite.destroy();
      }
    }
    this.activeEffects = [];
    this.container.removeChildren();
  }
}
