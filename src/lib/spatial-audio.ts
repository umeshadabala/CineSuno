/**
 * CineSuno — Simulated Spatial Audio Engine
 *
 * Utilizes the browser-native Web Audio API to demonstrate how sound perspective
 * changes across auditorium seating locations.
 *
 * Sound Source: Virtual cinema screen at (0, 3.5, -15)
 * Listener: Dynamically positioned at the selected seat coordinates (x, y, z)
 *
 * IMPORTANT: This is an illustrative simulation demonstrating directional attenuation
 * and distance falloff. It does not reproduce actual physical theater acoustics or speaker setups.
 */

export interface SeatSpatialMetrics {
  distanceMeters: number;
  relativeAngleDegrees: number;
  acousticZone: 'Front Immersion' | 'Sweet Spot' | 'Ambient Field' | 'Side Asymmetry';
  perceivedDirectivity: string;
}

export class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private panner: PannerNode | null = null;
  private masterGain: GainNode | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private isPlaying: boolean = false;
  private currentSeatCoords: { x: number; y: number; z: number } = { x: 0, y: 1.2, z: 6 };

  // Virtual screen coordinates in meters (screen center)
  public static readonly SCREEN_POS = { x: 0, y: 3.5, z: -15 };

  /**
   * Initializes the Web Audio pipeline on explicit user gesture.
   */
  public async init(): Promise<boolean> {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return true;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) {
        console.warn('Web Audio API not supported in this browser.');
        return false;
      }

      this.ctx = new AudioCtxClass();

      // Master gain for volume & mute
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // 3D Spatial Panner node representing the screen speaker
      this.panner = this.ctx.createPanner();
      this.panner.panningModel = 'HRTF';
      this.panner.distanceModel = 'inverse';
      this.panner.refDistance = 5;
      this.panner.maxDistance = 40;
      this.panner.rolloffFactor = 1.2;
      this.panner.coneInnerAngle = 90;
      this.panner.coneOuterAngle = 180;
      this.panner.coneOuterGain = 0.4;

      // Position the screen speaker
      if (this.panner.positionX) {
        this.panner.positionX.setValueAtTime(SpatialAudioEngine.SCREEN_POS.x, this.ctx.currentTime);
        this.panner.positionY.setValueAtTime(SpatialAudioEngine.SCREEN_POS.y, this.ctx.currentTime);
        this.panner.positionZ.setValueAtTime(SpatialAudioEngine.SCREEN_POS.z, this.ctx.currentTime);
        this.panner.orientationX.setValueAtTime(0, this.ctx.currentTime);
        this.panner.orientationY.setValueAtTime(0, this.ctx.currentTime);
        this.panner.orientationZ.setValueAtTime(1, this.ctx.currentTime);
      } else {
        // Fallback for older Web Audio implementations
        this.panner.setPosition(SpatialAudioEngine.SCREEN_POS.x, SpatialAudioEngine.SCREEN_POS.y, SpatialAudioEngine.SCREEN_POS.z);
        this.panner.setOrientation(0, 0, 1);
      }

      // Connect panner to master gain
      this.panner.connect(this.masterGain);

      // Lowpass filter representing hall air absorption
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(4500, this.ctx.currentTime);
      this.filter.connect(this.panner);

      // Initial listener position
      this.updateListenerPosition(this.currentSeatCoords.x, this.currentSeatCoords.y, this.currentSeatCoords.z);

      return true;
    } catch (err) {
      console.error('Failed to initialize spatial audio context:', err);
      return false;
    }
  }

  /**
   * Generates a pleasant, synthesized cinematic ambient soundscape
   * (Zero copyrighted audio assets required).
   */
  public async play(): Promise<void> {
    if (!this.ctx) {
      const initialized = await this.init();
      if (!initialized) return;
    }

    if (this.isPlaying) return;

    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (!this.ctx || !this.filter) return;

    const t = this.ctx.currentTime;

    // Harmonic warm drone oscillator 1 (130.81 Hz - C3)
    this.ambientOsc1 = this.ctx.createOscillator();
    this.ambientOsc1.type = 'triangle';
    this.ambientOsc1.frequency.setValueAtTime(130.81, t);

    // Harmonic warm drone oscillator 2 (196.00 Hz - G3 fifth)
    this.ambientOsc2 = this.ctx.createOscillator();
    this.ambientOsc2.type = 'sine';
    this.ambientOsc2.frequency.setValueAtTime(196.0, t);

    // Subtle slow LFO for movement (0.2 Hz)
    this.lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    this.lfo.frequency.setValueAtTime(0.2, t);
    lfoGain.gain.setValueAtTime(15, t);
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.ambientOsc1.frequency);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.4, t);

    this.ambientOsc1.connect(oscGain);
    this.ambientOsc2.connect(oscGain);
    oscGain.connect(this.filter);

    this.ambientOsc1.start();
    this.ambientOsc2.start();
    this.lfo.start();
    this.isPlaying = true;
  }

  public stop(): void {
    if (!this.isPlaying) return;

    try {
      this.ambientOsc1?.stop();
      this.ambientOsc2?.stop();
      this.lfo?.stop();
      this.ambientOsc1?.disconnect();
      this.ambientOsc2?.disconnect();
      this.lfo?.disconnect();
    } catch {
      // Ignored
    }

    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
    this.lfo = null;
    this.isPlaying = false;
  }

  public setVolume(volume: number): void {
    if (this.masterGain && this.ctx) {
      const clamped = Math.max(0, Math.min(1, volume));
      this.masterGain.gain.setTargetAtTime(clamped * 0.4, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Updates listener coordinates when the user selects or previews a seat.
   */
  public updateListenerPosition(x: number, y: number, z: number): void {
    this.currentSeatCoords = { x, y, z };

    if (!this.ctx) return;

    const listener = this.ctx.listener;
    const t = this.ctx.currentTime;

    if (listener.positionX) {
      listener.positionX.setTargetAtTime(x, t, 0.1);
      listener.positionY.setTargetAtTime(y, t, 0.1);
      listener.positionZ.setTargetAtTime(z, t, 0.1);
      // Looking directly toward the screen at -Z
      listener.forwardX.setValueAtTime(0, t);
      listener.forwardY.setValueAtTime(0, t);
      listener.forwardZ.setValueAtTime(-1, t);
      listener.upX.setValueAtTime(0, t);
      listener.upY.setValueAtTime(1, t);
      listener.upZ.setValueAtTime(0, t);
    } else {
      listener.setPosition(x, y, z);
      listener.setOrientation(0, 0, -1, 0, 1, 0);
    }

    // Adjust air absorption filter based on distance
    const dist = this.calculateDistance(x, y, z);
    if (this.filter) {
      // High frequencies fall off with distance
      const cutoff = Math.max(2200, 6000 - dist * 180);
      this.filter.frequency.setTargetAtTime(cutoff, t, 0.1);
    }
  }

  public calculateMetrics(x: number, y: number, z: number): SeatSpatialMetrics {
    const dist = this.calculateDistance(x, y, z);
    const screen = SpatialAudioEngine.SCREEN_POS;
    const dx = x - screen.x;
    const dz = z - screen.z;
    const angleRad = Math.atan2(dx, dz);
    const angleDeg = Math.round((angleRad * 180) / Math.PI);

    let zone: SeatSpatialMetrics['acousticZone'] = 'Sweet Spot';
    let directivity = 'Optimal center channel balance and dialogue clarity';

    if (z < 3) {
      zone = 'Front Immersion';
      directivity = 'High direct sound energy, prominent screen center';
    } else if (Math.abs(x) > 4.5) {
      zone = 'Side Asymmetry';
      directivity = `${x < 0 ? 'Left' : 'Right'} channel bias with reduced opposite-channel arrival time`;
    } else if (z > 10) {
      zone = 'Ambient Field';
      directivity = 'Diffuse surround reverberation with softened high frequencies';
    }

    return {
      distanceMeters: Math.round(dist * 10) / 10,
      relativeAngleDegrees: angleDeg,
      acousticZone: zone,
      perceivedDirectivity: directivity,
    };
  }

  private calculateDistance(x: number, y: number, z: number): number {
    const screen = SpatialAudioEngine.SCREEN_POS;
    return Math.sqrt(
      Math.pow(x - screen.x, 2) +
      Math.pow(y - screen.y, 2) +
      Math.pow(z - screen.z, 2)
    );
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public dispose(): void {
    this.stop();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
  }
}

// Global singleton instance for component reuse
let instance: SpatialAudioEngine | null = null;

export function getSpatialAudioEngine(): SpatialAudioEngine {
  if (typeof window === 'undefined') {
    return new SpatialAudioEngine();
  }
  if (!instance) {
    instance = new SpatialAudioEngine();
  }
  return instance;
}
