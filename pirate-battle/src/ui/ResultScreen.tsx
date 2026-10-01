import React from 'react';
import type { MatchEndReason } from '../api/types';

interface ResultScreenProps {
  score: number;
  durationSeconds: number;
  endReason: MatchEndReason;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  score,
  durationSeconds,
  endReason,
  onPlayAgain,
  onMainMenu,
}) => {
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const reasonText =
    endReason === 'time_up'
      ? 'TIME UP'
      : endReason === 'player_destroyed'
      ? 'DEFEATED'
      : 'SURRENDER';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 12, 22, 0.88)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 30,
      }}
    >
      <div
        className="pirate-panel"
        style={{
          width: '460px',
          minHeight: '480px',
          padding: '24px 30px',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '26px',
              color: 'var(--color-parchment)',
              letterSpacing: '2px',
              textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)',
              margin: '0 0 16px 0',
            }}
          >
            BATTLE COMPLETE
          </h2>

          {/* Large Score */}
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '64px',
              fontWeight: 900,
              color: 'var(--color-gold-warm)',
              textShadow: '0 4px 12px rgba(0, 0, 0, 0.8)',
              lineHeight: 1,
              marginBottom: '10px',
            }}
          >
            {score}
          </div>

          {/* Subtext info */}
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--color-parchment-dim)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            POINTS · {formatDuration(durationSeconds)} · {reasonText}
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <button onClick={onPlayAgain} className="pirate-btn-primary">
            Play Again
          </button>

          <button onClick={onMainMenu} className="pirate-btn-primary">
            Main Menu
          </button>
        </div>

        <div style={{ height: '4px' }} />
      </div>
    </div>
  );
};

