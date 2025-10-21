import * as Cesium from 'cesium';
import { Updatable } from '../core/GameLoop';
import { Vehicle } from '../vehicles/Vehicle';

export abstract class Camera implements Updatable {
  protected cesiumCamera: Cesium.Camera;
  protected target: Vehicle | null = null;
  protected isActive: boolean = false;

  constructor(cesiumCamera: Cesium.Camera) {
    this.cesiumCamera = cesiumCamera;
  }

  public setTarget(vehicle: Vehicle | null): void {
    this.target = vehicle;
  }

  public getTarget(): Vehicle | null {
    return this.target;
  }

  public activate(): void {
    this.isActive = true;
    this.onActivate();
  }

  public deactivate(): void {
    this.isActive = false;
    this.onDeactivate();
  }

  public isActivated(): boolean {
    return this.isActive;
  }

  protected onActivate(): void {
    // Override in subclasses for specific activation logic
  }

  protected onDeactivate(): void {
    // Override in subclasses for specific deactivation logic
  }

  public abstract update(deltaTime: number): void;
}
