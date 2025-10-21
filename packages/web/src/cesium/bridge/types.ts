import * as Cesium from 'cesium';
import type { CameraType } from '../managers/CameraManager';

export type GameMode = 'play' | 'builder';

export interface VehicleStateData {
  speed: number;
  velocity: number;
  position: Cesium.Cartesian3;
  heading: number;
  pitch: number;
  roll: number;
}

export interface CameraStateData {
  type: CameraType;
}

export interface RoverModeData {
  enabled: boolean;
}

export interface CollisionDetectionData {
  enabled: boolean;
}

export interface OnlinePlayer {
  id: string;
  name: string;
  position: Cesium.Cartesian3;
  heading: number;
  vehicleType: string;
}

export interface PlayersData {
  players: OnlinePlayer[];
  updateType: 'full' | 'incremental';
}

export interface GameReadyData {
  ready: boolean;
}

export interface LocationChangedData {
  longitude: number;
  latitude: number;
  altitude: number;
}

export interface CrashData {
  crashed: boolean;
}

export interface ModeChangedData {
  mode: GameMode;
  previousMode: GameMode;
}

export interface GameEvents {
  gameReady: GameReadyData;
  vehicleStateChanged: VehicleStateData;
  cameraChanged: CameraStateData;
  roverModeChanged: RoverModeData;
  collisionDetectionChanged: CollisionDetectionData;
  playersUpdated: PlayersData;
  locationChanged: LocationChangedData;
  crashed: CrashData;
  modeChanged: ModeChangedData;
  [key: string]: unknown;
}

