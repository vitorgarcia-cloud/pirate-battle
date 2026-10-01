import { Container, Sprite, Texture } from 'pixi.js';
import type { Entity } from './Entity';

export class Island implements Entity {
  public id: string;
  public x: number;
  public y: number;
  public rotation: number = 0;
  public radius: number;
  public width: number;
  public height: number;
  public isDead: boolean = false;
  public view: Container;

  constructor(id: string, x: number, y: number, width: number = 128, height: number = 128) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.radius = Math.min(width, height) / 2 - 4;

    this.view = new Container();
    this.view.x = x;
    this.view.y = y;

    this.createTileMapIsland();
  }

  private createTileMapIsland(): void {
    const tileSize = 64;
    const cols = Math.ceil(this.width / tileSize);
    const rows = Math.ceil(this.height / tileSize);

    const startX = -((cols * tileSize) / 2);
    const startY = -((rows * tileSize) / 2);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let textureAlias = 'islandCenter';

        if (r === 0) textureAlias = 'islandTop';
        else if (r === rows - 1) textureAlias = 'islandBottom';
        else if (c === 0) textureAlias = 'islandLeft';
        else if (c === cols - 1) textureAlias = 'islandRight';

        try {
          const texture = Texture.from(textureAlias);
          const sprite = new Sprite(texture);
          sprite.x = startX + c * tileSize;
          sprite.y = startY + r * tileSize;
          sprite.width = tileSize;
          sprite.height = tileSize;
          this.view.addChild(sprite);
        } catch {
          // Fallback se não encontrar
        }
      }
    }
  }

  public update(_deltaTime: number): void {}

  public destroy(): void {
    this.isDead = true;
    this.view.destroy({ children: true });
  }
}
