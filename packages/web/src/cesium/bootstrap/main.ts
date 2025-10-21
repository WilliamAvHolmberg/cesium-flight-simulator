import * as Cesium from 'cesium';
import { Scene } from '../core/Scene';
import { GameLoop } from '../core/GameLoop';
import { VehicleManager } from '../managers/VehicleManager';
import { CameraManager } from '../managers/CameraManager';
import { InputManager } from '../input/InputManager';
import { ObjectManager } from '../builder/ObjectManager';
import { PlacementController } from '../builder/PlacementController';

export class CesiumVehicleGame {
  private scene: Scene;
  private gameLoop: GameLoop;
  private vehicleManager: VehicleManager;
  private cameraManager: CameraManager;
  private inputManager: InputManager;
  private objectManager: ObjectManager;
  private placementController: PlacementController;

  constructor(containerId: string = "cesiumContainer") {
    this.scene = new Scene(containerId);
    this.gameLoop = new GameLoop(this.scene);
    this.vehicleManager = new VehicleManager(this.scene);
    this.cameraManager = new CameraManager(this.scene.camera);
    this.inputManager = new InputManager();
    this.objectManager = new ObjectManager(this.scene.viewer);
    this.placementController = new PlacementController(this.scene.viewer, this.objectManager);

    this.setupSystems();
    this.setupInputHandling();
  }

  private setupSystems(): void {
    this.gameLoop.addUpdatable(this.vehicleManager);
    this.gameLoop.addUpdatable(this.cameraManager);
    
    this.vehicleManager.onVehicleChange((vehicle) => {
      this.cameraManager.setTarget(vehicle);
      console.log('📷 Camera target updated to new vehicle');
    });
  }

  private setupInputHandling(): void {
    this.vehicleManager.setupInputHandling(this.inputManager);
    this.cameraManager.setupInputHandling(this.inputManager);
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

  public destroy(): void {
    this.stop();
    this.scene.stopEarthSpin();
    this.vehicleManager.destroy();
    this.cameraManager.destroy();
    this.inputManager.destroy();
  }
}

export async function startCesiumVehicleGame(): Promise<CesiumVehicleGame> {
  const game = new CesiumVehicleGame();
  await game.startCinematicSequence();
  return game;
}
