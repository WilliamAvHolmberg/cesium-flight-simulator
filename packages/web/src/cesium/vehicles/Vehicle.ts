import * as Cesium from 'cesium';
import { Updatable } from '../core/GameLoop';

export interface VehicleConfig {
  modelUrl: string;
  scale?: number;
  position: Cesium.Cartesian3;
  heading?: number;
  pitch?: number;
  roll?: number;
  modelHeadingOffset?: number;
}

export interface VehicleState {
  position: Cesium.Cartesian3;
  heading: number;
  pitch: number;
  roll: number;
  velocity: number;
  speed: number;
}

export abstract class Vehicle implements Updatable {
  protected primitive: Cesium.Model | null = null;
  protected position: Cesium.Cartesian3;
  protected hpRoll: Cesium.HeadingPitchRoll;
  protected velocity: number = 0;
  protected speed: number = 0;
  protected isReady: boolean = false;
  protected sceneRef: Cesium.Scene | null = null;
  protected modelHeadingOffset: number = 0;
  public physicsEnabled: boolean = true;

  public readonly id: string;
  public readonly config: VehicleConfig;

  private static readonly scratchPositionClone = new Cesium.Cartesian3();
  private static readonly scratchHPR = new Cesium.HeadingPitchRoll();

  constructor(id: string, config: VehicleConfig) {
    this.id = id;
    this.config = config;
    this.position = Cesium.Cartesian3.clone(config.position);
    this.hpRoll = new Cesium.HeadingPitchRoll(
      config.heading || 0,
      config.pitch || 0,
      config.roll || 0
    );
    this.modelHeadingOffset = config.modelHeadingOffset || 0;
  }

  public async initialize(scene: Cesium.Scene): Promise<void> {
    try {
      this.sceneRef = scene;
      
      Vehicle.scratchHPR.heading = this.hpRoll.heading + this.modelHeadingOffset;
      Vehicle.scratchHPR.pitch = this.hpRoll.pitch;
      Vehicle.scratchHPR.roll = this.hpRoll.roll;
      
      this.primitive = scene.primitives.add(
        await Cesium.Model.fromGltfAsync({
          url: this.config.modelUrl,
          scale: this.config.scale || 1.0,
          modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(
            this.position,
            Vehicle.scratchHPR,
            Cesium.Ellipsoid.WGS84
          )
        })
      );

      this.primitive?.readyEvent.addEventListener(() => {
        this.isReady = true;
        this.onModelReady();
      });
    } catch (error) {
      console.error(`Failed to load vehicle model: ${error}`);
    }
  }

  protected onModelReady(): void {
    // Override in subclasses for specific initialization
  }

  public abstract update(deltaTime: number): void;

  public setInput(_input: Record<string, boolean | number | undefined>): void {
    // Override in subclasses
  }

  public toggleCollisionDetection?(): void {
    // Optional - override in subclasses that support collision detection
  }

  public getState(): VehicleState {
    Cesium.Cartesian3.clone(this.position, Vehicle.scratchPositionClone);
    return {
      position: Vehicle.scratchPositionClone,
      heading: this.hpRoll.heading,
      pitch: this.hpRoll.pitch,
      roll: this.hpRoll.roll,
      velocity: this.velocity,
      speed: this.speed
    };
  }

  public setState(state: VehicleState): void {
    this.position = Cesium.Cartesian3.clone(state.position);
    this.hpRoll.heading = state.heading;
    this.hpRoll.pitch = state.pitch;
    this.hpRoll.roll = state.roll;
    this.velocity = state.velocity;
    this.speed = state.speed;
    this.updateModelMatrix();
  }

  public getPosition(): Cesium.Cartesian3 {
    return Cesium.Cartesian3.clone(this.position, Vehicle.scratchPositionClone);
  }

  public getBoundingSphere(): Cesium.BoundingSphere | null {
    return this.primitive?.boundingSphere || null;
  }

  public isModelReady(): boolean {
    return this.isReady;
  }

  protected updateModelMatrix(): void {
    if (this.primitive) {
      Vehicle.scratchHPR.heading = this.hpRoll.heading + this.modelHeadingOffset;
      Vehicle.scratchHPR.pitch = this.hpRoll.pitch;
      Vehicle.scratchHPR.roll = this.hpRoll.roll;
      
      Cesium.Transforms.headingPitchRollToFixedFrame(
        this.position,
        Vehicle.scratchHPR,
        Cesium.Ellipsoid.WGS84,
        undefined,
        this.primitive.modelMatrix
      );
    }
  }

  public destroy(): void {
    if (this.primitive) {
      if (this.sceneRef) {
        try {
          this.sceneRef.primitives.remove(this.primitive);
        } catch {}
      }
      this.primitive = null;
      this.isReady = false;
    }
  }
}
