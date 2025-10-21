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
    
    // Disable our custom cameras
    const activeCamera = cameraManager.getActiveCamera();
    if (activeCamera) {
      activeCamera.deactivate();
    }
    
    // Enable Cesium's built-in free camera controls
    scene.enableDefaultCameraControls(true);
    
    // Enable object placement
    placementController.enable();
    
    console.log('✅ Builder mode active - Cesium free camera + placement enabled');
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
