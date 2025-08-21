export interface KeyMapping {
    [key: string]: string;
}

export interface InputState {
    [action: string]: {
        isPressed: boolean;
        justPressed: boolean;
        justReleased: boolean;
        timePressed: number;
    };
}

export class InputManager {
    private keys: { [key: string]: boolean } = {};
    private previousKeys: { [key: string]: boolean } = {};
    private keyMapping: KeyMapping;
    private inputState: InputState = {};
    private listeners: Array<(event: KeyboardEvent) => void> = [];
    private isInitialized = false;

    constructor() {
        this.keyMapping = {
            // Movement
            'KeyW': 'up',
            'KeyS': 'down',
            'KeyA': 'left',
            'KeyD': 'right',
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            
            // Actions
            'Space': 'attack',
            'KeyZ': 'ki_attack',
            'KeyX': 'special_attack',
            'KeyC': 'guard',
            
            // Transformations
            'KeyQ': 'transform_prev',
            'KeyE': 'transform_next',
            
            // UI
            'Escape': 'menu',
            'Enter': 'confirm',
            'Backspace': 'cancel',
            
            // Modifiers
            'ShiftLeft': 'run',
            'ShiftRight': 'run',
            'ControlLeft': 'focus',
            'ControlRight': 'focus',
        };

        this.initializeInputState();
    }

    private initializeInputState(): void {
        Object.values(this.keyMapping).forEach(action => {
            if (!this.inputState[action]) {
                this.inputState[action] = {
                    isPressed: false,
                    justPressed: false,
                    justReleased: false,
                    timePressed: 0
                };
            }
        });
    }

    public initialize(): void {
        if (this.isInitialized) {
            return;
        }

        console.log('Initializing input manager...');

        // Keyboard event listeners
        const keyDownHandler = (event: KeyboardEvent) => {
            this.onKeyDown(event);
        };

        const keyUpHandler = (event: KeyboardEvent) => {
            this.onKeyUp(event);
        };

        // Prevent default behavior for game keys
        const preventDefaultHandler = (event: KeyboardEvent) => {
            const action = this.keyMapping[event.code];
            if (action) {
                event.preventDefault();
            }
        };

        document.addEventListener('keydown', keyDownHandler);
        document.addEventListener('keyup', keyUpHandler);
        document.addEventListener('keydown', preventDefaultHandler);

        // Store listeners for cleanup
        this.listeners.push(keyDownHandler, keyUpHandler, preventDefaultHandler);

        // Focus management
        window.addEventListener('blur', () => {
            this.clearAllKeys();
        });

        this.isInitialized = true;
        console.log('Input manager initialized');
    }

    private onKeyDown(event: KeyboardEvent): void {
        this.keys[event.code] = true;
        
        const action = this.keyMapping[event.code];
        if (action && this.inputState[action]) {
            if (!this.inputState[action].isPressed) {
                this.inputState[action].justPressed = true;
                this.inputState[action].timePressed = performance.now();
            }
            this.inputState[action].isPressed = true;
            this.inputState[action].justReleased = false;
        }
    }

    private onKeyUp(event: KeyboardEvent): void {
        this.keys[event.code] = false;
        
        const action = this.keyMapping[event.code];
        if (action && this.inputState[action]) {
            this.inputState[action].isPressed = false;
            this.inputState[action].justReleased = true;
            this.inputState[action].justPressed = false;
        }
    }

    public update(deltaTime: number): void {
        // Copy current keys to previous
        this.previousKeys = { ...this.keys };
        
        // Reset just pressed/released flags
        Object.keys(this.inputState).forEach(action => {
            this.inputState[action].justPressed = false;
            this.inputState[action].justReleased = false;
        });
    }

    // Action-based input methods
    public isActionPressed(action: string): boolean {
        return this.inputState[action]?.isPressed || false;
    }

    public isActionJustPressed(action: string): boolean {
        return this.inputState[action]?.justPressed || false;
    }

    public isActionJustReleased(action: string): boolean {
        return this.inputState[action]?.justReleased || false;
    }

    public getActionHoldTime(action: string): number {
        const state = this.inputState[action];
        if (!state || !state.isPressed) {
            return 0;
        }
        return performance.now() - state.timePressed;
    }

    // Raw key methods (for debugging or special cases)
    public isKeyPressed(key: string): boolean {
        return this.keys[key] || false;
    }

    public isKeyJustPressed(key: string): boolean {
        return (this.keys[key] || false) && !(this.previousKeys[key] || false);
    }

    public isKeyJustReleased(key: string): boolean {
        return !(this.keys[key] || false) && (this.previousKeys[key] || false);
    }

    // Movement helper methods
    public getMovementVector(): { x: number; y: number } {
        let x = 0;
        let y = 0;

        if (this.isActionPressed('left')) x -= 1;
        if (this.isActionPressed('right')) x += 1;
        if (this.isActionPressed('up')) y -= 1;
        if (this.isActionPressed('down')) y += 1;

        // Normalize diagonal movement
        if (x !== 0 && y !== 0) {
            const length = Math.sqrt(x * x + y * y);
            x /= length;
            y /= length;
        }

        return { x, y };
    }

    public isMoving(): boolean {
        return this.isActionPressed('up') || 
               this.isActionPressed('down') || 
               this.isActionPressed('left') || 
               this.isActionPressed('right');
    }

    public isRunning(): boolean {
        return this.isActionPressed('run');
    }

    // Combat helper methods
    public isAttacking(): boolean {
        return this.isActionJustPressed('attack');
    }

    public isKiAttacking(): boolean {
        return this.isActionJustPressed('ki_attack');
    }

    public isSpecialAttacking(): boolean {
        return this.isActionJustPressed('special_attack');
    }

    public isGuarding(): boolean {
        return this.isActionPressed('guard');
    }

    // Transformation methods
    public isTransformNext(): boolean {
        return this.isActionJustPressed('transform_next');
    }

    public isTransformPrev(): boolean {
        return this.isActionJustPressed('transform_prev');
    }

    // Menu methods
    public isMenuPressed(): boolean {
        return this.isActionJustPressed('menu');
    }

    public isConfirmPressed(): boolean {
        return this.isActionJustPressed('confirm');
    }

    public isCancelPressed(): boolean {
        return this.isActionJustPressed('cancel');
    }

    // Configuration
    public setKeyMapping(key: string, action: string): void {
        this.keyMapping[key] = action;
        this.initializeInputState();
    }

    public getKeyMapping(): KeyMapping {
        return { ...this.keyMapping };
    }

    public clearAllKeys(): void {
        this.keys = {};
        this.previousKeys = {};
        Object.keys(this.inputState).forEach(action => {
            this.inputState[action].isPressed = false;
            this.inputState[action].justPressed = false;
            this.inputState[action].justReleased = false;
        });
    }

    public getInputState(): InputState {
        return { ...this.inputState };
    }

    public destroy(): void {
        // Remove event listeners
        this.listeners.forEach(listener => {
            document.removeEventListener('keydown', listener);
            document.removeEventListener('keyup', listener);
        });
        this.listeners = [];
        
        this.clearAllKeys();
        this.isInitialized = false;
        console.log('Input manager destroyed');
    }
}