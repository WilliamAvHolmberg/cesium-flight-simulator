import * as Cesium from 'cesium';

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
  bounce?: number;
}

export class CarPhysics {
  private velocity: number = 0;
  private acceleration: number = 0;
  private steeringInput: number = 0;
  
  private static readonly scratchTransform = new Cesium.Matrix4();
  private static readonly scratchLocalForward = new Cesium.Cartesian3();
  private static readonly scratchWorldForward = new Cesium.Cartesian3();
  private static readonly scratchScaled1 = new Cesium.Cartesian3();
  private static readonly scratchScaled2 = new Cesium.Cartesian3();
  private static readonly scratchFrontProbe = new Cesium.Cartesian3();
  private static readonly scratchBackProbe = new Cesium.Cartesian3();
  
  constructor(private config: PhysicsConfig) {}

  public update(
    deltaTime: number,
    input: PhysicsInput,
    ctx?: {
      scene: Cesium.Scene;
      position: Cesium.Cartesian3;
      heading: number;
      exclude?: Cesium.Model[];
      enabled?: boolean;
      probeDistance?: number;
      bounceDistance?: number;
      heightThreshold?: number;
    }
  ): PhysicsResult {
    const physicsResult = this.calculatePhysics(deltaTime, input);
    const steeringResult = this.calculateSteering(deltaTime, input);

    let result: PhysicsResult = {
      ...physicsResult,
      ...steeringResult
    };

    if (ctx && ctx.enabled !== false) {
      const hit = this.checkCollision(ctx);
      if (hit) {
        this.velocity = 0;
        this.acceleration = 0;
        const bounceDistance = ctx.bounceDistance ?? 0.3;
        result = {
          ...result,
          velocity: 0,
          speed: 0,
          bounce: hit === 'front' ? -bounceDistance : bounceDistance
        };
      }
    }

    return result;
  }

  private calculatePhysics(deltaTime: number, input: PhysicsInput): Pick<PhysicsResult, 'velocity' | 'acceleration' | 'speed'> {
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
    const rollingForce = this.config.rollingResistance * this.config.vehicleMass * gravityAcceleration;
    if (this.velocity > 0) {
      netForce -= rollingForce;
    } else if (this.velocity < 0) {
      netForce += rollingForce;
    }
    
    const airDragForce = this.config.airDragCoefficient * this.velocity * Math.abs(this.velocity);
    netForce -= airDragForce;
    
    this.acceleration = netForce / this.config.vehicleMass;
    
    this.velocity += this.acceleration * deltaTime;
    this.velocity = Math.max(-this.config.maxSpeed * 0.5, Math.min(this.config.maxSpeed, this.velocity));
    
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

  private calculateSteering(_deltaTime: number, input: PhysicsInput): Pick<PhysicsResult, 'turnRate' | 'frontWheelAngle' | 'steeringReduction'> {
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
      steeringReduction = 1.0 - (speedFactor * 0.8);
      steeringReduction = Math.max(steeringReduction, 0.2);
    }
    
    const frontWheelAngle = this.steeringInput * this.config.maxSteeringAngle * steeringReduction;
    
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

  private checkCollision(ctx: {
    scene: Cesium.Scene;
    position: Cesium.Cartesian3;
    heading: number;
    exclude?: Cesium.Model[];
    probeDistance?: number;
    heightThreshold?: number;
  }): 'front' | 'back' | null {
    const probeDistance = ctx.probeDistance ?? 1.0;
    const heightThreshold = ctx.heightThreshold ?? 1.0;

    Cesium.Transforms.eastNorthUpToFixedFrame(ctx.position, undefined, CarPhysics.scratchTransform);

    CarPhysics.scratchLocalForward.x = Math.cos(ctx.heading);
    CarPhysics.scratchLocalForward.y = -Math.sin(ctx.heading);
    CarPhysics.scratchLocalForward.z = 0;

    const worldForward = Cesium.Matrix4.multiplyByPointAsVector(
      CarPhysics.scratchTransform,
      CarPhysics.scratchLocalForward,
      CarPhysics.scratchWorldForward
    );
    Cesium.Cartesian3.normalize(worldForward, worldForward);

    Cesium.Cartesian3.multiplyByScalar(worldForward, probeDistance, CarPhysics.scratchScaled1);
    const frontProbe = Cesium.Cartesian3.add(
      ctx.position,
      CarPhysics.scratchScaled1,
      CarPhysics.scratchFrontProbe
    );
    
    Cesium.Cartesian3.multiplyByScalar(worldForward, -probeDistance, CarPhysics.scratchScaled2);
    const backProbe = Cesium.Cartesian3.add(
      ctx.position,
      CarPhysics.scratchScaled2,
      CarPhysics.scratchBackProbe
    );

    const objectsToExclude = ctx.exclude ?? [];
    const clampedFront = ctx.scene.clampToHeight(frontProbe, objectsToExclude);
    const clampedBack = ctx.scene.clampToHeight(backProbe, objectsToExclude);

    if (!clampedFront && !clampedBack) return null;

    const vehicleHeight = Cesium.Cartographic.fromCartesian(ctx.position).height;

    if (clampedFront) {
      const frontHeight = Cesium.Cartographic.fromCartesian(clampedFront).height;
      if (frontHeight > vehicleHeight + heightThreshold) {
        return 'front';
      }
    }

    if (clampedBack) {
      const backHeight = Cesium.Cartographic.fromCartesian(clampedBack).height;
      if (backHeight > vehicleHeight + heightThreshold) {
        return 'back';
      }
    }

    return null;
  }
}

