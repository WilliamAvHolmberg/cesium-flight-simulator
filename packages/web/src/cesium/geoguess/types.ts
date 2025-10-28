import * as Cesium from 'cesium';

export interface Position {
  latitude: number;
  longitude: number;
  height: number;
}

export interface CameraView {
  position: Position;
  heading: number;
  pitch: number;
  roll: number;
}

export interface Place {
  id: string;
  position: Position;
  label: string;
  hint?: string;
  cameraView?: CameraView;
}

export interface Challenge {
  id: string;
  name: string;
  description?: string;
  category?: string;
  createdAt: number;
  places: Place[];
  timeLimit?: number;
  photoModeEnabled: boolean;
}

export interface Guess {
  placeId: string;
  position: Position;
  distance: number;
  points: number;
  timeTaken: number;
}

export interface PlaySession {
  challengeId: string;
  currentPlaceIndex: number;
  guesses: Guess[];
  totalScore: number;
  startTime: number;
}

export interface ChallengeScore {
  challengeId: string;
  score: number;
  completedAt: number;
  guesses: Guess[];
}
