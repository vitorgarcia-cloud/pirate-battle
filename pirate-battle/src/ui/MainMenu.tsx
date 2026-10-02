import React, { useState } from 'react';
import { LeaderboardTab } from './LeaderboardTab';
import { MatchHistoryTab } from './MatchHistoryTab';
import { soundManager } from '../game/core/SoundManager';

interface MainMenuProps {
  onStartGame: () => void;
  onOpenOptions: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onOpenOptions }) => {
  const [activeView, setActiveView] = useState<'menu' | 'ranking' | 'history'>('menu');

  const handleNav = (view: 'menu' | 'ranking' | 'history') => {
    soundManager.play('uiClick');
    setActiveView(view);
  };

  if (activeView === 'ranking' || activeView === 'history') {
    return (
      <div
        className="pirate-panel"
        style={{
          width: '760px',
          minHeight: '520px',
          padding: '16px 24px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '26px',
              color: 'var(--color-gold-bright)',
              letterSpacing: '2px',
              textShadow: '0 2px 6px rgba(0, 0, 0, 0.8)',
              margin: '0 0 10px 0',
            }}
          >
            CAPTAIN'S LOG
          </h2>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={() => handleNav('ranking')}
              className={`pirate-btn-secondary ${activeView === 'ranking' ? 'active' : ''}`}
            >
              Ranking
            </button>
            <button
              onClick={() => handleNav('history')}
              className={`pirate-btn-secondary ${activeView === 'history' ? 'active' : ''}`}
            >
              Match History
            </button>
          </div>
        </div>

        <div style={{ flex: 1, width: '100%', marginBottom: '16px' }}>
          {activeView === 'ranking' ? <LeaderboardTab /> : <MatchHistoryTab />}
        </div>

        <button
          onClick={() => handleNav('menu')}
          className="pirate-btn-primary"
          style={{ width: '200px', height: '48px', fontSize: '15px' }}
        >
          Main Menu
        </button>
      </div>
    );
  }

  return (
    <div
      className="pirate-panel"
      style={{
        width: '460px',
        minHeight: '540px',
        padding: '18px 24px',
        justifyContent: 'space-between',
      }}
    >
      {/* Title & Slogan */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="pirate-title-banner" />
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '11px',
            letterSpacing: '3px',
            color: 'var(--color-gold-warm)',
            fontWeight: 800,
            textTransform: 'uppercase',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
            marginTop: '-4px',
          }}
        >
          Set Sail. Take Command.
        </span>
      </div>

      {/* Primary Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', margin: '14px 0' }}>
        <button
          onClick={() => {
            soundManager.play('uiClick');
            onStartGame();
          }}
          className="pirate-btn-primary"
        >
          Play
        </button>

        <button
          onClick={() => {
            soundManager.play('uiClick');
            onOpenOptions();
          }}
          className="pirate-btn-primary"
        >
          Options
        </button>
      </div>

      {/* Ship Icon Decoration & Subtext */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <img
          src="/assets/png/default/ships/ship_7.png"
          alt="Pirate Flagship"
          style={{
            width: '44px',
            height: '44px',
            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.6))',
          }}
        />
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            color: 'var(--color-parchment-dim)',
            fontStyle: 'italic',
            letterSpacing: '0.5px',
          }}
        >
          Navigate the islands. Survive the battle.
        </p>
      </div>

      {/* Control Instructions mini bar */}
      <div
        style={{
          width: '100%',
          backgroundColor: 'rgba(10, 20, 34, 0.75)',
          border: '1px solid rgba(245, 176, 65, 0.25)',
          borderRadius: '6px',
          padding: '8px 10px',
          fontSize: '11px',
          color: 'var(--color-parchment)',
          display: 'flex',
          justifyContent: 'space-around',
          marginTop: '10px',
          marginBottom: '10px',
        }}
      >
        <div><strong>W:</strong> Forward</div>
        <div><strong>A/D:</strong> Turn</div>
        <div><strong>Space:</strong> Front Cannon</div>
        <div><strong>Q/E:</strong> Broadside</div>
      </div>

      {/* Bottom Tabs / Sub-Buttons */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <button
          onClick={() => handleNav('ranking')}
          className="pirate-btn-secondary"
        >
          Ranking
        </button>

        <button
          onClick={() => handleNav('history')}
          className="pirate-btn-secondary"
        >
          Match History
        </button>
      </div>
    </div>
  );
};

