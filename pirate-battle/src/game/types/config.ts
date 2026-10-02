export interface GameConfig {
  sessionDuration: number; // 60 a 180 segundos
  enemySpawnInterval: number; // segundos entre spawns
  playerSpeed: number;
  playerRotationSpeed: number;
  playerMaxHealth: number;
  playerCannonCooldown: number;
  playerSideCannonCooldown: number;
  bulletSpeed: number;
  bulletDamage: number;
  bulletLifetime: number;
  chaserSpeed: number;
  chaserHealth: number;
  chaserDamage: number;
  shooterSpeed: number;
  shooterHealth: number;
  shooterAttackRange: number;
  shooterCooldown: number;
  shooterBulletSpeed: number;
  shooterBulletDamage: number;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  sessionDuration: 90,
  enemySpawnInterval: 3.5,
  playerSpeed: 250,
  playerRotationSpeed: 2.8,
  playerMaxHealth: 10000,
  playerCannonCooldown: 0.4,
  playerSideCannonCooldown: 0.8,
  bulletSpeed: 450,
  bulletDamage: 25,
  bulletLifetime: 1.8,
  chaserSpeed: 200,
  chaserHealth: 30,
  chaserDamage: 30,
  shooterSpeed: 130,
  shooterHealth: 50,
  shooterAttackRange: 260,
  shooterCooldown: 1.6,
  shooterBulletSpeed: 240,
  shooterBulletDamage: 15,
};
