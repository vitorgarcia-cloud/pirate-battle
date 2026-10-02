import { Assets } from 'pixi.js';

export const ASSET_MANIFEST = {
  // Navios - 3 Estágios de Dano (Cheio > 66%, Danificado 33-66%, Crítico <= 33%)
  playerShip: '/assets/png/default/ships/ship_1.png',
  playerShip_full: '/assets/png/default/ships/ship_1.png',
  playerShip_damaged: '/assets/png/default/ships/ship_7.png',
  playerShip_critical: '/assets/png/default/ships/ship_13.png',

  chaserShip: '/assets/png/default/ships/ship_2.png',
  chaserShip_full: '/assets/png/default/ships/ship_2.png',
  chaserShip_damaged: '/assets/png/default/ships/ship_8.png',
  chaserShip_critical: '/assets/png/default/ships/ship_14.png',

  shooterShip: '/assets/png/default/ships/ship_6.png',
  shooterShip_full: '/assets/png/default/ships/ship_6.png',
  shooterShip_damaged: '/assets/png/default/ships/ship_12.png',
  shooterShip_critical: '/assets/png/default/ships/ship_18.png',

  // Projéteis e canhões
  cannonBall: '/assets/png/default/ship_parts/cannon_ball.png',
  cannon: '/assets/png/default/ship_parts/cannon.png',

  // Efeitos
  explosion1: '/assets/png/default/effects/explosion_1.png',
  explosion2: '/assets/png/default/effects/explosion_2.png',
  explosion3: '/assets/png/default/effects/explosion_3.png',
  fire1: '/assets/png/default/effects/fire_1.png',
  fire2: '/assets/png/default/effects/fire_2.png',

  // Água do Mar
  waterTile: '/assets/png/default/tiles/tile_73.png', // Mar profundo (asset atual)
  shallowWaterTile: '/assets/png/default/tiles/tile_73w.png', // Água rasa ao redor das ilhas

  // Tiles de Ilha (Padronizado)
  island_tl: '/assets/png/default/tiles/tile_1.png',
  island_t: '/assets/png/default/tiles/tile_2.png',
  island_tr: '/assets/png/default/tiles/tile_3.png',
  island_l: '/assets/png/default/tiles/tile_17.png',
  island_c: '/assets/png/default/tiles/tile_18.png',
  island_r: '/assets/png/default/tiles/tile_19.png',
  island_bl: '/assets/png/default/tiles/tile_33.png',
  island_b: '/assets/png/default/tiles/tile_34.png',
  island_br: '/assets/png/default/tiles/tile_35.png',
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
