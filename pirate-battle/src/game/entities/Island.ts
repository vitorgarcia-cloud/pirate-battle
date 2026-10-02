import { Container, Sprite, Texture, Graphics } from 'pixi.js';
import type { Entity, Position } from './Entity';
import { checkCircleCollision } from '../systems/CollisionSystem';

export interface SolidBlock {
  x: number;
  y: number;
  radius: number;
}

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
  public matrix: (string | null)[][];
  public solidBlocks: SolidBlock[] = [];
  public tileSize: number;

  constructor(
    id: string,
    x: number,
    y: number,
    matrix: (string | null)[][],
    tileSize: number = 72
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.matrix = matrix;
    this.tileSize = tileSize;

    const rows = matrix.length;
    const cols = matrix[0]?.length || 3;
    this.width = cols * tileSize;
    this.height = rows * tileSize;
    this.radius = Math.max(this.width, this.height) / 2;

    this.view = new Container();
    this.view.x = x;
    this.view.y = y;

    this.createTileMapIsland();
  }

  private createTileMapIsland(): void {
    const rows = this.matrix.length;
    const cols = this.matrix[0]?.length || 3;
    const startX = -(this.width / 2);
    const startY = -(this.height / 2);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const textureAlias = this.matrix[r][c];
        if (!textureAlias) continue; // Célula de água aberta no formato da ilha

        const localX = startX + c * this.tileSize;
        const localY = startY + r * this.tileSize;
        const blockCenterX = this.x + localX + this.tileSize / 2;
        const blockCenterY = this.y + localY + this.tileSize / 2;

        // Registra bloco de terra firme para colisão e geração de água rasa ao redor
        this.solidBlocks.push({
          x: blockCenterX,
          y: blockCenterY,
          radius: (this.tileSize / 2) * 0.85,
        });

        try {
          const texture = Texture.from(textureAlias);
          const sprite = new Sprite(texture);
          sprite.x = localX;
          sprite.y = localY;
          sprite.width = this.tileSize;
          sprite.height = this.tileSize;
          this.view.addChild(sprite);
        } catch {
          const g = new Graphics();
          g.rect(localX, localY, this.tileSize, this.tileSize);
          g.fill({ color: 0xd97706 });
          this.view.addChild(g);
        }
      }
    }
  }

  public collidesWith(point: Position, radius: number): boolean {
    for (const block of this.solidBlocks) {
      if (checkCircleCollision(point, radius, block, block.radius)) {
        return true;
      }
    }
    return false;
  }

  public update(_deltaTime: number): void {}

  public destroy(): void {
    this.isDead = true;
    this.view.destroy({ children: true });
  }
}
