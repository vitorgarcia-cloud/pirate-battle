import React, { useState } from 'react';
import type { GameConfig } from '../game/types/config';
import { getNetworkScenario, setNetworkScenario, type NetworkScenario } from '../mocks/handlers';
import { soundManager } from '../game/core/SoundManager';

interface OptionsModalProps {
  currentConfig: GameConfig;
  onSave: (config: GameConfig) => void;
  onClose: () => void;
}

export const OptionsModal: React.FC<OptionsModalProps> = ({ currentConfig, onSave, onClose }) => {
  const [duration, setDuration] = useState<number>(currentConfig.sessionDuration);
  const [spawnInterval, setSpawnInterval] = useState<number>(currentConfig.enemySpawnInterval);
  const [networkMode, setNetworkMode] = useState<NetworkScenario>(getNetworkScenario());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Som & Áudio
  const initialSound = soundManager.getSettings();
  const [muted, setMuted] = useState<boolean>(initialSound.muted);
  const [masterVol, setMasterVol] = useState<number>(Math.round(initialSound.masterVolume * 100));
  const [sfxVol, setSfxVol] = useState<number>(Math.round(initialSound.sfxVolume * 100));
  const [bgmVol, setBgmVol] = useState<number>(Math.round(initialSound.bgmVolume * 100));

  const handleDecreaseDuration = () => {
    soundManager.play('uiClick');
    setDuration((prev) => Math.max(60, prev - 15));
  };

  const handleIncreaseDuration = () => {
    soundManager.play('uiClick');
    setDuration((prev) => Math.min(180, prev + 15));
  };

  const handleDecreaseSpawn = () => {
    soundManager.play('uiClick');
    setSpawnInterval((prev) => Math.max(1, prev - 1));
  };

  const handleIncreaseSpawn = () => {
    soundManager.play('uiClick');
    setSpawnInterval((prev) => Math.min(10, prev + 1));
  };

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    soundManager.saveSettings({ muted: nextMuted });
    if (!nextMuted) soundManager.play('uiClick');
  };

  const handleMasterVolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setMasterVol(val);
    soundManager.saveSettings({ masterVolume: val / 100 });
  };

  const handleSfxVolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSfxVol(val);
    soundManager.saveSettings({ sfxVolume: val / 100 });
    soundManager.play('uiClick');
  };

  const handleBgmVolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setBgmVol(val);
    soundManager.saveSettings({ bgmVolume: val / 100 });
  };

  const handleSaveAndClose = () => {
    soundManager.play('uiClick');
    if (duration < 60 || duration > 180) {
      setErrorMsg('Game session time must be between 60 and 180 seconds.');
      return;
    }
    if (spawnInterval < 1 || spawnInterval > 10) {
      setErrorMsg('Enemy spawn interval must be between 1 and 10 seconds.');
      return;
    }

    setNetworkScenario(networkMode);

    const updatedConfig: GameConfig = {
      ...currentConfig,
      sessionDuration: duration,
      enemySpawnInterval: spawnInterval,
    };

    onSave(updatedConfig);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 12, 22, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        className="pirate-panel"
        style={{
          width: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px 30px',
          justifyContent: 'space-between',
          gap: '14px',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '28px',
            color: 'var(--color-gold-bright)',
            letterSpacing: '3px',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)',
            margin: '0 0 8px 0',
            textAlign: 'center',
          }}
        >
          OPTIONS & AUDIO
        </h2>

        {errorMsg && (
          <div
            style={{
              backgroundColor: 'rgba(231, 76, 60, 0.25)',
              border: '1px solid var(--color-danger)',
              borderRadius: '6px',
              padding: '6px 12px',
              color: '#fca5a5',
              fontSize: '12px',
              textAlign: 'center',
              width: '100%',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* 1. Game Session Time */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--color-parchment-dim)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            Game session time
          </span>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <button
              onClick={handleDecreaseDuration}
              className="pirate-btn-round"
              disabled={duration <= 60}
              aria-label="Decrease session duration"
            >
              <img src="/assets/png/default/ui/controls/icon_minus.png" alt="Minus" />
            </button>

            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--color-gold-warm)',
                minWidth: '65px',
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              {duration} s
            </span>

            <button
              onClick={handleIncreaseDuration}
              className="pirate-btn-round"
              disabled={duration >= 180}
              aria-label="Increase session duration"
            >
              <img src="/assets/png/default/ui/controls/icon_plus.png" alt="Plus" />
            </button>
          </div>
        </div>

        {/* 2. Enemy Spawn Time */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--color-parchment-dim)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            Enemy spawn time
          </span>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <button
              onClick={handleDecreaseSpawn}
              className="pirate-btn-round"
              disabled={spawnInterval <= 1}
              aria-label="Decrease spawn interval"
            >
              <img src="/assets/png/default/ui/controls/icon_minus.png" alt="Minus" />
            </button>

            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--color-gold-warm)',
                minWidth: '65px',
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              {spawnInterval} s
            </span>

            <button
              onClick={handleIncreaseSpawn}
              className="pirate-btn-round"
              disabled={spawnInterval >= 10}
              aria-label="Increase spawn interval"
            >
              <img src="/assets/png/default/ui/controls/icon_plus.png" alt="Plus" />
            </button>
          </div>
        </div>

        {/* 3. Audio & Sound Settings */}
        <div
          style={{
            width: '100%',
            backgroundColor: 'rgba(10, 20, 34, 0.75)',
            border: '1px solid rgba(245, 176, 65, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-gold-warm)', letterSpacing: '1px' }}>
              🔊 AUDIO CONTROLS
            </span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#fff' }}>
              <input
                type="checkbox"
                checked={muted}
                onChange={handleToggleMute}
                style={{ accentColor: '#eab308', cursor: 'pointer' }}
              />
              Mute All Audio
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: muted ? 0.4 : 1.0, transition: 'opacity 0.2s' }}>
            {/* Master Volume */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--color-parchment-dim)' }}>Master Volume</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '60%' }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVol}
                  onChange={handleMasterVolChange}
                  disabled={muted}
                  style={{ flex: 1, cursor: muted ? 'not-allowed' : 'pointer' }}
                />
                <span style={{ minWidth: '35px', textAlign: 'right', fontWeight: 700, color: 'var(--color-gold-bright)' }}>
                  {masterVol}%
                </span>
              </div>
            </div>

            {/* SFX Volume */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--color-parchment-dim)' }}>SFX (Cannon & Effects)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '60%' }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sfxVol}
                  onChange={handleSfxVolChange}
                  disabled={muted}
                  style={{ flex: 1, cursor: muted ? 'not-allowed' : 'pointer' }}
                />
                <span style={{ minWidth: '35px', textAlign: 'right', fontWeight: 700, color: 'var(--color-gold-bright)' }}>
                  {sfxVol}%
                </span>
              </div>
            </div>

            {/* BGM Volume */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--color-parchment-dim)' }}>BGM (Ocean Ambience)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '60%' }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={bgmVol}
                  onChange={handleBgmVolChange}
                  disabled={muted}
                  style={{ flex: 1, cursor: muted ? 'not-allowed' : 'pointer' }}
                />
                <span style={{ minWidth: '35px', textAlign: 'right', fontWeight: 700, color: 'var(--color-gold-bright)' }}>
                  {bgmVol}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Network Simulation Scenario */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-parchment-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            MSW Network Simulation
          </span>
          <select
            value={networkMode}
            onChange={(e) => {
              soundManager.play('uiClick');
              setNetworkMode(e.target.value as NetworkScenario);
            }}
            style={{
              backgroundColor: '#0e1c2e',
              color: 'var(--color-gold-warm)',
              border: '1px solid rgba(245, 176, 65, 0.4)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontFamily: 'var(--font-body)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="success">Normal (Fast Success)</option>
            <option value="slow">Slow Network (1.5s delay)</option>
            <option value="error">HTTP 500 / 503 Failure</option>
            <option value="timeout">Network Timeout (6s delay)</option>
          </select>
        </div>

        {/* Action Button */}
        <button onClick={handleSaveAndClose} className="pirate-btn-primary" style={{ marginTop: '6px' }}>
          Main Menu
        </button>
      </div>
    </div>
  );
};
