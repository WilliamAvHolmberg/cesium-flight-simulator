import * as Cesium from 'cesium';
import { Camera } from '../camera/Camera';
import { FollowCamera } from '../camera/FollowCamera';
import { FollowCloseCamera } from '../camera/FollowCloseCamera';
import { Vehicle } from '../vehicles/Vehicle';
import { Updatable } from '../core/GameLoop';
import { InputManager } from '../input/InputManager';

export type CameraType = 'follow' | 'followClose';

export class CameraManager implements Updatable {
  private cameras: Map<CameraType, Camera> = new Map();
  private activeCamera: Camera | null = null;
  private activeCameraType: CameraType = 'follow';
  private cesiumCamera: Cesium.Camera;

  constructor(cesiumCamera: Cesium.Camera) {
    this.cesiumCamera = cesiumCamera;
    this.initializeCameras();
  }

  private initializeCameras(): void {
    // Create camera instances
    const followCamera = new FollowCamera(this.cesiumCamera);
    const followCloseCamera = new FollowCloseCamera(this.cesiumCamera);

    this.cameras.set('follow', followCamera);
    this.cameras.set('followClose', followCloseCamera);

    // Set default active camera
    this.setActiveCamera('follow');
  }

  public setActiveCamera(cameraType: CameraType): void {
    // Deactivate current camera
    if (this.activeCamera) {
      this.activeCamera.deactivate();
    }

    // Activate new camera
    const newCamera = this.cameras.get(cameraType);
    if (newCamera) {
      this.activeCamera = newCamera;
      this.activeCameraType = cameraType;
      this.activeCamera.activate();
      console.log(`Switched to ${cameraType} camera`);
    }
  }

  public getActiveCamera(): Camera | null {
    return this.activeCamera;
  }

  public getActiveCameraType(): CameraType {
    return this.activeCameraType;
  }

  public switchCamera(): void {
    const cameraTypes: CameraType[] = ['follow', 'followClose'];
    const currentIndex = cameraTypes.indexOf(this.activeCameraType);
    const nextIndex = (currentIndex + 1) % cameraTypes.length;
    this.setActiveCamera(cameraTypes[nextIndex]);
  }

  public setTarget(vehicle: Vehicle | null): void {
    // Set target for all cameras
    for (const camera of this.cameras.values()) {
      camera.setTarget(vehicle);
    }
  }

  public update(deltaTime: number): void {
    // Only update the active camera
    if (this.activeCamera) {
      this.activeCamera.update(deltaTime);
    }
  }

  // Camera-specific methods
  public getFollowCamera(): FollowCamera | null {
    return this.cameras.get('follow') as FollowCamera || null;
  }

  public getFollowCloseCamera(): FollowCloseCamera | null {
    return this.cameras.get('followClose') as FollowCloseCamera || null;
  }

  public setupInputHandling(inputManager: InputManager): void {
    inputManager.onInput('switchCamera', (pressed) => {
      if (pressed) this.switchCamera();
    });
  }

  public destroy(): void {
    if (this.activeCamera) {
      this.activeCamera.deactivate();
    }
    this.cameras.clear();
    this.activeCamera = null;
  }
}
