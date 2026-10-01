import React from 'react';

interface PauseOverlayProps {
  onResume: () => void;
  onOpenOptions?: () => void;
  onMainMenu?: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({ onResume, onOpenOptions, onMainMenu }) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(5, 12, 22, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
      }}
    >
      <div
        className="pirate-panel"
        style={{
          width: '420px',
          minHeight: '400px',
          padding: '24px 30px',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '28px',
              color: 'var(--color-gold-bright)',
              letterSpacing: '3px',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)',
              margin: '0 0 6px 0',
            }}
          >
            PAUSED
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: 'var(--color-parchment-dim)',
              fontStyle: 'italic',
            }}
          >
            Ready when you are.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
          <button onClick={onResume} className="pirate-btn-primary">
            Resume
          </button>

          {onOpenOptions && (
            <button onClick={onOpenOptions} className="pirate-btn-primary">
              Options
            </button>
          )}

          {onMainMenu && (
            <button onClick={onMainMenu} className="pirate-btn-primary">
              Main Menu
            </button>
          )}
        </div>

        <div style={{ height: '8px' }} />
      </div>
    </div>
  );
};

