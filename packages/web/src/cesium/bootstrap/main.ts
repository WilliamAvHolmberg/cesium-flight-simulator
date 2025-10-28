import * as Cesium from 'cesium';
import { Scene } from '../core/Scene';
import { GameLoop } from '../core/GameLoop';
import { VehicleManager } from '../managers/VehicleManager';
import { CameraManager } from '../managers/CameraManager';
import { InputManager } from '../input/InputManager';
import { ObjectManager } from '../builder/ObjectManager';
import { PlacementController } from '../builder/PlacementController';
import { TouchInputManager } from '../input/TouchInputManager';
import { GeoGuessController } from '../geoguess/GeoGuessController';

export class CesiumVehicleGame {
  private scene: Scene;
  private gameLoop: GameLoop;
  private vehicleManager: VehicleManager;
  private cameraManager: CameraManager;
  private inputManager: InputManager;
  private objectManager: ObjectManager;
  private placementController: PlacementController;
  private touchInputManager: TouchInputManager | null = null;
  private geoGuessController: GeoGuessController;

  constructor(containerId: string = "cesiumContainer") {
    this.scene = new Scene(containerId);
    this.gameLoop = new GameLoop(this.scene);
    this.vehicleManager = new VehicleManager(this.scene);
    this.cameraManager = new CameraManager(this.scene.camera);
    this.inputManager = new InputManager();
    this.objectManager = new ObjectManager(this.scene.viewer);
    this.placementController = new PlacementController(this.scene.viewer, this.objectManager);
    this.geoGuessController = new GeoGuessController(this);

    this.setupSystems();
    this.setupInputHandling();
    this.setupTouchControls(containerId);
  }

  private setupSystems(): void {
    this.gameLoop.addUpdatable(this.vehicleManager);
    this.gameLoop.addUpdatable(this.cameraManager);
    this.gameLoop.addUpdatable({
      update: (deltaTime: number) => {
        this.placementController.update(deltaTime);
      }
    });
    this.gameLoop.addUpdatable({
      update: (deltaTime: number) => {
        const modeManager = (this as any).modeManager;
        // Removed altitude limiting - players can fly freely in GeoGuess play mode
      }
    });
    
    this.vehicleManager.onVehicleChange((vehicle) => {
      this.cameraManager.setTarget(vehicle);
      console.log('📷 Camera target updated to new vehicle');
    });
  }

  private setupInputHandling(): void {
    this.vehicleManager.setupInputHandling(this.inputManager);
    this.cameraManager.setupInputHandling(this.inputManager);
    
    // Builder placement inputs
    this.inputManager.onInput('throttle', (pressed) => this.placementController.setMoveInput({ forward: pressed }));
    this.inputManager.onInput('brake', (pressed) => this.placementController.setMoveInput({ backward: pressed }));
    this.inputManager.onInput('turnLeft', (pressed) => this.placementController.setMoveInput({ left: pressed }));
    this.inputManager.onInput('turnRight', (pressed) => this.placementController.setMoveInput({ right: pressed }));
    this.inputManager.onInput('altitudeUp', (pressed) => this.placementController.setMoveInput({ up: pressed }));
    this.inputManager.onInput('altitudeDown', (pressed) => this.placementController.setMoveInput({ down: pressed }));
    
    // Space bar to spawn object
    this.inputManager.onInput('spawnObject', (pressed) => {
      if (pressed) {
        this.placementController.placeObjectAtCursor();
      }
    });
  }

  private setupTouchControls(containerId: string): void {
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isMobile) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    this.touchInputManager = new TouchInputManager(container);
    
    this.touchInputManager.onInput('rollLeft', (pressed) => 
      this.vehicleManager.handleInput('rollLeft', pressed)
    );
    this.touchInputManager.onInput('rollRight', (pressed) => 
      this.vehicleManager.handleInput('rollRight', pressed)
    );
    this.touchInputManager.onInput('altitudeUp', (pressed) => 
      this.vehicleManager.handleInput('altitudeUp', pressed)
    );
    this.touchInputManager.onInput('altitudeDown', (pressed) => 
      this.vehicleManager.handleInput('altitudeDown', pressed)
    );

    console.log('📱 Touch controls initialized');
  }

  public async startCinematicSequence(): Promise<void> {
    const spawnPosition = Cesium.Cartesian3.fromDegrees(11.9746, 57.7089, 200);
    
    console.log('🎬 Starting cinematic sequence...');
    
    this.scene.startEarthSpin();
    await this.delay(3000);
    
    this.scene.stopEarthSpin();
    await this.scene.zoomToLocation(spawnPosition, 4500);
    
    console.log('✈️ Spawning aircraft...');
    const aircraft = await this.vehicleManager.spawnAircraft();
    this.cameraManager.setTarget(aircraft);
    this.start();
    
    console.log('🎮 Ready to fly!');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public start(): void {
    this.gameLoop.start();
    console.log('🚀 Cesium Vehicle Game started!');
  }

  public stop(): void {
    this.gameLoop.stop();
  }

  public getVehicleManager(): VehicleManager {
    return this.vehicleManager;
  }

  public getCameraManager(): CameraManager {
    return this.cameraManager;
  }

  public getInputManager(): InputManager {
    return this.inputManager;
  }

  public getScene(): Scene {
    return this.scene;
  }

  public getObjectManager(): ObjectManager {
    return this.objectManager;
  }

  public getPlacementController(): PlacementController {
    return this.placementController;
  }

  public getGeoGuessController(): GeoGuessController {
    return this.geoGuessController;
  }

  public destroy(): void {
    this.stop();
    this.scene.stopEarthSpin();
    this.vehicleManager.destroy();
    this.cameraManager.destroy();
    this.inputManager.destroy();
    this.touchInputManager?.destroy();
  }
}

export async function startCesiumVehicleGame(): Promise<CesiumVehicleGame> {
  const game = new CesiumVehicleGame();
  await game.startCinematicSequence();
  return game;
}
