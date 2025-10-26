import * as Cesium from 'cesium';
import type { CesiumVehicleGame } from '../bootstrap/main';
import type { GameMode } from '../bridge/types';

export class ModeManager {
  private currentMode: GameMode = 'play';

  constructor(
    private game: CesiumVehicleGame
  ) {}

  public onModeChanged(from: GameMode, to: GameMode): void {
    console.log(`🔄 Mode transition: ${from} → ${to}`);
    this.currentMode = to;
    
    if (to === 'builder') {
      this.enterBuilderMode();
    } else if (to === 'play') {
      this.exitBuilderMode();
    }
  }

  private enterBuilderMode(): void {
    console.log('🏗️ Entering builder mode...');
    
    const scene = this.game.getScene();
    const vehicleManager = this.game.getVehicleManager();
    const cameraManager = this.game.getCameraManager();
    const placementController = this.game.getPlacementController();
    
    // Disable vehicle physics
    const vehicle = vehicleManager.getActiveVehicle();
    if (vehicle) {
      (vehicle as any).physicsEnabled = false;
    }
    
    // Disable our custom cameras FIRST
    const activeCamera = cameraManager.getActiveCamera();
    if (activeCamera) {
      activeCamera.deactivate();
    }
    
    // Position camera behind and above the vehicle/cursor spawn point
    const startPosition = vehicle ? vehicle.getPosition() : scene.camera.positionWC;
    const cartographic = Cesium.Cartographic.fromCartesian(startPosition);
    
    // Position camera 100m behind and 50m above
    const cameraCartographic = new Cesium.Cartographic(
      cartographic.longitude,
      cartographic.latitude - Cesium.Math.toRadians(0.001), // ~100m south
      cartographic.height + 50
    );
    const cameraPosition = Cesium.Cartographic.toCartesian(cameraCartographic);
    
    // Point camera at the spawn position
    const heading = 0; // North
    const pitch = Cesium.Math.toRadians(-20); // Looking down slightly
    
    scene.camera.setView({
      destination: cameraPosition,
      orientation: {
        heading: heading,
        pitch: pitch,
        roll: 0
      }
    });
    
    // Enable Cesium's built-in free camera controls
    scene.enableDefaultCameraControls(true);
    
    // Enable object placement at vehicle position
    placementController.enable(startPosition);
    
    console.log('✅ Builder mode active - Camera unlocked, WASD to move cursor, Space to spawn');
  }

  private exitBuilderMode(): void {
    console.log('🎮 Exiting builder mode...');
    
    const scene = this.game.getScene();
    const vehicleManager = this.game.getVehicleManager();
    const cameraManager = this.game.getCameraManager();
    const placementController = this.game.getPlacementController();
    
    // Disable object placement
    placementController.disable();
    
    // Re-enable vehicle physics
    const vehicle = vehicleManager.getActiveVehicle();
    if (vehicle) {
      (vehicle as any).physicsEnabled = true;
    }
    
    // Disable Cesium's default camera controls
    scene.enableDefaultCameraControls(false);
    
    // Re-enable our custom follow camera
    cameraManager.setActiveCamera('follow');
    
    console.log('✅ Play mode active - follow camera enabled');
  }

  public getCurrentMode(): GameMode {
    return this.currentMode;
  }
}
