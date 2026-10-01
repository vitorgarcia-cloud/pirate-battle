export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  rotation: number;
  radius: number;
  isDead: boolean;
  update(deltaTime: number): void;
  destroy(): void;
}
