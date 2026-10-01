import type { Entity, Position } from '../entities/Entity';

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

export function checkEntityCircleCollision(e1: Entity, e2: Entity): boolean {
  return checkCircleCollision(
    { x: e1.x, y: e1.y },
    e1.radius,
    { x: e2.x, y: e2.y },
    e2.radius
  );
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
