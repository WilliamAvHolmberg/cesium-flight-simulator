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
    
    const cameraManager = this.game.getCameraManager();
    const vehicleManager = this.game.getVehicleManager();
    
    cameraManager.setActiveCamera('free');
    
    const vehicle = vehicleManager.getActiveVehicle();
    if (vehicle) {
      (vehicle as any).physicsEnabled = false;
    }
    
    console.log('✅ Builder mode active - free camera enabled');
  }

  private exitBuilderMode(): void {
    console.log('🎮 Exiting builder mode...');
    
    const cameraManager = this.game.getCameraManager();
    const vehicleManager = this.game.getVehicleManager();
    
    cameraManager.setActiveCamera('follow');
    
    const vehicle = vehicleManager.getActiveVehicle();
    if (vehicle) {
      (vehicle as any).physicsEnabled = true;
    }
    
    console.log('✅ Play mode active - follow camera enabled');
  }

  public getCurrentMode(): GameMode {
    return this.currentMode;
  }
}
