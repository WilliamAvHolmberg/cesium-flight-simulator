import * as Cesium from 'cesium';

export interface AircraftInput {
  throttle: boolean;
  brake: boolean;
  turnLeft: boolean;
  turnRight: boolean;
  altitudeUp: boolean;
  altitudeDown: boolean;
  rollLeft: boolean;
  rollRight: boolean;
  targetSpeed?: number;
}

export interface AircraftConfig {
  minSpeed: number;
  maxSpeed: number;
  speedChangeRate: number;
  turnRate: number;
  climbRate: number;
  gravity: number;
  rollRate: number;
  maxRoll: number;
  pitchRate: number;
  maxPitch: number;
}

export interface AircraftState {
  speed: number;
  heading: number;
  pitch: number;
  roll: number;
  verticalVelocity: number;
}

export interface AircraftUpdateResult {
  positionDelta: Cesium.Cartesian3;
  verticalDelta: number;
  heading: number;
  pitch: number;
  roll: number;
  speed: number;
}

export class AircraftPhysics {
  private currentSpeed: number;
  private targetSpeed: number;
  private heading: number;
  private pitch: number;
  private roll: number;
  private verticalVelocity: number;

  private static readonly scratchLocalForward = new Cesium.Cartesian3(1, 0, 0);
  private static readonly scratchPositionDelta = new Cesium.Cartesian3();

  constructor(private config: AircraftConfig, initialHeading: number = 0) {
    this.currentSpeed = config.minSpeed;
    this.targetSpeed = config.minSpeed;
    this.heading = initialHeading;
    this.pitch = 0;
    this.roll = 0;
    this.verticalVelocity = 0;
  }

  public update(deltaTime: number, input: AircraftInput): AircraftUpdateResult {
    if (input.targetSpeed !== undefined) {
      this.targetSpeed = Math.max(this.config.minSpeed, Math.min(this.config.maxSpeed, input.targetSpeed));
    } else {
      const targetDelta = (input.throttle ? 1 : 0) - (input.brake ? 1 : 0);
      if (targetDelta !== 0) {
        this.targetSpeed += targetDelta * this.config.speedChangeRate * deltaTime;
      }
      this.targetSpeed = Math.max(this.config.minSpeed, Math.min(this.config.maxSpeed, this.targetSpeed));
    }

    const speedDiff = this.targetSpeed - this.currentSpeed;
    const maxSpeedStep = this.config.speedChangeRate * deltaTime;
    const speedStep = Cesium.Math.clamp(speedDiff, -maxSpeedStep, maxSpeedStep);
    this.currentSpeed += speedStep;

    let rollInput = 0;
    if (input.rollLeft || input.turnLeft) rollInput -= 1;
    if (input.rollRight || input.turnRight) rollInput += 1;

    const targetRoll = rollInput * this.config.maxRoll;
    this.roll = Cesium.Math.lerp(this.roll, targetRoll, 0.15);

    let turnInput = 0;
    if (input.turnLeft || input.rollLeft) turnInput -= 1;
    if (input.turnRight || input.rollRight) turnInput += 1;

    const rollTurnFactor = this.roll / this.config.maxRoll;
    const totalTurnInput = turnInput + rollTurnFactor;

    this.heading = Cesium.Math.zeroToTwoPi(this.heading + totalTurnInput * this.config.turnRate * deltaTime);

    let climbInput = 0;
    if (input.altitudeUp) climbInput += 1;
    if (input.altitudeDown) climbInput -= 1;

    const targetVerticalVelocity = climbInput * this.config.climbRate;
    const vvLerp = 0.1;
    this.verticalVelocity = Cesium.Math.lerp(this.verticalVelocity, targetVerticalVelocity, vvLerp);

    const gravityEffect = -this.config.gravity * deltaTime;
    if (!input.altitudeUp) {
      this.verticalVelocity += gravityEffect;
    }

    const targetPitch = Cesium.Math.toRadians(30) * climbInput;
    this.pitch = Cesium.Math.lerp(this.pitch, targetPitch, 0.08);

    const forwardStep = this.currentSpeed * deltaTime;
    const positionDelta = Cesium.Cartesian3.multiplyByScalar(
      AircraftPhysics.scratchLocalForward,
      forwardStep,
      AircraftPhysics.scratchPositionDelta
    );

    const verticalDelta = this.verticalVelocity * deltaTime;

    return {
      positionDelta,
      verticalDelta,
      heading: this.heading,
      pitch: this.pitch,
      roll: this.roll,
      speed: this.currentSpeed
    };
  }

  public getState(): AircraftState {
    return {
      speed: this.currentSpeed,
      heading: this.heading,
      pitch: this.pitch,
      roll: this.roll,
      verticalVelocity: this.verticalVelocity
    };
  }
}

