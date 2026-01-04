import * as Cesium from 'cesium';
import { Vehicle, VehicleConfig } from '../Vehicle';
import { CarPhysics, PhysicsConfig, PhysicsInput } from './CarPhysics';
import { SmartTerrainClamping } from '../../terrain/SmartTerrainClamping';
import { SmartCollisionDetector } from '../../collision/SmartCollisionDetector';

export class Car extends Vehicle {
  private physics: CarPhysics;
  private smartTerrainClamping: SmartTerrainClamping | null = null;
  private collisionDetector: SmartCollisionDetector | null = null;
  private speedVector: Cesium.Cartesian3 = new Cesium.Cartesian3();
  private roverMode: boolean = true;
  private scene: Cesium.Scene | null = null;

  private collisionDetectionEnabled: boolean = false;

  private currentVehicleHeading: number = 0;
  private currentVehiclePitch: number = 0;
  private currentVehicleRoll: number = 0;
  private targetPitch: number = 0;
  private targetRoll: number = 0;

  private input: PhysicsInput = {
    throttle: false,
    brake: false,
    turnLeft: false,
    turnRight: false
  };

  private static readonly scratchTransform = new Cesium.Matrix4();
  private static readonly scratchLocalForward = new Cesium.Cartesian3();
  private static readonly scratchWorldForward = new Cesium.Cartesian3();
  private static readonly scratchBounceVector = new Cesium.Cartesian3();
  private static readonly scratchCarHPR = new Cesium.HeadingPitchRoll();

  constructor(id: string, config: VehicleConfig) {
    super(id, config);

    const physicsConfig: PhysicsConfig = {
      vehicleMass: 2400,
      engineForce: 80000,
      brakeForce: 120000,
      rollingResistance: 0.15,
      airDragCoefficient: 2.5,
      maxSpeed: 120,
      wheelbase: 8.0,
      maxSteeringAngle: Cesium.Math.toRadians(15)
    };

    this.physics = new CarPhysics(physicsConfig);
    // Smart terrain clamping and collision detector initialized in initialize()
    this.currentVehicleHeading = this.hpRoll.heading;
    this.currentVehiclePitch = this.hpRoll.pitch;
    this.currentVehicleRoll = this.hpRoll.roll;
  }

  public async initialize(scene: Cesium.Scene): Promise<void> {
    this.scene = scene;
    // Initialize smart terrain clamping (uses cached heights instead of per-frame raycasts)
    this.smartTerrainClamping = new SmartTerrainClamping(scene, 0);
    // Initialize smart collision detector (altitude/velocity-based throttling)
    this.collisionDetector = new SmartCollisionDetector(scene);
    await super.initialize(scene);
  }

  protected onModelReady(): void {
    if (this.primitive) {
      this.primitive.activeAnimations.addAll({
        multiplier: 0.5,
        loop: Cesium.ModelAnimationLoop.REPEAT,
      });
    }
  }

  public update(deltaTime: number): void {
    if (!this.isReady || !this.physicsEnabled) return;

    // Tick collision detector frame counter
    this.collisionDetector?.tick();

    // Update physics WITHOUT collision context (we handle collision separately now)
    const physicsResult = this.physics.update(deltaTime, this.input);

    this.velocity = physicsResult.velocity;
    this.speed = physicsResult.speed;

    if (Math.abs(this.velocity) > 0.1) {
      this.currentVehicleHeading += physicsResult.turnRate * deltaTime;
      this.currentVehicleHeading = Cesium.Math.zeroToTwoPi(this.currentVehicleHeading);
    }

    this.currentVehiclePitch = Cesium.Math.lerp(this.currentVehiclePitch, this.targetPitch, 0.05);
    this.currentVehicleRoll = Cesium.Math.lerp(this.currentVehicleRoll, this.targetRoll, 0.05);

    this.hpRoll.heading = this.currentVehicleHeading;
    this.hpRoll.pitch = this.currentVehiclePitch;
    this.hpRoll.roll = this.currentVehicleRoll;

    const signedStep = this.velocity * 0.01;

    Car.scratchCarHPR.heading = this.currentVehicleHeading;
    Car.scratchCarHPR.pitch = this.currentVehiclePitch;
    Car.scratchCarHPR.roll = this.currentVehicleRoll;

    const movementMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(
      this.position,
      Car.scratchCarHPR,
      Cesium.Ellipsoid.WGS84,
      undefined,
      Car.scratchTransform
    );

    this.speedVector = Cesium.Cartesian3.multiplyByScalar(
      Cesium.Cartesian3.UNIT_X,
      signedStep,
      this.speedVector
    );

    this.position = Cesium.Matrix4.multiplyByPoint(
      movementMatrix,
      this.speedVector,
      this.position
    );

    // Smart collision detection (velocity-based throttling - only checks when moving)
    if (this.collisionDetectionEnabled && this.collisionDetector) {
      const exclude = this.primitive ? [this.primitive] : [];
      const collisionResult = this.collisionDetector.checkCarCollision(
        this.position,
        this.currentVehicleHeading,
        this.velocity,
        exclude
      );

      if (collisionResult.collision && collisionResult.bounce) {
        // Apply bounce
        this.physics.reset();
        Cesium.Transforms.eastNorthUpToFixedFrame(this.position, undefined, Car.scratchTransform);
        Car.scratchLocalForward.x = Math.cos(this.currentVehicleHeading);
        Car.scratchLocalForward.y = -Math.sin(this.currentVehicleHeading);
        Car.scratchLocalForward.z = 0;

        const worldForward = Cesium.Matrix4.multiplyByPointAsVector(
          Car.scratchTransform,
          Car.scratchLocalForward,
          Car.scratchWorldForward
        );
        Cesium.Cartesian3.normalize(worldForward, worldForward);
        const bounceVector = Cesium.Cartesian3.multiplyByScalar(
          worldForward,
          collisionResult.bounce,
          Car.scratchBounceVector
        );
        this.position = Cesium.Cartesian3.add(this.position, bounceVector, this.position);
      }
    }

    // Smart ground clamping (uses cached heights, only precise check every 15 frames)
    if (this.roverMode) {
      this.clampToGround();
    }

    this.updateModelMatrix();
  }

  private clampToGround(): void {
    if (this.scene && this.primitive && this.smartTerrainClamping) {
      this.position = this.smartTerrainClamping.clampToGround(
        this.position,
        this.scene,
        [this.primitive]
      );
    }
  }

  public setInput(input: Partial<PhysicsInput>): void {
    Object.assign(this.input, input);
  }

  public setPitchRollInput(pitchDelta: number, rollDelta: number): void {
    const maxPitchRate = Cesium.Math.toRadians(0.8);
    const maxRollRate = Cesium.Math.toRadians(2.5);
    
    this.targetPitch += pitchDelta * maxPitchRate;
    this.targetRoll += rollDelta * maxRollRate;
  }

  public setRoverMode(enabled: boolean): void {
    this.roverMode = enabled;
  }

  public getRoverMode(): boolean {
    return this.roverMode;
  }

  public setCollisionDetection(enabled: boolean): void {
    this.collisionDetectionEnabled = enabled;
  }

  public getCollisionDetection(): boolean {
    return this.collisionDetectionEnabled;
  }

  public toggleCollisionDetection(): void {
    this.setCollisionDetection(!this.collisionDetectionEnabled);
  }
}

