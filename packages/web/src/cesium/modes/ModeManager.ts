import * as Cesium from 'cesium';
import type { CesiumVehicleGame } from '../bootstrap/main';
import type { GameMode } from '../bridge/types';

export class ModeManager {
  private currentMode: GameMode = 'play';
  private mapClickHandler: Cesium.ScreenSpaceEventHandler | null = null;

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
    } else if (to === 'geoguess_builder') {
      this.enterGeoGuessBuilderMode();
    } else if (to === 'geoguess_play') {
      this.enterGeoGuessPlayMode();
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

  private enterGeoGuessBuilderMode(): void {
    console.log('🗺️ Entering GeoGuess Builder mode...');
    
    const scene = this.game.getScene();
    const vehicleManager = this.game.getVehicleManager();
    const cameraManager = this.game.getCameraManager();
    const geoGuessController = this.game.getGeoGuessController();
    
    const vehicle = vehicleManager.getActiveVehicle();
    if (vehicle) {
      (vehicle as any).physicsEnabled = false;
    }
    
    const activeCamera = cameraManager.getActiveCamera();
    if (activeCamera) {
      activeCamera.deactivate();
    }
    
    scene.enableDefaultCameraControls(true);
    
    geoGuessController.startBuilding();
    
    this.setupMapClickHandler();
    
    console.log('✅ GeoGuess Builder mode active');
  }

  private enterGeoGuessPlayMode(): void {
    console.log('🎮 Entering GeoGuess Play mode...');
    
    const scene = this.game.getScene();
    const cameraManager = this.game.getCameraManager();
    
    const activeCamera = cameraManager.getActiveCamera();
    if (activeCamera) {
      activeCamera.deactivate();
    }
    
    scene.enableDefaultCameraControls(true);
    
    this.removeMapClickHandler();
    
    console.log('✅ GeoGuess Play mode active');
  }

  private setupMapClickHandler(): void {
    this.removeMapClickHandler();
    
    const scene = this.game.getScene();
    const geoGuessController = this.game.getGeoGuessController();
    
    this.mapClickHandler = new Cesium.ScreenSpaceEventHandler(scene.viewer.canvas);
    
    this.mapClickHandler.setInputAction((click: any) => {
      const selectedPlace = geoGuessController.getSelectedPlace();
      if (!selectedPlace) {
        console.log('⚠️ No place selected, please select a location first');
        return;
      }
      
      const ray = scene.camera.getPickRay(click.position);
      if (!ray) return;
      
      // Use pickPosition which works with 3D tiles
      const cartesian = scene.viewer.scene.pickPosition(click.position);
      if (!cartesian) {
        console.log('⚠️ Could not pick position at click location');
        return;
      }
      
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const position = {
        latitude: Cesium.Math.toDegrees(cartographic.latitude),
        longitude: Cesium.Math.toDegrees(cartographic.longitude),
        height: cartographic.height,
      };
      
      geoGuessController.placeFlag(position);
      console.log('📍 Flag placed at:', position);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  private removeMapClickHandler(): void {
    if (this.mapClickHandler) {
      this.mapClickHandler.destroy();
      this.mapClickHandler = null;
    }
  }

  public getCurrentMode(): GameMode {
    return this.currentMode;
  }
}
