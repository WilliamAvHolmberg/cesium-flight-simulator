import * as Cesium from 'cesium';
import { Camera } from './Camera';

export class FollowCloseCamera extends Camera {
  private baseDistance: number = 5; // Much closer than regular follow camera
  
  // Camera state
  private targetCameraHeading: number = 0;
  private targetCameraPitch: number = 0;
  private targetCameraRoll: number = 0;
  private currentCameraHeading: number = 0;
  private currentCameraPitch: number = 0;
  private currentCameraRoll: number = 0;
  private appliedCameraRoll: number = 0;
  
  // Previous values for delta calculations
  private lastHeading: number = 0;
  private lastPitch: number = 0;
  
  // Dynamic FOV - EXTREMELY DRAMATIC for close camera!
  private readonly baseFOV: number = Cesium.Math.toRadians(70);  // 70 degrees base (wider for close view)
  private readonly maxFOV: number = Cesium.Math.toRadians(110); // 110 degrees at high speed (INSANE!)
  private currentFOV: number = this.baseFOV;
  
  // Camera constants - more responsive for close following
  private readonly cameraLerpFactor: number = 0.08; // Faster response
  private readonly bankingFactor: number = 1.2; // More dramatic banking
  
  private hpRange: Cesium.HeadingPitchRange = new Cesium.HeadingPitchRange();

  protected onActivate(): void {
    if (this.target && this.target.isModelReady()) {
      const boundingSphere = this.target.getBoundingSphere();
      if (boundingSphere) {
        // Close follow camera - right behind the bumper
        
        // Initialize camera close behind vehicle
        const state = this.target.getState();
        const heading = state.heading + Math.PI/2; // Behind the vehicle
        const pitch = Cesium.Math.toRadians(5.0); // Higher angle - camera looks more horizontally
        
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

    // Close follow camera - stay tight behind vehicle
    this.targetCameraHeading = state.heading + Math.PI/2; // Right behind vehicle
    this.targetCameraPitch = state.pitch + Cesium.Math.toRadians(-10); // Higher angle - more horizon view
    
    // For aircraft with roll, use the actual roll; otherwise use turn-based banking
    if (state.roll !== undefined && Math.abs(state.roll) > 0.01) {
      // Aircraft: use 70% of actual roll for more immersive cockpit feel
      this.targetCameraRoll = state.roll * 0.7;
    } else {
      // Ground vehicle: use turn-induced banking
      this.targetCameraRoll = -headingDelta * this.bankingFactor;
    }

    // Faster interpolation for responsive close following
    this.currentCameraHeading = this.lerpAngle(this.currentCameraHeading, this.targetCameraHeading, this.cameraLerpFactor);
    this.currentCameraPitch = Cesium.Math.lerp(this.currentCameraPitch, this.targetCameraPitch, this.cameraLerpFactor);
    this.currentCameraRoll = Cesium.Math.lerp(this.currentCameraRoll, this.targetCameraRoll, this.cameraLerpFactor);

    // Apply camera movement with close distance
    this.hpRange.heading = this.currentCameraHeading;
    this.hpRange.pitch = this.currentCameraPitch;
    this.hpRange.range = this.baseDistance; // Close distance

    this.cesiumCamera.lookAt(center, this.hpRange);

    // Apply banking for racing feel
    const rollDifference = this.currentCameraRoll - this.appliedCameraRoll;
    if (Math.abs(rollDifference) > 0.001) {
      this.cesiumCamera.twistRight(rollDifference);
      this.appliedCameraRoll = this.currentCameraRoll;
    }

    // Dynamic FOV based on speed (more dramatic for close camera)
    this.updateDynamicFOV(state.speed);

    // Store current values for next frame
    this.lastHeading = state.heading;
    this.lastPitch = state.pitch;
  }

  private updateDynamicFOV(speed: number): void {
    // Speed ranges: 0-120 units
    // Map speed to FOV increase - EXTREMELY AGGRESSIVE for close camera!
    const speedFactor = Math.min(speed / 70, 1.0); // Kicks in very early!
    // Cubic curve for even MORE dramatic ramp
    const dramaticFactor = speedFactor * speedFactor * speedFactor;
    const targetFOV = Cesium.Math.lerp(this.baseFOV, this.maxFOV, dramaticFactor);
    
    // Fast FOV transition for instant impact
    this.currentFOV = Cesium.Math.lerp(this.currentFOV, targetFOV, 0.1);
    
    // Apply to camera (if it's a perspective frustum)
    if (this.cesiumCamera.frustum instanceof Cesium.PerspectiveFrustum) {
      this.cesiumCamera.frustum.fov = this.currentFOV;
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
