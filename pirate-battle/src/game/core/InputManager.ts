export interface InputState {
  forward: boolean;
  rotateLeft: boolean;
  rotateRight: boolean;
  firePrimary: boolean;
  fireSideLeft: boolean;
  fireSideRight: boolean;
}

export class InputManager {
  private state: InputState = {
    forward: false,
    rotateLeft: false,
    rotateRight: false,
    firePrimary: false,
    fireSideLeft: false,
    fireSideRight: false,
  };

  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private isListening: boolean = false;

  constructor() {
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
  }

  public startListening(): void {
    if (this.isListening) return;
    this.isListening = true;
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  public stopListening(): void {
    if (!this.isListening) return;
    this.isListening = false;
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    this.reset();
  }

  public reset(): void {
    this.state = {
      forward: false,
      rotateLeft: false,
      rotateRight: false,
      firePrimary: false,
      fireSideLeft: false,
      fireSideRight: false,
    };
  }

  public getState(): Readonly<InputState> {
    return this.state;
  }

  // Suporte a controles por toque / botões da UI (mobile e accessibility)
  public setAction(action: keyof InputState, active: boolean): void {
    this.state[action] = active;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (['ArrowUp', 'KeyW'].includes(e.code)) {
      this.state.forward = true;
      e.preventDefault();
    }
    if (['ArrowLeft', 'KeyA'].includes(e.code)) {
      this.state.rotateLeft = true;
      e.preventDefault();
    }
    if (['ArrowRight', 'KeyD'].includes(e.code)) {
      this.state.rotateRight = true;
      e.preventDefault();
    }
    if (['Space', 'KeyJ'].includes(e.code)) {
      this.state.firePrimary = true;
      e.preventDefault();
    }
    if (['KeyQ', 'KeyU'].includes(e.code)) {
      this.state.fireSideLeft = true;
      e.preventDefault();
    }
    if (['KeyE', 'KeyO'].includes(e.code)) {
      this.state.fireSideRight = true;
      e.preventDefault();
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (['ArrowUp', 'KeyW'].includes(e.code)) {
      this.state.forward = false;
    }
    if (['ArrowLeft', 'KeyA'].includes(e.code)) {
      this.state.rotateLeft = false;
    }
    if (['ArrowRight', 'KeyD'].includes(e.code)) {
      this.state.rotateRight = false;
    }
    if (['Space', 'KeyJ'].includes(e.code)) {
      this.state.firePrimary = false;
    }
    if (['KeyQ', 'KeyU'].includes(e.code)) {
      this.state.fireSideLeft = false;
    }
    if (['KeyE', 'KeyO'].includes(e.code)) {
      this.state.fireSideRight = false;
    }
  }
}
