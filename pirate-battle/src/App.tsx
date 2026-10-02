import { useState, useCallback } from 'react';
import { GameCanvas } from './game/GameCanvas';
import { GameHUD } from './ui/GameHUD';
import { PauseOverlay } from './ui/PauseOverlay';
import { TouchControls } from './ui/TouchControls';
import { MainMenu } from './ui/MainMenu';
import { OptionsModal } from './ui/OptionsModal';
import { ResultScreen } from './ui/ResultScreen';
import { DEFAULT_GAME_CONFIG, type GameConfig } from './game/types/config';
import type { GameEngine } from './game/core/GameEngine';
import type { MatchEndReason, MatchRecord } from './api/types';
import { useSubmitMatch } from './hooks/useMatchData';

type ScreenState = 'menu' | 'playing' | 'result';

const STORAGE_OPTIONS_KEY = 'pirate_battle_player_options';

function loadSavedConfig(): GameConfig {
  try {
    const raw = localStorage.getItem(STORAGE_OPTIONS_KEY);
    return raw ? { ...DEFAULT_GAME_CONFIG, ...JSON.parse(raw) } : DEFAULT_GAME_CONFIG;
  } catch {
    return DEFAULT_GAME_CONFIG;
  }
}

function App() {
  const [screen, setScreen] = useState<ScreenState>('menu');
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [gameConfig, setGameConfig] = useState<GameConfig>(loadSavedConfig);

  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [score, setScore] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(90);
  const [playerHealth, setPlayerHealth] = useState<number>(100);
  const [playerMaxHealth, setPlayerMaxHealth] = useState<number>(100);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Dados do resultado da última partida
  const [lastResult, setLastResult] = useState<{
    score: number;
    duration: number;
    reason: MatchEndReason;
  } | null>(null);

  const submitMatchMutation = useSubmitMatch();

  const handleSaveOptions = (newConfig: GameConfig) => {
    setGameConfig(newConfig);
    localStorage.setItem(STORAGE_OPTIONS_KEY, JSON.stringify(newConfig));
  };

  const handleStartGame = () => {
    setScore(0);
    setTimeRemaining(gameConfig.sessionDuration);
    setPlayerHealth(gameConfig.playerMaxHealth);
    setIsPaused(false);
    setScreen('playing');
  };

  const handleGameOver = useCallback(
    (data: { score: number; duration: number; reason: MatchEndReason }) => {
      setLastResult(data);
      setScreen('result');

      // Submete a partida para o ranking e histórico
      const matchRecord: MatchRecord = {
        id: `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        playerId: 'player_local',
        playerName: 'Captain Jack',
        score: data.score,
        durationSeconds: Math.round(data.duration),
        endReason: data.reason,
        createdAt: new Date().toISOString(),
        configSnapshot: {
          sessionDuration: gameConfig.sessionDuration,
          enemySpawnInterval: gameConfig.enemySpawnInterval,
        },
      };

      submitMatchMutation.mutate(matchRecord);
    },
    [gameConfig, submitMatchMutation]
  );

  const handleEngineReady = useCallback(
    (eng: GameEngine) => {
      setEngine(eng);
      setTimeRemaining(eng.config.sessionDuration);
      setPlayerHealth(eng.config.playerMaxHealth);
      setPlayerMaxHealth(eng.config.playerMaxHealth);

      eng.events.on('score:update', (newScore: number) => {
        setScore(newScore);
      });

      eng.events.on('time:update', (newTime: number) => {
        setTimeRemaining(newTime);
      });

      eng.events.on('player:health', (data: { health: number; maxHealth: number }) => {
        setPlayerHealth(data.health);
        setPlayerMaxHealth(data.maxHealth);
      });

      eng.events.on('game:paused', () => {
        setIsPaused(true);
      });

      eng.events.on('game:resumed', () => {
        setIsPaused(false);
      });

      eng.events.on('game:over', handleGameOver);
    },
    [handleGameOver]
  );

  const handlePauseToggle = () => {
    if (!engine) return;
    if (isPaused) {
      engine.resume();
    } else {
      engine.pause();
    }
  };

  const handleAbandonMatch = () => {
    if (engine) {
      engine.stop();
    }
    setScreen('menu');
  };

  return (
    <main
      className="scene-container"
      style={{
        backgroundImage:
          screen !== 'playing' ? "url('/assets/ui_scene_background.png')" : 'none',
      }}
    >
      {/* 1. TELA DE MENU PRINCIPAL */}
      {screen === 'menu' && (
        <MainMenu onStartGame={handleStartGame} onOpenOptions={() => setShowOptions(true)} />
      )}

      {/* 2. TELA DE COMBATE / ARENA */}
      {screen === 'playing' && (
        <div className="game-arena-wrapper">
          <GameHUD
            score={score}
            timeRemaining={timeRemaining}
            playerHealth={playerHealth}
            playerMaxHealth={playerMaxHealth}
            isPaused={isPaused}
            onPauseToggle={handlePauseToggle}
          />

          <GameCanvas config={gameConfig} onEngineReady={handleEngineReady} />

          {engine && <TouchControls input={engine.input} />}

          {isPaused && (
            <PauseOverlay
              onResume={handlePauseToggle}
              onOpenOptions={() => setShowOptions(true)}
              onMainMenu={handleAbandonMatch}
            />
          )}
        </div>
      )}

      {/* 3. TELA DE RESULTADO */}
      {screen === 'result' && lastResult && (
        <ResultScreen
          score={lastResult.score}
          durationSeconds={lastResult.duration}
          endReason={lastResult.reason}
          onPlayAgain={handleStartGame}
          onMainMenu={() => setScreen('menu')}
        />
      )}

      {/* MODAL DE OPÇÕES */}
      {showOptions && (
        <OptionsModal
          currentConfig={gameConfig}
          onSave={handleSaveOptions}
          onClose={() => setShowOptions(false)}
        />
      )}
    </main>
  );
}

export default App;