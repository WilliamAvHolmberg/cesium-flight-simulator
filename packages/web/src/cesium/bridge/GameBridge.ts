import * as Cesium from 'cesium';
import { TypedEventEmitter } from './TypedEventEmitter';
import type { GameEvents, VehicleStateData, GameMode } from './types';
import type { CesiumVehicleGame } from '../bootstrap/main';
import type { CameraType } from '../managers/CameraManager';
import type { QualityConfig } from '../core/Scene';
import { Car } from '../vehicles/car/Car';
import { Aircraft } from '../vehicles/aircraft/Aircraft';
import type { Vehicle } from '../vehicles/Vehicle';

export class GameBridge extends TypedEventEmitter<GameEvents> {
  private game: CesiumVehicleGame;
  private updateInterval: number | null = null;
  private currentMode: GameMode = 'play';

  constructor(game: CesiumVehicleGame) {
    super();
    this.game = game;
    this.startUpdates();
    this.setupVehicleChangeListener();
    this.applyQualityPreset('performance');
    console.log('🎮 Applied performance mode on startup');
  }

  private setupVehicleChangeListener(): void {
    this.game.getVehicleManager().addVehicleChangeListener((vehicle) => {
      this.emitVehicleChangeEvents(vehicle);
    });
  }

  private startUpdates(): void {
    this.updateInterval = window.setInterval(() => {
      this.emitVehicleState();
    }, 16);
  }

  private emitVehicleState(): void {
    const vehicle = this.game.getVehicleManager().getActiveVehicle();
    if (vehicle && vehicle.isModelReady()) {
      const state = vehicle.getState();
      this.emit('vehicleStateChanged', {
        speed: state.speed,
        velocity: state.velocity,
        position: state.position,
        heading: state.heading,
        pitch: state.pitch,
        roll: state.roll,
      });

      // Check for crash
      if (vehicle instanceof Aircraft && vehicle.isCrashed()) {
        this.emit('crashed', { crashed: true });
      }
    }
  }

  public emitVehicleChangeEvents(vehicle: Vehicle): void {
    if (vehicle instanceof Car) {
      this.emit('collisionDetectionChanged', {
        enabled: vehicle.getCollisionDetection(),
      });
      this.emit('roverModeChanged', {
        enabled: vehicle.getRoverMode(),
      });
    } else if (vehicle instanceof Aircraft) {
      this.emit('collisionDetectionChanged', { enabled: false });
      this.emit('roverModeChanged', { enabled: false });
    }
  }

  public switchCamera(): void {
    const cameraManager = this.game.getCameraManager();
    cameraManager.switchCamera();
    this.emit('cameraChanged', {
      type: cameraManager.getActiveCameraType(),
    });
  }

  public getCameraType(): CameraType {
    return this.game.getCameraManager().getActiveCameraType();
  }

  public toggleRoverMode(): void {
    const active = this.game.getVehicleManager().getActiveVehicle();
    if (!active) return;

    if (active instanceof Car) {
      const newMode = !active.getRoverMode();
      active.setRoverMode(newMode);
      this.emit('roverModeChanged', { enabled: newMode });
    }
  }

  public toggleVehicleType(): void {
    this.game.getVehicleManager().toggleVehicleType();
  }

  public getRoverMode(): boolean {
    const active = this.game.getVehicleManager().getActiveVehicle();
    if (!active) return true;
    if (active instanceof Car) return active.getRoverMode();
    if (active instanceof Aircraft) return false;
    return true;
  }

  public toggleCollisionDetection(): void {
    const active = this.game.getVehicleManager().getActiveVehicle();
    if (active instanceof Car) {
      active.toggleCollisionDetection();
      this.emit('collisionDetectionChanged', {
        enabled: active.getCollisionDetection(),
      });
    } else {
      // Aircraft: treat as collision always enabled off (no toggle)
      this.emit('collisionDetectionChanged', { enabled: false });
    }
  }

  public getCollisionDetection(): boolean {
    const active = this.game.getVehicleManager().getActiveVehicle();
    if (active instanceof Car) return active.getCollisionDetection();
    // Aircraft: no collision toggle, return false to avoid UI assuming it's on
    return false;
  }

  public getVehicleState(): VehicleStateData | null {
    const vehicle = this.game.getVehicleManager().getActiveVehicle();
    if (vehicle && vehicle.isModelReady()) {
      const state = vehicle.getState();
      return {
        speed: state.speed,
        velocity: state.velocity,
        position: state.position,
        heading: state.heading,
        pitch: state.pitch,
        roll: state.roll,
      };
    }
    return null;
  }

  public teleportTo(longitude: number, latitude: number, altitude: number, heading: number = 0): void {
    const vehicle = this.game.getVehicleManager().getActiveVehicle();
    if (vehicle) {
      const newPosition = Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude);
      const currentState = vehicle.getState();
      vehicle.setState({
        ...currentState,
        position: newPosition,
        heading: Cesium.Math.toRadians(heading),
        pitch: 0,
        roll: 0,
        velocity: 0,
        speed: 0
      });
      this.emit('locationChanged', {
        longitude,
        latitude,
        altitude
      });
    }
  }

  public restart(): void {
    const vehicle = this.game.getVehicleManager().getActiveVehicle();
    if (vehicle && vehicle instanceof Aircraft && vehicle.isCrashed()) {
      vehicle.resetCrash();
      // Reset to spawn position
      const spawnPosition = Cesium.Cartesian3.fromDegrees(11.9746, 57.7089, 200);
      const currentState = vehicle.getState();
      vehicle.setState({
        ...currentState,
        position: spawnPosition,
        heading: 0,
        pitch: 0,
        roll: 0,
        velocity: 0,
        speed: 0
      });
      this.emit('crashed', { crashed: false });
    }
  }

  public destroy(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.removeAllListeners();
  }

  public getQualitySettings(): QualityConfig {
    return this.game.getScene().getQualityConfig();
  }

  public updateQualitySettings(config: Partial<QualityConfig>): void {
    this.game.getScene().updateQualityConfig(config);
  }

  public toggleBuilderMode(): void {
    const newMode: GameMode = this.currentMode === 'play' ? 'builder' : 'play';
    this.setMode(newMode);
  }

  public setMode(mode: GameMode): void {
    if (this.currentMode === mode) {
      console.log(`🎮 Already in ${mode} mode`);
      return;
    }
    
    const previousMode = this.currentMode;
    this.currentMode = mode;
    
    this.emit('modeChanged', { mode, previousMode });
    
    console.log(`🎮 Mode changed: ${previousMode} → ${mode}`);
  }

  public getMode(): GameMode {
    return this.currentMode;
  }

  public applyQualityPreset(preset: 'performance' | 'balanced' | 'quality' | 'ultra'): void {
    const presets: Record<string, Partial<QualityConfig>> = {
      performance: {
        maximumScreenSpaceError: 32,
        dynamicScreenSpaceError: true,
        dynamicScreenSpaceErrorFactor: 32,
        skipLevelOfDetail: true,
        fxaaEnabled: true,
        bloomEnabled: false,
        hdr: false,
        exposure: 1.0,
      },
      balanced: {
        maximumScreenSpaceError: 16,
        dynamicScreenSpaceError: true,
        dynamicScreenSpaceErrorFactor: 24,
        skipLevelOfDetail: true,
        fxaaEnabled: true,
        bloomEnabled: true,
        hdr: true,
        exposure: 1.5,
      },
      quality: {
        maximumScreenSpaceError: 8,
        dynamicScreenSpaceError: true,
        dynamicScreenSpaceErrorFactor: 16,
        skipLevelOfDetail: true,
        fxaaEnabled: true,
        bloomEnabled: true,
        hdr: true,
        exposure: 1.5,
      },
      ultra: {
        maximumScreenSpaceError: 4,
        dynamicScreenSpaceError: false,
        dynamicScreenSpaceErrorFactor: 12,
        skipLevelOfDetail: false,
        fxaaEnabled: true,
        bloomEnabled: true,
        hdr: true,
        exposure: 1.8,
      },
    };

    const config = presets[preset];
    if (config) {
      this.updateQualitySettings(config);
      console.log(`🎨 Applied ${preset} quality preset`);
    }
  }
}

