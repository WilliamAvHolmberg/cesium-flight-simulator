import * as Cesium from 'cesium';
import { Camera } from './Camera';

export class DroneCamera extends Camera {
  private height: number = 100; // Height above target
  private distance: number = 80; // Horizontal distance from target
  private angle: number = 0; // Current angle around target
  private targetAngle: number = 0; // Target angle for smooth rotation

  // Camera movement settings
  private readonly rotationSpeed: number = 0.5; // radians per second
  private readonly heightChangeSpeed: number = 20; // meters per second
  private readonly distanceChangeSpeed: number = 30; // meters per second
  private readonly lerpFactor: number = 0.02; // Smooth movement factor

  // Input state for manual control
  private manualControl: boolean = false;
  private manualInput = {
    rotateLeft: false,
    rotateRight: false,
    moveUp: false,
    moveDown: false,
    moveCloser: false,
    moveFarther: false
  };

  protected onActivate(): void {
    if (this.target) {
      // Position camera above and behind the target
      const state = this.target.getState();
      this.angle = state.heading + Math.PI; // Start behind the vehicle
      this.targetAngle = this.angle;
    }
  }

  public update(deltaTime: number): void {
    if (!this.isActive || !this.target) {
      return;
    }

    const targetPosition = this.target.getPosition();
    
    // Handle manual input
    this.handleManualInput(deltaTime);

    // Auto-rotate around target if not in manual control
    if (!this.manualControl) {
      this.targetAngle += 0.3 * deltaTime; // Slow auto-rotation
    }

    // Smooth angle interpolation
    this.angle = Cesium.Math.lerp(this.angle, this.targetAngle, this.lerpFactor);

    // Calculate camera position in a circle around the target
    const offsetX = Math.cos(this.angle) * this.distance;
    const offsetY = Math.sin(this.angle) * this.distance;
    
    // Convert target position to cartographic for height calculation
    const targetCartographic = Cesium.Cartographic.fromCartesian(targetPosition);
    
    // Calculate camera position
    const cameraCartographic = new Cesium.Cartographic(
      targetCartographic.longitude + (offsetX / 111320), // Rough meters to degrees conversion
      targetCartographic.latitude + (offsetY / 110540),   // Rough meters to degrees conversion
      targetCartographic.height + this.height
    );
    
    const cameraPosition = Cesium.Cartographic.toCartesian(cameraCartographic);
    
    // Look at the target
    const up = Cesium.Cartesian3.UNIT_Z;
    this.cesiumCamera.setView({
      destination: cameraPosition,
      orientation: {
        direction: Cesium.Cartesian3.normalize(
          Cesium.Cartesian3.subtract(targetPosition, cameraPosition, new Cesium.Cartesian3()),
          new Cesium.Cartesian3()
        ),
        up: up
      }
    });
  }

  private handleManualInput(deltaTime: number): void {
    // Check if any manual input is active
    this.manualControl = Object.values(this.manualInput).some(value => value);

    if (this.manualInput.rotateLeft) {
      this.targetAngle -= this.rotationSpeed * deltaTime;
    }
    if (this.manualInput.rotateRight) {
      this.targetAngle += this.rotationSpeed * deltaTime;
    }
    if (this.manualInput.moveUp) {
      this.height += this.heightChangeSpeed * deltaTime;
      this.height = Math.min(this.height, 500); // Max height limit
    }
    if (this.manualInput.moveDown) {
      this.height -= this.heightChangeSpeed * deltaTime;
      this.height = Math.max(this.height, 10); // Min height limit
    }
    if (this.manualInput.moveCloser) {
      this.distance -= this.distanceChangeSpeed * deltaTime;
      this.distance = Math.max(this.distance, 20); // Min distance limit
    }
    if (this.manualInput.moveFarther) {
      this.distance += this.distanceChangeSpeed * deltaTime;
      this.distance = Math.min(this.distance, 200); // Max distance limit
    }
  }

  public setManualInput(input: Partial<typeof this.manualInput>): void {
    Object.assign(this.manualInput, input);
  }

  public setHeight(height: number): void {
    this.height = Math.max(10, Math.min(500, height));
  }

  public setDistance(distance: number): void {
    this.distance = Math.max(20, Math.min(200, distance));
  }

  public getHeight(): number {
    return this.height;
  }

  public getDistance(): number {
    return this.distance;
  }
}
