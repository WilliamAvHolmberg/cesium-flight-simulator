import * as Cesium from 'cesium';
import { Vehicle } from '../vehicles/Vehicle';
import { Car } from '../vehicles/car/Car';
import { Aircraft } from '../vehicles/aircraft/Aircraft';
import { Scene } from '../core/Scene';
import { Updatable } from '../core/GameLoop';
import { InputManager } from '../input/InputManager';

const DEFAULT_SPAWN_LOCATION = {
  lng: 11.9746,
  lat: 57.7089
};

export class VehicleManager implements Updatable {
  private vehicles: Map<string, Vehicle> = new Map();
  private activeVehicle: Vehicle | null = null;
  private scene: Scene;
  private onVehicleChangeCallback: ((vehicle: Vehicle) => void) | null = null;
  private onVehicleChangeCallbacks: Array<(vehicle: Vehicle) => void> = [];

  constructor(scene: Scene) {
    this.scene = scene;
  }

  private async addVehicle(vehicle: Vehicle): Promise<void> {
    try {
      if (this.activeVehicle) {
        console.log(`Removing previous vehicle: ${this.activeVehicle.id}`);
        this.removeVehicle(this.activeVehicle.id);
      }

      await vehicle.initialize(this.scene.scene);
      this.vehicles.set(vehicle.id, vehicle);
      
      this.waitForVehicleReady(vehicle.id);
      
      console.log(`Vehicle ${vehicle.id} added successfully`);
    } catch (error) {
      console.error(`Failed to add vehicle ${vehicle.id}:`, error);
    }
  }

  private waitForVehicleReady(vehicleId: string): void {
    const checkReady = () => {
      if (this.setActiveVehicle(vehicleId)) {
        console.log(`✅ Vehicle ${vehicleId} is now ready and active`);
      } else {
        // Check again in 100ms
        setTimeout(checkReady, 100);
      }
    };
    checkReady();
  }

  public removeVehicle(vehicleId: string): void {
    const vehicle = this.vehicles.get(vehicleId);
    if (vehicle) {
      vehicle.destroy();
      this.vehicles.delete(vehicleId);
      
      // If this was the active vehicle, switch to another one
      if (this.activeVehicle?.id === vehicleId) {
        const remainingVehicles = Array.from(this.vehicles.values());
        this.activeVehicle = remainingVehicles.length > 0 ? remainingVehicles[0] : null;
      }
      
      console.log(`Vehicle ${vehicleId} removed`);
    }
  }

  public setActiveVehicle(vehicleId: string): boolean {
    const vehicle = this.vehicles.get(vehicleId);
    if (vehicle && vehicle.isModelReady()) {
      this.activeVehicle = vehicle;
      console.log(`Active vehicle set to ${vehicleId}`);
      
      if (this.onVehicleChangeCallback) {
        this.onVehicleChangeCallback(vehicle);
      }
      
      for (const callback of this.onVehicleChangeCallbacks) {
        callback(vehicle);
      }
      
      return true;
    }
    return false;
  }

  public getActiveVehicle(): Vehicle | null {
    return this.activeVehicle;
  }

  public getVehicle(vehicleId: string): Vehicle | null {
    return this.vehicles.get(vehicleId) || null;
  }

  public getAllVehicles(): Vehicle[] {
    return Array.from(this.vehicles.values());
  }

  public getVehicleCount(): number {
    return this.vehicles.size;
  }

  public update(deltaTime: number): void {
    // Update all vehicles
    for (const vehicle of this.vehicles.values()) {
      vehicle.update(deltaTime);
    }
  }

  public switchToNextVehicle(): Vehicle | null {
    const vehicleIds = Array.from(this.vehicles.keys());
    if (vehicleIds.length <= 1) return this.activeVehicle;

    const currentIndex = this.activeVehicle ? vehicleIds.indexOf(this.activeVehicle.id) : -1;
    const nextIndex = (currentIndex + 1) % vehicleIds.length;
    const nextVehicleId = vehicleIds[nextIndex];
    
    if (this.setActiveVehicle(nextVehicleId)) {
      return this.activeVehicle;
    }
    
    return null;
  }

  public switchToPreviousVehicle(): Vehicle | null {
    const vehicleIds = Array.from(this.vehicles.keys());
    if (vehicleIds.length <= 1) return this.activeVehicle;

    const currentIndex = this.activeVehicle ? vehicleIds.indexOf(this.activeVehicle.id) : -1;
    const prevIndex = currentIndex <= 0 ? vehicleIds.length - 1 : currentIndex - 1;
    const prevVehicleId = vehicleIds[prevIndex];
    
    if (this.setActiveVehicle(prevVehicleId)) {
      return this.activeVehicle;
    }
    
    return null;
  }

  public async spawnCar(id: string = 'car', position?: Cesium.Cartesian3, heading: number = 0): Promise<Vehicle> {
    const spawnPosition = position || Cesium.Cartesian3.fromDegrees(
      DEFAULT_SPAWN_LOCATION.lng,
      DEFAULT_SPAWN_LOCATION.lat,
      100
    );
    
    const car = new Car(id, {
      modelUrl: './walter.glb',
      scale: 10,
      position: spawnPosition,
      heading,
      modelHeadingOffset: Cesium.Math.toRadians(90)
    });

    await this.addVehicle(car);
    this.scene.setVehicleQualityMode('car');
    return car;
  }

  public async spawnAircraft(id: string = 'aircraft', position?: Cesium.Cartesian3, heading: number = 0): Promise<Vehicle> {
    const spawnPosition = position || Cesium.Cartesian3.fromDegrees(
      DEFAULT_SPAWN_LOCATION.lng,
      DEFAULT_SPAWN_LOCATION.lat,
      200
    );
    
    const aircraft = new Aircraft(id, {
      modelUrl: './plane.glb',
      scale: 5,
      position: spawnPosition,
      heading
    });

    await this.addVehicle(aircraft);
    this.scene.setVehicleQualityMode('aircraft');
    return aircraft;
  }

  public async toggleVehicleType(): Promise<void> {
    const active = this.activeVehicle;
    if (!active) return;

    const state = active.getState();
    const isAircraft = active instanceof Aircraft;

    if (isAircraft) {
      console.log('🛬 Switching to Vehicle');
      await this.spawnCar('car', state.position, state.heading);
    } else {
      console.log('🛫 Switching to Aircraft');
      await this.spawnAircraft('aircraft', state.position, state.heading);
    }
  }

  public async restartCurrentVehicle(): Promise<void> {
    const active = this.activeVehicle;
    if (!active) return;

    const isAircraft = active instanceof Aircraft;
    const originalSpawn = Cesium.Cartesian3.fromDegrees(
      DEFAULT_SPAWN_LOCATION.lng,
      DEFAULT_SPAWN_LOCATION.lat,
      isAircraft ? 200 : 100
    );
    const heading = 0;

    if (isAircraft) {
      await this.spawnAircraft('aircraft', originalSpawn, heading);
    } else {
      await this.spawnCar('car', originalSpawn, heading);
    }
  }

  public handleInput(inputName: string, pressed: boolean): void {
    if (!this.activeVehicle) return;
    this.activeVehicle.setInput({ [inputName]: pressed });
  }

  public setTargetSpeed(speed: number): void {
    if (!this.activeVehicle) return;
    this.activeVehicle.setInput({ targetSpeed: speed });
  }

  public setupInputHandling(inputManager: InputManager): void {
    inputManager.onInput('throttle', (pressed) => this.handleInput('throttle', pressed));
    inputManager.onInput('brake', (pressed) => this.handleInput('brake', pressed));
    inputManager.onInput('turnLeft', (pressed) => this.handleInput('turnLeft', pressed));
    inputManager.onInput('turnRight', (pressed) => this.handleInput('turnRight', pressed));
    inputManager.onInput('altitudeUp', (pressed) => this.handleInput('altitudeUp', pressed));
    inputManager.onInput('altitudeDown', (pressed) => this.handleInput('altitudeDown', pressed));
    inputManager.onInput('rollLeft', (pressed) => this.handleInput('rollLeft', pressed));
    inputManager.onInput('rollRight', (pressed) => this.handleInput('rollRight', pressed));

    inputManager.onTargetSpeedChange((speed) => this.setTargetSpeed(speed));

    inputManager.onInput('toggleRoverMode', (pressed) => {
      if (pressed) this.toggleVehicleType();
    });

    inputManager.onInput('toggleCollision', (pressed) => {
      if (pressed) {
        const vehicle = this.activeVehicle;
        vehicle?.toggleCollisionDetection?.();
      }
    });

    inputManager.onInput('restart', (pressed) => {
      if (pressed) this.restartCurrentVehicle();
    });
  }

  public destroy(): void {
    for (const vehicle of this.vehicles.values()) {
      vehicle.destroy();
    }
    this.vehicles.clear();
    this.activeVehicle = null;
  }

  public onVehicleChange(callback: (vehicle: Vehicle) => void): void {
    this.onVehicleChangeCallback = callback;
  }

  public addVehicleChangeListener(callback: (vehicle: Vehicle) => void): void {
    this.onVehicleChangeCallbacks.push(callback);
  }
}
