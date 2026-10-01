import React from 'react';

interface GameHUDProps {
  score: number;
  timeRemaining: number;
  playerHealth: number;
  playerMaxHealth: number;
  isPaused: boolean;
  onPauseToggle: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  timeRemaining,
  playerHealth,
  playerMaxHealth,
  isPaused,
  onPauseToggle,
}) => {
  const healthPercent = Math.max(0, Math.min(100, (playerHealth / playerMaxHealth) * 100));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getHealthFillImage = () => {
    if (healthPercent > 50) return '/assets/png/default/ui/hud/health_fill_green.png';
    if (healthPercent > 25) return '/assets/png/default/ui/hud/health_fill_amber.png';
    return '/assets/png/default/ui/hud/health_fill_red.png';
  };

  return (
    <header
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {/* 1. Health Bar (Top-Left) */}
      <div
        className="pirate-health-container"
        role="progressbar"
        aria-valuenow={playerHealth}
        aria-valuemin={0}
        aria-valuemax={playerMaxHealth}
      >
        <img
          src="/assets/png/default/ui/hud/icon_heart.png"
          alt="Health Icon"
          className="pirate-health-heart"
        />
        <div className="pirate-health-track">
          <div
            className="pirate-health-fill"
            style={{
              width: `${healthPercent}%`,
              backgroundImage: `url('${getHealthFillImage()}')`,
            }}
          />
        </div>
        <div className="pirate-health-frame" />
        <span className="pirate-health-text">
          {playerHealth} / {playerMaxHealth}
        </span>
      </div>

      {/* 2. Score, Timer and Pause Button (Top-Right) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Score Badge */}
        <div className="pirate-counter-badge" title="Score">
          <img src="/assets/png/default/ui/hud/icon_score.png" alt="Score" />
          <span style={{ color: 'var(--color-gold-bright)' }}>{score}</span>
        </div>

        {/* Timer Badge */}
        <div className="pirate-counter-badge" title="Time Remaining">
          <img src="/assets/png/default/ui/hud/icon_time.png" alt="Time" />
          <span style={{ color: timeRemaining <= 10 ? 'var(--color-danger)' : 'var(--color-parchment)' }}>
            {formatTime(timeRemaining)}
          </span>
        </div>

        {/* Pause Wheel Button */}
        <button
          onClick={onPauseToggle}
          className={`pirate-btn-round ${isPaused ? 'active' : ''}`}
          style={{ pointerEvents: 'auto', width: '44px', height: '44px' }}
          title={isPaused ? 'Resume Game' : 'Pause Game'}
          aria-label={isPaused ? 'Resume Game' : 'Pause Game'}
        >
          <img
            src={
              isPaused
                ? '/assets/png/default/ui/controls/icon_play.png'
                : '/assets/png/default/ui/controls/icon_pause.png'
            }
            alt="Pause"
            style={{ width: '20px', height: '20px' }}
          />
        </button>
      </div>
    </header>
  );
};
