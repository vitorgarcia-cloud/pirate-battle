import type { Position } from '../entities/Entity';

export function checkCircleCollision(
  p1: Position,
  r1: number,
  p2: Position,
  r2: number
): boolean {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const distSq = dx * dx + dy * dy;
  const radSum = r1 + r2;
  return distSq <= radSum * radSum;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
