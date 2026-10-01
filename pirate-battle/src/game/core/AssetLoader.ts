import { Assets } from 'pixi.js';

export const ASSET_MANIFEST = {
  // Navios
  playerShip: '/assets/png/default/ships/ship_1.png',
  chaserShip: '/assets/png/default/ships/ship_7.png',
  shooterShip: '/assets/png/default/ships/ship_13.png',
  
  // Projéteis e canhões
  cannonBall: '/assets/png/default/ship_parts/cannon_ball.png',
  cannon: '/assets/png/default/ship_parts/cannon.png',

  // Efeitos
  explosion1: '/assets/png/default/effects/explosion_1.png',
  explosion2: '/assets/png/default/effects/explosion_2.png',
  explosion3: '/assets/png/default/effects/explosion_3.png',
  fire1: '/assets/png/default/effects/fire_1.png',
  fire2: '/assets/png/default/effects/fire_2.png',

  // Ilhas e Terreno
  waterTile: '/assets/png/default/tiles/tile_73.png',
  sandTile: '/assets/png/default/tiles/tile_18.png',
  islandCenter: '/assets/png/default/tiles/tile_19.png',
  islandTop: '/assets/png/default/tiles/tile_2.png',
  islandBottom: '/assets/png/default/tiles/tile_34.png',
  islandLeft: '/assets/png/default/tiles/tile_17.png',
  islandRight: '/assets/png/default/tiles/tile_21.png',
};

export class AssetLoader {
  private static isLoaded = false;

  public static async loadAll(onProgress?: (progress: number) => void): Promise<void> {
    if (this.isLoaded) {
      if (onProgress) onProgress(1);
      return;
    }

    const entries = Object.entries(ASSET_MANIFEST);

    for (const [key, path] of entries) {
      try {
        Assets.add({ alias: key, src: path });
      } catch {
        // Ignora se já estiver adicionado
      }
    }

    const keys = entries.map(([key]) => key);
    
    // Carrega os assets registrando progresso
    await Assets.load(keys, (progress) => {
      if (onProgress) onProgress(progress);
    });

    this.isLoaded = true;
  }
}
