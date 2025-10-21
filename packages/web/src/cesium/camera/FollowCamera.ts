import * as Cesium from 'cesium';
import { Camera } from './Camera';

export class FollowCamera extends Camera {
  private baseDistance: number = 25;
  
  private targetCameraHeading: number = 0;
  private targetCameraPitch: number = 0;
  private targetCameraRoll: number = 0;
  private currentCameraHeading: number = 0;
  private currentCameraPitch: number = 0;
  private currentCameraRoll: number = 0;
  private appliedCameraRoll: number = 0;
  
  private lastHeading: number = 0;
  private lastPitch: number = 0;
  
  private readonly baseFOV: number = Cesium.Math.toRadians(60);
  private readonly maxFOV: number = Cesium.Math.toRadians(100);
  private currentFOV: number = this.baseFOV;
  
  private readonly cameraLerpFactor: number = 0.04;
  private readonly bankingFactor: number = 2;
  
  private hpRange: Cesium.HeadingPitchRange = new Cesium.HeadingPitchRange();

  protected onActivate(): void {
    if (this.target && this.target.isModelReady()) {
      const boundingSphere = this.target.getBoundingSphere();
      if (boundingSphere) {
        
        // Initialize camera to look at vehicle from behind
        const state = this.target.getState();
        const heading = state.heading + Math.PI; // 180 degrees behind the vehicle
        const pitch = Cesium.Math.toRadians(-15.0);
        
        this.currentCameraHeading = this.targetCameraHeading = Cesium.Math.zeroToTwoPi(heading);
        this.currentCameraPitch = this.targetCameraPitch = pitch;
        this.currentCameraRoll = this.targetCameraRoll = 0;
        this.lastHeading = Cesium.Math.zeroToTwoPi(state.heading);
        this.lastPitch = state.pitch;
        
        this.hpRange.heading = heading;
        this.hpRange.pitch = pitch;
        this.hpRange.range = this.baseDistance;
      }
    }
  }

  public update(_deltaTime: number): void {
    if (!this.isActive || !this.target || !this.target.isModelReady()) {
      return;
    }

    const boundingSphere = this.target.getBoundingSphere();
    if (!boundingSphere) return;

    const state = this.target.getState();
    const center = boundingSphere.center;

    // Calculate heading change for banking effect
    const headingDelta = this.getAngularDelta(state.heading, this.lastHeading);

    // Update camera targets with smooth following - position camera behind vehicle
    this.targetCameraHeading = state.heading + Math.PI/2; // 180 degrees behind vehicle
    this.targetCameraPitch = state.pitch - Cesium.Math.toRadians(10); // Look over vehicle
    
    // For aircraft with roll, use the actual roll; otherwise use turn-based banking
    if (state.roll !== undefined && Math.abs(state.roll) > 0.01) {
      // Aircraft: use 50% of actual roll for smooth banking
      this.targetCameraRoll = state.roll * 0.5;
    } else {
      // Ground vehicle: use turn-induced banking
      this.targetCameraRoll = -headingDelta * this.bankingFactor * 0.3;
    }

    // Smooth interpolation for cinematic movement
    this.currentCameraHeading = this.lerpAngle(this.currentCameraHeading, this.targetCameraHeading, this.cameraLerpFactor);
    this.currentCameraPitch = Cesium.Math.lerp(this.currentCameraPitch, this.targetCameraPitch, this.cameraLerpFactor);
    this.currentCameraRoll = Cesium.Math.lerp(this.currentCameraRoll, this.targetCameraRoll, this.cameraLerpFactor);

    // Apply camera movement
    this.hpRange.heading = this.currentCameraHeading;
    this.hpRange.pitch = this.currentCameraPitch;
    this.hpRange.range = this.baseDistance;

    this.cesiumCamera.lookAt(center, this.hpRange);

    // Apply smooth banking
    const rollDifference = this.currentCameraRoll - this.appliedCameraRoll;
    if (Math.abs(rollDifference) > 0.001) {
      this.cesiumCamera.twistRight(rollDifference);
      this.appliedCameraRoll = this.currentCameraRoll;
    }

    // Dynamic FOV based on speed
    this.updateDynamicFOV(state.speed);

    // Store current values for next frame
    this.lastHeading = state.heading;
    this.lastPitch = state.pitch;
  }

  private updateDynamicFOV(speed: number): void {
    const speedFactor = Math.min(speed / 80, 1.0);
    const dramaticFactor = speedFactor * speedFactor;
    const targetFOV = Cesium.Math.lerp(this.baseFOV, this.maxFOV, dramaticFactor);
    
    const fovDiff = Math.abs(targetFOV - this.currentFOV);
    if (fovDiff > 0.001) {
      this.currentFOV = Cesium.Math.lerp(this.currentFOV, targetFOV, 0.08);
      
      if (this.cesiumCamera.frustum instanceof Cesium.PerspectiveFrustum) {
        this.cesiumCamera.frustum.fov = this.currentFOV;
      }
    }
  }

  private lerpAngle(start: number, end: number, factor: number): number {
    start = Cesium.Math.zeroToTwoPi(start);
    end = Cesium.Math.zeroToTwoPi(end);

    let delta = end - start;

    if (delta > Math.PI) {
      delta -= Cesium.Math.TWO_PI;
    } else if (delta < -Math.PI) {
      delta += Cesium.Math.TWO_PI;
    }

    return Cesium.Math.zeroToTwoPi(start + delta * factor);
  }

  private getAngularDelta(current: number, previous: number): number {
    current = Cesium.Math.zeroToTwoPi(current);
    previous = Cesium.Math.zeroToTwoPi(previous);

    let delta = current - previous;

    if (delta > Math.PI) {
      delta -= Cesium.Math.TWO_PI;
    } else if (delta < -Math.PI) {
      delta += Cesium.Math.TWO_PI;
    }

    return delta;
  }
}
