import type { Position } from '../entities/Entity';
import type { Island } from '../entities/Island';

export interface SteeringResult {
  moveX: number;
  moveY: number;
  desiredRotation: number;
  isBlockedAhead: boolean;
}

/**
 * NAVEGAÇÃO INTELIGENTE POR STEERING CONTEXTUAL (Context Steering)
 * Cria 16 raios direcionais ao redor do navio para avaliar direções de Interesse (Player)
 * e direções de Perigo (Blocos das Ilhas), escolhendo a melhor rota livre de obstáculos.
 */
export function calculateObstacleAvoidance(
  currentPos: Position,
  currentRotation: number,
  targetPos: Position,
  speed: number,
  deltaTime: number,
  radius: number,
  islands: Island[],
  avoidanceRange: number = 130
): SteeringResult {
  const NUM_SLOTS = 16;
  const interest = new Array<number>(NUM_SLOTS).fill(0);
  const danger = new Array<number>(NUM_SLOTS).fill(0);

  // Vetor para o alvo (Player)
  const toTargetX = targetPos.x - currentPos.x;
  const toTargetY = targetPos.y - currentPos.y;
  const distToTarget = Math.hypot(toTargetX, toTargetY) || 0.001;
  const targetDirX = toTargetX / distToTarget;
  const targetDirY = toTargetY / distToTarget;

  // 1. Calcula Pontuação de Interesse para cada raio (360°)
  for (let i = 0; i < NUM_SLOTS; i++) {
    const angle = (i * 2 * Math.PI) / NUM_SLOTS;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    const dot = dirX * targetDirX + dirY * targetDirY;
    interest[i] = Math.max(0, dot); // 0 a 1
  }

  // 2. Calcula Perigo de Ilhas para cada raio
  let isBlockedAhead = false;

  for (const island of islands) {
    for (const block of island.solidBlocks) {
      const dx = block.x - currentPos.x;
      const dy = block.y - currentPos.y;
      const distToBlock = Math.hypot(dx, dy) || 0.001;
      const combinedRadius = radius + block.radius;
      const effectiveDetectRange = combinedRadius + avoidanceRange;

      if (distToBlock < effectiveDetectRange) {
        const blockDirX = dx / distToBlock;
        const blockDirY = dy / distToBlock;
        const proximity = 1 - Math.max(0, distToBlock - combinedRadius) / avoidanceRange;

        for (let i = 0; i < NUM_SLOTS; i++) {
          const angle = (i * 2 * Math.PI) / NUM_SLOTS;
          const dirX = Math.cos(angle);
          const dirY = Math.sin(angle);

          const dot = dirX * blockDirX + dirY * blockDirY;
          if (dot > 0) {
            // Perigo aumenta exponencialmente quanto mais próximo e em rota de colisão
            const dangerValue = Math.pow(dot, 1.8) * Math.pow(proximity, 1.5) * 3.5;
            danger[i] = Math.max(danger[i], dangerValue);

            // Verifica se a frente direta está bloqueada
            let angleDiff = Math.abs(angle - currentRotation);
            while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - 2 * Math.PI);
            if (angleDiff < 0.4 && dangerValue > 0.8) {
              isBlockedAhead = true;
            }
          }
        }
      }
    }
  }

  // 3. Escolhe a direção com Maior (Interesse - Perigo)
  let bestAngle = currentRotation;
  let maxScore = -Infinity;

  for (let i = 0; i < NUM_SLOTS; i++) {
    const angle = (i * 2 * Math.PI) / NUM_SLOTS;
    const score = interest[i] - danger[i];

    // Favorece ligeiramente a direção atual para evitar oscilação de leme
    let rotDiff = Math.abs(angle - currentRotation);
    while (rotDiff > Math.PI) rotDiff = Math.abs(rotDiff - 2 * Math.PI);
    const momentumBonus = Math.max(0, 1 - rotDiff / Math.PI) * 0.25;

    const finalScore = score + momentumBonus;

    if (finalScore > maxScore) {
      maxScore = finalScore;
      bestAngle = angle;
    }
  }

  return {
    moveX: Math.cos(currentRotation) * speed * deltaTime,
    moveY: Math.sin(currentRotation) * speed * deltaTime,
    desiredRotation: bestAngle,
    isBlockedAhead,
  };
}

/**
 * ROTAÇÃO ANGULAR SUAVE
 */
export function smoothRotateTowards(
  currentRotation: number,
  targetAngle: number,
  turnRate: number,
  deltaTime: number
): number {
  let diff = targetAngle - currentRotation;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;
  return currentRotation + diff * Math.min(1, turnRate * deltaTime);
}

/**
 * MOVIMENTAÇÃO COM DESLIZAMENTO POR NORMAL DE VETOR (Vector Normal Wall Sliding)
 * Desliza o navio de forma contínua e sem atrito ao longo de bordas de ilhas e cantos côncavos em L.
 */
export function moveWithIslandSliding(
  currentPos: Position,
  intendedDeltaX: number,
  intendedDeltaY: number,
  radius: number,
  islands: Island[]
): Position {
  const checkCollision = (x: number, y: number): { hit: boolean; block?: { x: number; y: number; radius: number } } => {
    for (const island of islands) {
      for (const block of island.solidBlocks) {
        const dx = x - block.x;
        const dy = y - block.y;
        const distSq = dx * dx + dy * dy;
        const minDist = radius + block.radius;
        if (distSq < minDist * minDist) {
          return { hit: true, block };
        }
      }
    }
    return { hit: false };
  };

  // 1. Tenta movimento completo ideal
  const targetX = currentPos.x + intendedDeltaX;
  const targetY = currentPos.y + intendedDeltaY;
  const targetCheck = checkCollision(targetX, targetY);

  if (!targetCheck.hit) {
    return { x: targetX, y: targetY };
  }

  // 2. Colidiu: calcula vetor Normal e Vetor Tangente ao bloco atingido
  const block = targetCheck.block!;
  const nx = (currentPos.x - block.x);
  const ny = (currentPos.y - block.y);
  const nLen = Math.hypot(nx, ny) || 0.001;
  const normX = nx / nLen;
  const normY = ny / nLen;

  // Projeta movimento no eixo Tangente (perpendicular à normal do bloco)
  const tangentX = -normY;
  const tangentY = normX;
  const dotTangent = intendedDeltaX * tangentX + intendedDeltaY * tangentY;

  // Tenta deslizar na direção tangente + pequeno impulso de afastamento da normal
  const pushOut = 1.5;
  const slideX = currentPos.x + tangentX * dotTangent + normX * pushOut;
  const slideY = currentPos.y + tangentY * dotTangent + normY * pushOut;

  if (!checkCollision(slideX, slideY).hit) {
    return { x: slideX, y: slideY };
  }

  // 3. Se tangente primária falhar (ex: canto côncavo duplo), testa os eixos ortogonais X/Y
  if (!checkCollision(targetX, currentPos.y).hit) {
    return { x: targetX, y: currentPos.y };
  }
  if (!checkCollision(currentPos.x, targetY).hit) {
    return { x: currentPos.x, y: targetY };
  }

  // 4. Teste de Raios de Fuga (360° em 12 passos de 30°) para desbloqueio
  const moveLen = Math.hypot(intendedDeltaX, intendedDeltaY) || 1;
  const escapeAngles = [
    Math.PI / 3, -Math.PI / 3,
    Math.PI / 2, -Math.PI / 2,
    (2 * Math.PI) / 3, -(2 * Math.PI) / 3,
    Math.PI
  ];

  const baseAngle = Math.atan2(intendedDeltaY, intendedDeltaX);
  for (const offset of escapeAngles) {
    const testAngle = baseAngle + offset;
    const testX = currentPos.x + Math.cos(testAngle) * moveLen;
    const testY = currentPos.y + Math.sin(testAngle) * moveLen;
    if (!checkCollision(testX, testY).hit) {
      return { x: testX, y: testY };
    }
  }

  // Se tudo falhar, empurra ligeiramente para longe do centro do bloco
  return {
    x: currentPos.x + normX * 1.5,
    y: currentPos.y + normY * 1.5,
  };
}
