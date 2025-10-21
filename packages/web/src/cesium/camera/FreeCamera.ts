import * as Cesium from 'cesium';
import { Camera } from './Camera';

export class FreeCamera extends Camera {
  private position: Cesium.Cartesian3;
  private heading: number = 0;
  private pitch: number = Cesium.Math.toRadians(-20);
  
  private moveSpeed: number = 50;
  private fastMoveSpeed: number = 200;
  private rotateSpeed: number = 0.05;
  
  private moveInput = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    fast: false
  };

  constructor(cesiumCamera: Cesium.Camera, startPosition?: Cesium.Cartesian3) {
    super(cesiumCamera);
    this.position = startPosition || cesiumCamera.position.clone();
  }

  protected onActivate(): void {
    if (this.target) {
      this.position = this.target.getPosition().clone();
      const state = this.target.getState();
      this.heading = state.heading;
      this.pitch = Cesium.Math.toRadians(-20);
    }
    
    const cartographic = Cesium.Cartographic.fromCartesian(this.position);
    cartographic.height += 50;
    this.position = Cesium.Cartographic.toCartesian(cartographic);
  }

  public update(deltaTime: number): void {
    if (!this.isActive) return;

    const speed = this.moveInput.fast ? this.fastMoveSpeed : this.moveSpeed;
    const moveDistance = speed * deltaTime;

    const forward = new Cesium.Cartesian3();
    const right = new Cesium.Cartesian3();
    const up = Cesium.Cartesian3.UNIT_Z.clone();

    Cesium.Cartesian3.fromElements(
      Math.sin(this.heading),
      Math.cos(this.heading),
      0,
      forward
    );

    Cesium.Cartesian3.cross(forward, up, right);
    Cesium.Cartesian3.normalize(right, right);

    if (this.moveInput.forward) {
      const delta = Cesium.Cartesian3.multiplyByScalar(forward, moveDistance, new Cesium.Cartesian3());
      Cesium.Cartesian3.add(this.position, delta, this.position);
    }
    if (this.moveInput.backward) {
      const delta = Cesium.Cartesian3.multiplyByScalar(forward, -moveDistance, new Cesium.Cartesian3());
      Cesium.Cartesian3.add(this.position, delta, this.position);
    }
    if (this.moveInput.right) {
      const delta = Cesium.Cartesian3.multiplyByScalar(right, moveDistance, new Cesium.Cartesian3());
      Cesium.Cartesian3.add(this.position, delta, this.position);
    }
    if (this.moveInput.left) {
      const delta = Cesium.Cartesian3.multiplyByScalar(right, -moveDistance, new Cesium.Cartesian3());
      Cesium.Cartesian3.add(this.position, delta, this.position);
    }
    if (this.moveInput.up) {
      const delta = Cesium.Cartesian3.multiplyByScalar(up, moveDistance, new Cesium.Cartesian3());
      Cesium.Cartesian3.add(this.position, delta, this.position);
    }
    if (this.moveInput.down) {
      const delta = Cesium.Cartesian3.multiplyByScalar(up, -moveDistance, new Cesium.Cartesian3());
      Cesium.Cartesian3.add(this.position, delta, this.position);
    }

    this.cesiumCamera.setView({
      destination: this.position,
      orientation: {
        heading: this.heading,
        pitch: this.pitch,
        roll: 0
      }
    });
  }

  public setMoveInput(input: Partial<typeof this.moveInput>): void {
    Object.assign(this.moveInput, input);
  }

  public rotate(headingDelta: number, pitchDelta: number): void {
    this.heading += headingDelta * this.rotateSpeed;
    this.pitch += pitchDelta * this.rotateSpeed;
    
    this.pitch = Math.max(
      Cesium.Math.toRadians(-89),
      Math.min(Cesium.Math.toRadians(89), this.pitch)
    );
  }

  public setPosition(position: Cesium.Cartesian3): void {
    this.position = position.clone();
  }

  public getPosition(): Cesium.Cartesian3 {
    return this.position.clone();
  }
}
