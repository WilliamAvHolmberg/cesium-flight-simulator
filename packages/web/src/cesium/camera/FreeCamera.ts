import * as Cesium from 'cesium';
import { Camera } from './Camera';

export class FreeCamera extends Camera {
  private position: Cesium.Cartesian3;
  private heading: number = 0;
  private pitch: number = Cesium.Math.toRadians(-20);
  
  private moveSpeed: number = 50;
  private fastMoveSpeed: number = 200;
  private lookSpeed: number = 0.002;
  
  private moveInput = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    fast: false
  };

  private isPointerLocked: boolean = false;
  private canvas: HTMLCanvasElement | null = null;

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

    this.setupPointerLock();
  }

  protected onDeactivate(): void {
    this.releasePointerLock();
  }

  private setupPointerLock(): void {
    const cesiumContainer = document.getElementById('cesiumContainer');
    this.canvas = cesiumContainer?.querySelector('canvas') || null;

    if (!this.canvas) return;

    this.canvas.addEventListener('click', this.requestPointerLock.bind(this));
    document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));

    console.log('🎯 Click the canvas to enable mouse look');
  }

  private requestPointerLock(): void {
    if (!this.canvas || this.isPointerLocked) return;
    this.canvas.requestPointerLock();
  }

  private releasePointerLock(): void {
    if (this.isPointerLocked) {
      document.exitPointerLock();
    }
    
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.requestPointerLock.bind(this));
    }
    document.removeEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
  }

  private onPointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
    console.log(this.isPointerLocked ? '🔒 Mouse locked - look around!' : '🔓 Mouse unlocked (press ESC)');
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isPointerLocked) return;

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    this.heading -= movementX * this.lookSpeed;
    this.pitch -= movementY * this.lookSpeed;

    this.pitch = Math.max(
      Cesium.Math.toRadians(-89),
      Math.min(Cesium.Math.toRadians(89), this.pitch)
    );
  }

  public update(deltaTime: number): void {
    if (!this.isActive) return;

    const speed = this.moveInput.fast ? this.fastMoveSpeed : this.moveSpeed;
    const moveDistance = speed * deltaTime;

    const transform = Cesium.Transforms.eastNorthUpToFixedFrame(this.position);
    
    const localForward = new Cesium.Cartesian3(
      -Math.sin(this.heading) * Math.cos(this.pitch),
      Math.cos(this.heading) * Math.cos(this.pitch),
      Math.sin(this.pitch)
    );
    
    const localRight = new Cesium.Cartesian3(
      Math.cos(this.heading),
      Math.sin(this.heading),
      0
    );
    
    const localUp = new Cesium.Cartesian3(0, 0, 1);

    const worldForward = Cesium.Matrix4.multiplyByPointAsVector(transform, localForward, new Cesium.Cartesian3());
    const worldRight = Cesium.Matrix4.multiplyByPointAsVector(transform, localRight, new Cesium.Cartesian3());
    const worldUp = Cesium.Matrix4.multiplyByPointAsVector(transform, localUp, new Cesium.Cartesian3());
    
    Cesium.Cartesian3.normalize(worldForward, worldForward);
    Cesium.Cartesian3.normalize(worldRight, worldRight);
    Cesium.Cartesian3.normalize(worldUp, worldUp);

    if (this.moveInput.forward) {
      const delta = Cesium.Cartesian3.multiplyByScalar(worldForward, moveDistance, new Cesium.Cartesian3());
      Cesium.Cartesian3.add(this.position, delta, this.position);
    }
    if (this.moveInput.backward) {
      const delta = Cesium.Cartesian3.multiplyByScalar(worldForward, -moveDistance, new Cesium.Cartesian3());
      Cesium.Cartesian3.add(this.position, delta, this.position);
    }
    if (this.moveInput.right) {
      const delta = Cesium.Cartesian3.multiplyByScalar(worldRight, moveDistance, new Cesium.Cartesian3());
      Cesium.Cartesian3.add(this.position, delta, this.position);
    }
    if (this.moveInput.left) {
      const delta = Cesium.Cartesian3.multiplyByScalar(worldRight, -moveDistance, new Cesium.Cartesian3());
      Cesium.Cartesian3.add(this.position, delta, this.position);
    }
    if (this.moveInput.up) {
      const delta = Cesium.Cartesian3.multiplyByScalar(worldUp, moveDistance, new Cesium.Cartesian3());
      Cesium.Cartesian3.add(this.position, delta, this.position);
    }
    if (this.moveInput.down) {
      const delta = Cesium.Cartesian3.multiplyByScalar(worldUp, -moveDistance, new Cesium.Cartesian3());
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

  public setPosition(position: Cesium.Cartesian3): void {
    this.position = position.clone();
  }

  public getPosition(): Cesium.Cartesian3 {
    return this.position.clone();
  }

  public isMouseLocked(): boolean {
    return this.isPointerLocked;
  }
}
