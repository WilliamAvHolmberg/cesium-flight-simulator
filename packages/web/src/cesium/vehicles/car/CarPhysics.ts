export interface PhysicsConfig {
  vehicleMass: number;
  engineForce: number;
  brakeForce: number;
  rollingResistance: number;
  airDragCoefficient: number;
  maxSpeed: number;
  wheelbase?: number;
  maxSteeringAngle?: number;
}

export interface PhysicsInput {
  throttle: boolean;
  brake: boolean;
  turnLeft: boolean;
  turnRight: boolean;
}

export interface PhysicsResult {
  velocity: number;
  acceleration: number;
  speed: number;
  turnRate: number;
  frontWheelAngle: number;
  steeringReduction: number;
}

/**
 * CarPhysics - Pure physics simulation for car movement
 *
 * Collision detection is now handled separately by SmartCollisionDetector
 * for better performance (velocity-based throttling, cached heights).
 */
export class CarPhysics {
  private velocity: number = 0;
  private acceleration: number = 0;
  private steeringInput: number = 0;

  constructor(private config: PhysicsConfig) {}

  /**
   * Update physics simulation
   * Returns velocity, acceleration, speed, and steering info
   */
  public update(deltaTime: number, input: PhysicsInput): PhysicsResult {
    const physicsResult = this.calculatePhysics(deltaTime, input);
    const steeringResult = this.calculateSteering(deltaTime, input);

    return {
      ...physicsResult,
      ...steeringResult
    };
  }

  private calculatePhysics(
    deltaTime: number,
    input: PhysicsInput
  ): Pick<PhysicsResult, 'velocity' | 'acceleration' | 'speed'> {
    let netForce = 0;

    if (input.throttle) {
      netForce += this.config.engineForce;
    }

    if (input.brake) {
      if (this.velocity > 0.5) {
        netForce -= this.config.brakeForce;
      } else {
        netForce -= this.config.engineForce * 0.6;
      }
    }

    const gravityAcceleration = 9.81;
    const rollingForce =
      this.config.rollingResistance * this.config.vehicleMass * gravityAcceleration;
    if (this.velocity > 0) {
      netForce -= rollingForce;
    } else if (this.velocity < 0) {
      netForce += rollingForce;
    }

    const airDragForce =
      this.config.airDragCoefficient * this.velocity * Math.abs(this.velocity);
    netForce -= airDragForce;

    this.acceleration = netForce / this.config.vehicleMass;

    this.velocity += this.acceleration * deltaTime;
    this.velocity = Math.max(
      -this.config.maxSpeed * 0.5,
      Math.min(this.config.maxSpeed, this.velocity)
    );

    if (!input.throttle && !input.brake && Math.abs(this.velocity) > 0.1) {
      const naturalDeceleration = 8.0;
      if (this.velocity > 0) {
        this.velocity = Math.max(0, this.velocity - naturalDeceleration * deltaTime);
      } else {
        this.velocity = Math.min(0, this.velocity + naturalDeceleration * deltaTime);
      }
    }

    const speed = Math.abs(this.velocity);

    return {
      velocity: this.velocity,
      acceleration: this.acceleration,
      speed: speed
    };
  }

  private calculateSteering(
    _deltaTime: number,
    input: PhysicsInput
  ): Pick<PhysicsResult, 'turnRate' | 'frontWheelAngle' | 'steeringReduction'> {
    if (!this.config.wheelbase || !this.config.maxSteeringAngle) {
      return { turnRate: 0, frontWheelAngle: 0, steeringReduction: 1 };
    }

    let targetSteeringInput = 0;
    if (input.turnLeft) targetSteeringInput = -1;
    if (input.turnRight) targetSteeringInput = 1;

    const steeringLerpRate = Math.abs(this.velocity) < 5 ? 0.05 : 0.1;
    this.steeringInput += (targetSteeringInput - this.steeringInput) * steeringLerpRate;

    const speedKmh = Math.abs(this.velocity);
    let steeringReduction = 1.0;

    if (speedKmh > 30) {
      const speedFactor = (speedKmh - 30) / 70;
      steeringReduction = 1.0 - speedFactor * 0.8;
      steeringReduction = Math.max(steeringReduction, 0.2);
    }

    const frontWheelAngle =
      this.steeringInput * this.config.maxSteeringAngle * steeringReduction;

    let turnRate = 0;
    if (Math.abs(frontWheelAngle) > 0.001 && Math.abs(this.velocity) > 0.1) {
      const turningRadius = this.config.wheelbase / Math.tan(Math.abs(frontWheelAngle));
      turnRate = (this.velocity / turningRadius) * Math.sign(frontWheelAngle);
    }

    return {
      turnRate,
      frontWheelAngle,
      steeringReduction
    };
  }

  public getVelocity(): number {
    return this.velocity;
  }

  public reset(): void {
    this.velocity = 0;
    this.acceleration = 0;
    this.steeringInput = 0;
  }
}
