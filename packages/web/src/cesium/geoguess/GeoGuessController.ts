import * as Cesium from 'cesium';
import type { CesiumVehicleGame } from '../bootstrap/main';
import type { Challenge, Place, Position, PlaySession, Guess } from './types';
import { FlagManager } from './FlagManager';
import { LocationTeleporter } from './LocationTeleporter';
import { calculateDistance, calculatePoints } from './scoring';

export class GeoGuessController {
  private flagManager: FlagManager;
  private teleporter: LocationTeleporter;
  private currentChallenge: Challenge | null = null;
  private currentSession: PlaySession | null = null;
  private buildModeSelectedPlace: Place | null = null;
  private maxAltitude: number = 500;

  constructor(private game: CesiumVehicleGame) {
    const scene = this.game.getScene();
    this.flagManager = new FlagManager(scene.viewer);
    this.teleporter = new LocationTeleporter(scene.viewer);
  }

  startBuilding(challenge?: Challenge): void {
    this.currentChallenge = challenge || this.createEmptyChallenge();
    this.buildModeSelectedPlace = null;
    this.updateBuildModeFlags();
  }

  stopBuilding(): void {
    this.flagManager.removeAllFlags();
    this.currentChallenge = null;
    this.buildModeSelectedPlace = null;
  }

  startPlaying(challenge: Challenge): void {
    this.currentChallenge = challenge;
    this.currentSession = {
      challengeId: challenge.id,
      currentPlaceIndex: 0,
      guesses: [],
      totalScore: 0,
      startTime: Date.now(),
    };
    
    // Load first place (async but we don't await here)
    this.loadCurrentPlace();
  }

  stopPlaying(): void {
    this.flagManager.removeAllFlags();
    this.currentChallenge = null;
    this.currentSession = null;
  }

  getCurrentChallenge(): Challenge | null {
    return this.currentChallenge;
  }

  getCurrentSession(): PlaySession | null {
    return this.currentSession;
  }

  getCurrentPlace(): Place | null {
    if (!this.currentChallenge || !this.currentSession) return null;
    return this.currentChallenge.places[this.currentSession.currentPlaceIndex] || null;
  }

  addPlace(position: Position, label: string = 'New Place'): Place {
    if (!this.currentChallenge) {
      throw new Error('No active challenge');
    }

    const place: Place = {
      id: this.generateId(),
      position,
      label,
    };

    this.currentChallenge.places.push(place);
    this.updateBuildModeFlags();
    
    return place;
  }

  updatePlace(placeId: string, updates: Partial<Place>): void {
    if (!this.currentChallenge) return;

    const place = this.currentChallenge.places.find(p => p.id === placeId);
    if (place) {
      Object.assign(place, updates);
      this.updateBuildModeFlags();
    }
  }

  deletePlace(placeId: string): void {
    if (!this.currentChallenge) return;

    this.currentChallenge.places = this.currentChallenge.places.filter(
      p => p.id !== placeId
    );
    
    if (this.buildModeSelectedPlace?.id === placeId) {
      this.buildModeSelectedPlace = null;
    }
    
    this.updateBuildModeFlags();
  }

  reorderPlaces(fromIndex: number, toIndex: number): void {
    if (!this.currentChallenge) return;

    const places = this.currentChallenge.places;
    const [moved] = places.splice(fromIndex, 1);
    places.splice(toIndex, 0, moved);
    
    this.updateBuildModeFlags();
  }

  selectPlace(placeId: string): void {
    if (!this.currentChallenge) return;

    const place = this.currentChallenge.places.find(p => p.id === placeId);
    if (place) {
      this.buildModeSelectedPlace = place;
      
      // Only teleport if the place has a valid position (not at 0,0,0)
      if (place.position.latitude !== 0 || place.position.longitude !== 0 || place.position.height !== 0) {
        // Smooth camera movement to the location
        this.teleporter.teleportTo(place.position, 1.5);
      } else {
        console.log('📍 Location selected (no position set yet). Click on the map to place the flag.');
      }
      
      this.updateBuildModeFlags();
    }
  }

  getSelectedPlace(): Place | null {
    return this.buildModeSelectedPlace;
  }

  placeFlag(position: Position): void {
    if (!this.buildModeSelectedPlace) return;

    this.updatePlace(this.buildModeSelectedPlace.id, { position });
    this.updateBuildModeFlags();
  }

  submitGuess(guessPosition: Position): Guess {
    if (!this.currentSession || !this.currentChallenge) {
      throw new Error('No active play session');
    }

    const currentPlace = this.getCurrentPlace();
    if (!currentPlace) {
      throw new Error('No current place');
    }

    const distance = calculateDistance(currentPlace.position, guessPosition);
    const points = calculatePoints(distance);
    const timeTaken = Math.floor((Date.now() - this.currentSession.startTime) / 1000);

    const guess: Guess = {
      placeId: currentPlace.id,
      position: guessPosition,
      distance,
      points,
      timeTaken,
    };

    this.currentSession.guesses.push(guess);
    this.currentSession.totalScore += points;

    this.showAnswerFlags(currentPlace.position, guessPosition);

    return guess;
  }

  nextPlace(): boolean {
    if (!this.currentSession || !this.currentChallenge) return false;

    this.currentSession.currentPlaceIndex++;
    
    if (this.currentSession.currentPlaceIndex >= this.currentChallenge.places.length) {
      return false;
    }

    // Load next place (async but we don't await here)
    this.loadCurrentPlace();
    return true;
  }

  enforceAltitudeLimit(): void {
    const scene = this.game.getScene();
    const camera = scene.camera;
    const cartographic = Cesium.Cartographic.fromCartesian(camera.position);
    
    if (cartographic.height > this.maxAltitude) {
      const clamped = Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        this.maxAltitude
      );
      camera.position = clamped;
    }
  }

  private async loadCurrentPlace(): Promise<void> {
    const place = this.getCurrentPlace();
    if (!place) return;

    this.flagManager.removeAllFlags();
    
    const scene = (this.game as any).getScene();
    const vehicleManager = (this.game as any).getVehicleManager();
    const vehicle = vehicleManager.getActiveVehicle();
    
    if (!vehicle) return;

    // STEP 1: Calculate proper spawn position (1000m above ground)
    const spawnHeight = 1000;
    const targetPosition = Cesium.Cartesian3.fromDegrees(
      place.position.longitude,
      place.position.latitude,
      spawnHeight
    );

    console.log(`📷 Teleporting to location: ${place.label} at ${place.position.latitude.toFixed(4)}, ${place.position.longitude.toFixed(4)}`);
    
    // INSTANT teleport - no camera flight animation
    scene.camera.setView({
      destination: targetPosition,
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-20),
        roll: 0
      }
    });

    // STEP 2: Quick tile check (shorter timeout for faster transitions)
    console.log('⏳ Checking tiles...');
    const tilesLoaded = await scene.waitForTilesToLoad(2000); // Reduced to 2 seconds
    
    if (!tilesLoaded) {
      console.log('⏭️ Tiles still loading, continuing anyway...');
    }

    // STEP 3: Spawn the vehicle
    console.log('✈️ Spawning airplane at 1000m altitude...');
    const currentState = vehicle.getState();
    vehicle.setState({
      ...currentState,
      position: targetPosition,
      heading: 0,
      pitch: 0,
      roll: 0,
      velocity: 0,
      speed: 0
    });
    
    // Show the vehicle model
    if (vehicle.model) {
      vehicle.model.show = true;
    }
    
    console.log(`✅ Airplane spawned at location: ${place.label}`);
    
    // Show flag at ground level
    this.flagManager.addFlag(
      'target',
      { latitude: place.position.latitude, longitude: place.position.longitude, height: place.position.height || 0 },
      Cesium.Color.RED,
      `📍 ${place.label}`
    );
    
    console.log(`🎯 Target location: ${place.label} - Fly around and find it!`);
  }

  private showAnswerFlags(actualPosition: Position, guessPosition: Position): void {
    this.flagManager.removeAllFlags();
    
    this.flagManager.addFlag(
      'actual',
      actualPosition,
      Cesium.Color.GREEN,
      'Actual Location'
    );
    
    this.flagManager.addFlag(
      'guess',
      guessPosition,
      Cesium.Color.BLUE,
      'Your Guess'
    );
  }

  private updateBuildModeFlags(): void {
    if (!this.currentChallenge) return;

    this.flagManager.removeAllFlags();

    this.currentChallenge.places.forEach((place, index) => {
      // Only show flag if position has been set (not at 0,0,0)
      if (place.position.latitude !== 0 || place.position.longitude !== 0 || place.position.height !== 0) {
        const isSelected = place.id === this.buildModeSelectedPlace?.id;
        const color = isSelected ? Cesium.Color.YELLOW : Cesium.Color.RED;
        
        this.flagManager.addFlag(
          place.id,
          place.position,
          color,
          `${index + 1}. ${place.label}`
        );
      }
    });
  }

  private createEmptyChallenge(): Challenge {
    return {
      id: this.generateId(),
      name: 'New Challenge',
      createdAt: Date.now(),
      places: [],
      photoModeEnabled: false,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public getFlagManager(): FlagManager {
    return this.flagManager;
  }

  public getTeleporter(): LocationTeleporter {
    return this.teleporter;
  }
}
