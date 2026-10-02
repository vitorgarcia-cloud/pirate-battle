import { Container, Sprite, Texture, Graphics } from 'pixi.js';

interface ActiveEffect {
  displayObject: Sprite | Graphics;
  life: number;
  maxLife: number;
  type?: 'explosion' | 'wake';
  initialScale?: number;
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
        displayObject: sprite,
        life: 0.3,
        maxLife: 0.3,
        type: 'explosion',
      });
    } catch {
      // Fallback silencioso se textura não existir
    }
  }

  public createWaterWake(x: number, y: number, rotation: number, radius: number = 16): void {
    const g = new Graphics();
    const wakeWidth = radius * 0.9;
    const wakeLength = radius * 0.8;

    // Desenha arco e ondas de esteira na popa do navio
    g.moveTo(-wakeLength, -wakeWidth);
    g.quadraticCurveTo(0, 0, -wakeLength, wakeWidth);
    g.stroke({ width: 2.2, color: 0xe0f2fe, alpha: 0.75 });

    // Espuma central suave
    g.circle(-wakeLength * 0.35, 0, radius * 0.28);
    g.fill({ color: 0xbae6fd, alpha: 0.4 });

    g.x = x;
    g.y = y;
    g.rotation = rotation;
    this.container.addChild(g);

    this.activeEffects.push({
      displayObject: g,
      life: 0.45,
      maxLife: 0.45,
      type: 'wake',
      initialScale: 0.7,
    });
  }

  public update(deltaTime: number): void {
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      effect.life -= deltaTime;

      if (effect.life <= 0 || effect.displayObject.destroyed) {
        if (!effect.displayObject.destroyed) {
          if (effect.displayObject.parent) {
            effect.displayObject.parent.removeChild(effect.displayObject);
          }
          effect.displayObject.destroy();
        }
        this.activeEffects.splice(i, 1);
        continue;
      }

      // Animação de expansão e fade out sincronizados com deltaTime
      const progress = 1 - effect.life / effect.maxLife;
      effect.displayObject.alpha = Math.max(0, (1 - progress) * (effect.type === 'wake' ? 0.75 : 1));

      if (effect.type === 'wake') {
        const scale = (effect.initialScale || 0.7) + progress * 0.5;
        effect.displayObject.scale.set(scale);
      } else {
        const currentScale = 0.8 + progress * 0.4;
        effect.displayObject.scale.set(currentScale);
      }
    }
  }

  public clear(): void {
    for (const effect of this.activeEffects) {
      if (!effect.displayObject.destroyed) {
        effect.displayObject.destroy();
      }
    }
    this.activeEffects = [];
    this.container.removeChildren();
  }
}
