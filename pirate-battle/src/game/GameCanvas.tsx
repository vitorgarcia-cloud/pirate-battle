import React, { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { GameEngine } from './core/GameEngine';
import { AssetLoader } from './core/AssetLoader';

import type { GameConfig } from './types/config';

interface GameCanvasProps {
  config?: GameConfig;
  onEngineReady?: (engine: GameEngine) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ config, onEngineReady }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const onEngineReadyRef = useRef(onEngineReady);

  useEffect(() => {
    onEngineReadyRef.current = onEngineReady;
  }, [onEngineReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isCancelled = false;
    let pixiApp: Application | null = null;
    let engine: GameEngine | null = null;

    const initPixi = async () => {
      try {
        // Pré-carregamento de assets com progresso
        await AssetLoader.loadAll((prog) => {
          if (!isCancelled) {
            setLoadingProgress(Math.round(prog * 100));
          }
        });

        if (isCancelled) return;
        setIsLoading(false);

        const app = new Application();
        await app.init({
          width: 1200,
          height: 900,
          backgroundColor: 0x1a3b5c,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        if (isCancelled) {
          app.destroy(true, { children: true });
          return;
        }

        pixiApp = app;
        container.appendChild(app.canvas);

        engine = new GameEngine(app, config);
        await engine.init();
        engine.start();

        if (onEngineReadyRef.current) {
          onEngineReadyRef.current(engine);
        }
      } catch (err) {
        console.error('Error initializing Pixi application/engine:', err);
      }
    };

    initPixi();

    return () => {
      isCancelled = true;
      if (engine) {
        engine.destroy();
        engine = null;
      }
      if (pixiApp) {
        if (pixiApp.canvas && pixiApp.canvas.parentNode) {
          pixiApp.canvas.parentNode.removeChild(pixiApp.canvas);
        }
        pixiApp.destroy(true, { children: true });
        pixiApp = null;
      }
    };
  }, []);

  return (
    <div className="game-canvas-container">
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#0f172a',
            color: '#38bdf8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
            Loading Pirate Battle Assets...
          </div>
          <div
            style={{
              width: '240px',
              height: '10px',
              backgroundColor: '#1e293b',
              borderRadius: '5px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${loadingProgress}%`,
                height: '100%',
                backgroundColor: '#38bdf8',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
          <span style={{ marginTop: '8px', fontSize: '14px', color: '#94a3b8' }}>
            {loadingProgress}%
          </span>
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: '#1a3b5c',
        }}
      />
    </div>
  );
};