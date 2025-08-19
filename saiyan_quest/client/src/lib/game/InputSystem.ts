export class InputSystem {
  private static instance: InputSystem;
  private keyStates: Map<string, boolean> = new Map();
  private keyPressHandlers: Map<string, () => void> = new Map();

  static getInstance(): InputSystem {
    if (!this.instance) {
      this.instance = new InputSystem();
    }
    return this.instance;
  }

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', (event) => {
      const key = event.code;
      if (!this.keyStates.get(key)) {
        this.keyStates.set(key, true);
        const handler = this.keyPressHandlers.get(key);
        if (handler) {
          handler();
        }
      }
    });

    document.addEventListener('keyup', (event) => {
      this.keyStates.set(event.code, false);
    });
  }

  isKeyPressed(key: string): boolean {
    return this.keyStates.get(key) || false;
  }

  onKeyPress(key: string, handler: () => void): void {
    this.keyPressHandlers.set(key, handler);
  }

  removeKeyHandler(key: string): void {
    this.keyPressHandlers.delete(key);
  }

  // Helper methods for common game inputs
  isMovingUp(): boolean {
    return this.isKeyPressed('KeyW') || this.isKeyPressed('ArrowUp');
  }

  isMovingDown(): boolean {
    return this.isKeyPressed('KeyS') || this.isKeyPressed('ArrowDown');
  }

  isMovingLeft(): boolean {
    return this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft');
  }

  isMovingRight(): boolean {
    return this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight');
  }

  isAttacking(): boolean {
    return this.isKeyPressed('KeyZ');
  }

  isUsingEnergy(): boolean {
    return this.isKeyPressed('KeyX');
  }

  getMovementDirection(): { x: number; z: number } {
    let x = 0, z = 0;
    
    if (this.isMovingLeft()) x -= 1;
    if (this.isMovingRight()) x += 1;
    if (this.isMovingUp()) z -= 1;
    if (this.isMovingDown()) z += 1;
    
    // Normalize diagonal movement
    if (x !== 0 && z !== 0) {
      const length = Math.sqrt(x * x + z * z);
      x /= length;
      z /= length;
    }
    
    return { x, z };
  }
}
