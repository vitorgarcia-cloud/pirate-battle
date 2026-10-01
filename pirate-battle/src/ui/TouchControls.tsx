import React from 'react';
import type { InputManager } from '../game/core/InputManager';

interface TouchControlsProps {
  input: InputManager;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ input }) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {/* Navigation Controls (Bottom-Left) */}
      <div style={{ display: 'flex', gap: '10px', pointerEvents: 'auto' }}>
        <button
          onPointerDown={() => input.setAction('rotateLeft', true)}
          onPointerUp={() => input.setAction('rotateLeft', false)}
          onPointerLeave={() => input.setAction('rotateLeft', false)}
          className="pirate-btn-round"
          title="Turn Port (Left) [A]"
          aria-label="Turn Left"
        >
          <img src="/assets/png/default/ui/controls/icon_turn_left.png" alt="Turn Left" />
        </button>

        <button
          onPointerDown={() => input.setAction('forward', true)}
          onPointerUp={() => input.setAction('forward', false)}
          onPointerLeave={() => input.setAction('forward', false)}
          className="pirate-btn-round"
          title="Full Sail Ahead [W]"
          aria-label="Full Sail"
        >
          <img src="/assets/png/default/ui/controls/icon_forward.png" alt="Forward" />
        </button>

        <button
          onPointerDown={() => input.setAction('rotateRight', true)}
          onPointerUp={() => input.setAction('rotateRight', false)}
          onPointerLeave={() => input.setAction('rotateRight', false)}
          className="pirate-btn-round"
          title="Turn Starboard (Right) [D]"
          aria-label="Turn Right"
        >
          <img src="/assets/png/default/ui/controls/icon_turn_right.png" alt="Turn Right" />
        </button>
      </div>

      {/* Combat Cannons Controls (Bottom-Right) */}
      <div style={{ display: 'flex', gap: '10px', pointerEvents: 'auto' }}>
        <button
          onPointerDown={() => input.setAction('fireSideLeft', true)}
          onPointerUp={() => input.setAction('fireSideLeft', false)}
          onPointerLeave={() => input.setAction('fireSideLeft', false)}
          className="pirate-btn-round"
          title="Port Broadside [Q]"
          aria-label="Port Broadside"
        >
          <img src="/assets/png/default/ui/controls/icon_fire_left.png" alt="Fire Port" />
        </button>

        <button
          onPointerDown={() => input.setAction('firePrimary', true)}
          onPointerUp={() => input.setAction('firePrimary', false)}
          onPointerLeave={() => input.setAction('firePrimary', false)}
          className="pirate-btn-round"
          title="Front Cannon [Space]"
          aria-label="Front Cannon"
          style={{ width: '58px', height: '58px' }}
        >
          <img src="/assets/png/default/ui/controls/icon_fire_front.png" alt="Fire Front" style={{ width: '30px', height: '30px' }} />
        </button>

        <button
          onPointerDown={() => input.setAction('fireSideRight', true)}
          onPointerUp={() => input.setAction('fireSideRight', false)}
          onPointerLeave={() => input.setAction('fireSideRight', false)}
          className="pirate-btn-round"
          title="Starboard Broadside [E]"
          aria-label="Starboard Broadside"
        >
          <img src="/assets/png/default/ui/controls/icon_fire_right.png" alt="Fire Starboard" />
        </button>
      </div>
    </div>
  );
};
