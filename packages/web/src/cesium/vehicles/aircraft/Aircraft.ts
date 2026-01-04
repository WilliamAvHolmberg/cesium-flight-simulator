import * as Cesium from 'cesium';
import { Vehicle, VehicleConfig } from '../Vehicle';
import { AircraftPhysics, AircraftInput } from './AircraftPhysics';
import { SmartCollisionDetector } from '../../collision/SmartCollisionDetector';

interface AircraftConfig extends VehicleConfig {
}

export class Aircraft extends Vehicle {
  private physics: AircraftPhysics;
  private collisionDetector: SmartCollisionDetector | null = null;
  private input: AircraftInput = {
    throttle: false,
    brake: false,
    turnLeft: false,
    turnRight: false,
    altitudeUp: false,
    altitudeDown: false,
    rollLeft: false,
    rollRight: false
  };
  private crashed: boolean = false;

  private static readonly scratchTransform = new Cesium.Matrix4();
  private static readonly scratchWorldForward = new Cesium.Cartesian3();
  private static readonly scratchForwardWorldDelta = new Cesium.Cartesian3();
  private static readonly scratchENU = new Cesium.Matrix4();
  private static readonly scratchUpCol = new Cesium.Cartesian4();
  private static readonly scratchUp = new Cesium.Cartesian3();
  private static readonly scratchVerticalDeltaVec = new Cesium.Cartesian3();
  private static readonly scratchTotalDelta = new Cesium.Cartesian3();
  private static readonly scratchLocalForward = new Cesium.Cartesian3();
  private static readonly scratchWorldForwardCollision = new Cesium.Cartesian3();
  private static readonly scratchProbe = new Cesium.Cartesian3();
  private static readonly scratchScaled = new Cesium.Cartesian3();

  constructor(id: string, config: AircraftConfig) {
    super(id, config);
    this.physics = new AircraftPhysics({
      minSpeed: 15,
      maxSpeed: 1200,
      speedChangeRate: 25,
      turnRate: Cesium.Math.toRadians(45),
      climbRate: 20,
      gravity: 2,
      rollRate: Cesium.Math.toRadians(60),
      maxRoll: Cesium.Math.toRadians(45),
      pitchRate: Cesium.Math.toRadians(60),
      maxPitch: Cesium.Math.toRadians(60)
    }, this.hpRoll.heading);
  }

  public async initialize(scene: Cesium.Scene): Promise<void> {
    // Initialize smart collision detector (altitude-based throttling)
    this.collisionDetector = new SmartCollisionDetector(scene, {
      lowAltitudeThreshold: 300,
      lowAltitudeCheckInterval: 6,
      highAltitudeCheckInterval: 30,
      collisionBuffer: 2.0,
      probeDistance: 5.0
    });
    await super.initialize(scene);
  }

  protected onModelReady(): void {
    if (this.primitive) {
      this.primitive.activeAnimations.addAll({
        multiplier: 0.6,
        loop: Cesium.ModelAnimationLoop.REPEAT
      });
    }
  }

  public update(deltaTime: number): void {
    if (!this.isReady || this.crashed || !this.physicsEnabled) return;

    const result = this.physics.update(deltaTime, this.input);

    this.hpRoll.heading = result.heading;
    this.hpRoll.pitch = result.pitch;
    this.hpRoll.roll = result.roll;

    if (this.primitive) {
      Cesium.Transforms.headingPitchRollToFixedFrame(
        this.position,
        this.hpRoll,
        Cesium.Ellipsoid.WGS84,
        undefined,
        Aircraft.scratchTransform
      );
      const worldForward = Cesium.Matrix4.multiplyByPoint(
        Aircraft.scratchTransform,
        result.positionDelta,
        Aircraft.scratchWorldForward
      );
      const forwardWorldDelta = Cesium.Cartesian3.subtract(
        worldForward, 
        this.position, 
        Aircraft.scratchForwardWorldDelta
      );

      Cesium.Transforms.eastNorthUpToFixedFrame(this.position, undefined, Aircraft.scratchENU);
      const upCol = Cesium.Matrix4.getColumn(Aircraft.scratchENU, 2, Aircraft.scratchUpCol);
      Cesium.Cartesian3.fromCartesian4(upCol, Aircraft.scratchUp);
      const verticalDeltaVec = Cesium.Cartesian3.multiplyByScalar(
        Aircraft.scratchUp, 
        result.verticalDelta, 
        Aircraft.scratchVerticalDeltaVec
      );

      const totalDelta = Cesium.Cartesian3.add(
        forwardWorldDelta, 
        verticalDeltaVec, 
        Aircraft.scratchTotalDelta
      );
      this.position = Cesium.Cartesian3.add(this.position, totalDelta, this.position);
    }

    this.velocity = result.speed;
    this.speed = Math.abs(result.speed);

    // Smart collision detection (altitude-based throttling)
    // High altitude: checks every 30 frames (~2/sec)
    // Low altitude: checks every 6 frames (~10/sec)
    if (this.collisionDetector) {
      this.collisionDetector.tick();
      const exclude = this.primitive ? [this.primitive] : [];
      const collisionResult = this.collisionDetector.checkAircraftCollision(
        this.position,
        this.hpRoll.heading,
        exclude
      );

      if (collisionResult.collision) {
        this.crash();
      }
    }

    this.updateModelMatrix();
  }

  private crash(): void {
    this.crashed = true;
    this.velocity = 0;
    this.speed = 0;
    console.log('✈️ Aircraft crashed');
  }

  public isCrashed(): boolean {
    return this.crashed;
  }

  public resetCrash(): void {
    this.crashed = false;
  }

  public setInput(input: Partial<AircraftInput>): void {
    Object.assign(this.input, input);
  }
}

