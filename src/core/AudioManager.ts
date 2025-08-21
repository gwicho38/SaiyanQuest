// Using Howler.js for audio management
import { Howl, Howler } from 'howler';

export interface AudioTrack {
    id: string;
    url: string;
    volume: number;
    loop: boolean;
    category: 'music' | 'sfx' | 'voice';
}

export class AudioManager {
    private tracks: Map<string, Howl> = new Map();
    private currentMusic: Howl | null = null;
    private currentMusicId: string | null = null;
    private musicVolume = 0.7;
    private sfxVolume = 0.8;
    private masterVolume = 1.0;
    private isInitialized = false;
    private isMuted = false;

    constructor() {
        // Set up Howler global settings
        Howler.volume(this.masterVolume);
    }

    public initialize(): void {
        if (this.isInitialized) {
            return;
        }

        console.log('Initializing audio manager...');

        // Load audio tracks
        this.loadAudioTracks();

        // Handle browser audio policy
        this.setupAudioContext();

        this.isInitialized = true;
        console.log('Audio manager initialized');
    }

    private setupAudioContext(): void {
        // Modern browsers require user interaction before playing audio
        const enableAudio = () => {
            Howler.ctx?.resume();
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('keydown', enableAudio);
            document.removeEventListener('touchstart', enableAudio);
        };

        document.addEventListener('click', enableAudio);
        document.addEventListener('keydown', enableAudio);
        document.addEventListener('touchstart', enableAudio);

        // Also try to resume audio context if available from Electron
        if (window.gameAPI?.resumeAudioContext) {
            window.gameAPI.resumeAudioContext();
        }
    }

    private loadAudioTracks(): void {
        const audioTracks: AudioTrack[] = [
            // Background Music
            {
                id: 'menu_theme',
                url: 'assets/audio/menu_theme.mp3',
                volume: this.musicVolume,
                loop: true,
                category: 'music'
            },
            {
                id: 'overworld_theme',
                url: 'assets/audio/overworld_theme.mp3',
                volume: this.musicVolume,
                loop: true,
                category: 'music'
            },
            {
                id: 'battle_theme',
                url: 'assets/audio/battle_theme.mp3',
                volume: this.musicVolume,
                loop: true,
                category: 'music'
            },

            // Sound Effects
            {
                id: 'punch',
                url: 'assets/audio/sfx/punch.wav',
                volume: this.sfxVolume,
                loop: false,
                category: 'sfx'
            },
            {
                id: 'ki_blast',
                url: 'assets/audio/sfx/ki_blast.wav',
                volume: this.sfxVolume,
                loop: false,
                category: 'sfx'
            },
            {
                id: 'kamehameha',
                url: 'assets/audio/sfx/kamehameha.wav',
                volume: this.sfxVolume,
                loop: false,
                category: 'sfx'
            },
            {
                id: 'transformation',
                url: 'assets/audio/sfx/transformation.wav',
                volume: this.sfxVolume,
                loop: false,
                category: 'sfx'
            },
            {
                id: 'menu_select',
                url: 'assets/audio/sfx/menu_select.wav',
                volume: this.sfxVolume * 0.5,
                loop: false,
                category: 'sfx'
            },
        ];

        // Create Howl instances for each track
        audioTracks.forEach(track => {
            try {
                const howl = new Howl({
                    src: [track.url],
                    volume: track.volume,
                    loop: track.loop,
                    preload: true,
                    onload: () => {
                        // Audio loaded successfully (suppress log)
                    },
                    onloaderror: (id, error) => {
                        // Failed to load - create silent placeholder (suppress individual warnings)
                        this.createSilentTrack(track.id, track.category === 'music' ? 1000 : 100);
                    }
                });

                this.tracks.set(track.id, howl);
            } catch (error) {
                console.warn(`Error creating audio track: ${track.id}`, error);
                this.createSilentTrack(track.id, track.category === 'music' ? 1000 : 100);
            }
        });
    }

    private createSilentTrack(id: string, duration: number): void {
        // Create a silent audio track as fallback
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buffer = audioContext.createBuffer(1, audioContext.sampleRate * (duration / 1000), audioContext.sampleRate);
        
        // Create a blob URL for the silent audio
        const arrayBuffer = new ArrayBuffer(44 + buffer.length * 2);
        const view = new DataView(arrayBuffer);
        
        // WAV header (minimal)
        const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + buffer.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, audioContext.sampleRate, true);
        view.setUint32(28, audioContext.sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, buffer.length * 2, true);
        
        // Silent data
        for (let i = 0; i < buffer.length; i++) {
            view.setInt16(44 + i * 2, 0, true);
        }
        
        const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        const howl = new Howl({
            src: [url],
            volume: 0,
            loop: false
        });
        
        this.tracks.set(id, howl);
    }

    public playMusic(trackId: string, fadeIn = false): void {
        if (this.isMuted) return;

        const track = this.tracks.get(trackId);
        if (!track) {
            // Track not found - silently return (audio files expected to be missing in development)
            return;
        }

        // Stop current music
        if (this.currentMusic && this.currentMusicId !== trackId) {
            this.currentMusic.stop();
        }

        this.currentMusic = track;
        this.currentMusicId = trackId;

        if (fadeIn) {
            track.volume(0);
            track.play();
            track.fade(0, this.musicVolume, 1000);
        } else {
            track.volume(this.musicVolume);
            track.play();
        }
    }

    public stopMusic(fadeOut = false): void {
        if (!this.currentMusic) return;

        if (fadeOut) {
            this.currentMusic.fade(this.currentMusic.volume(), 0, 1000);
            setTimeout(() => {
                if (this.currentMusic) {
                    this.currentMusic.stop();
                }
                this.currentMusic = null;
                this.currentMusicId = null;
            }, 1000);
        } else {
            this.currentMusic.stop();
            this.currentMusic = null;
            this.currentMusicId = null;
        }
    }

    public playSfx(trackId: string, volume?: number): void {
        if (this.isMuted) return;

        const track = this.tracks.get(trackId);
        if (!track) {
            console.warn(`SFX track not found: ${trackId}`);
            return;
        }

        const playVolume = volume !== undefined ? volume : this.sfxVolume;
        track.volume(playVolume);
        track.play();
    }

    public setMasterVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        Howler.volume(this.masterVolume);
    }

    public setMusicVolume(volume: number): void {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.volume(this.musicVolume);
        }
    }

    public setSfxVolume(volume: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    public getMasterVolume(): number {
        return this.masterVolume;
    }

    public getMusicVolume(): number {
        return this.musicVolume;
    }

    public getSfxVolume(): number {
        return this.sfxVolume;
    }

    public mute(): void {
        this.isMuted = true;
        Howler.mute(true);
    }

    public unmute(): void {
        this.isMuted = false;
        Howler.mute(false);
    }

    public isMutedState(): boolean {
        return this.isMuted;
    }

    public update(deltaTime: number): void {
        // Audio manager doesn't need frame updates
        // But this method is called for consistency with other managers
    }

    public destroy(): void {
        console.log('Destroying audio manager...');
        
        // Stop all audio
        this.tracks.forEach(track => {
            track.stop();
            track.unload();
        });
        
        this.tracks.clear();
        this.currentMusic = null;
        this.currentMusicId = null;
        
        // Clean up Howler
        Howler.stop();
        
        this.isInitialized = false;
        console.log('Audio manager destroyed');
    }
}