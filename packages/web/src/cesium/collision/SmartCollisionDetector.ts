import * as Cesium from 'cesium';
import { HeightFieldCache } from '../terrain/HeightFieldCache';

export interface CollisionResult {
  collision: boolean;
  type?: 'ground' | 'front' | 'back';
  groundHeight?: number;
}

export interface AircraftCollisionConfig {
  // Altitude threshold for frequent checks (meters)
  lowAltitudeThreshold: number;
  // Frames between checks when at low altitude
  lowAltitudeCheckInterval: number;
  // Frames between checks when at high altitude
  highAltitudeCheckInterval: number;
  // Buffer above ground before collision (meters)
  collisionBuffer: number;
  // Distance to probe ahead (meters)
  probeDistance: number;
}

export interface CarCollisionConfig {
  // Frames between collision checks
  checkInterval: number;
  // Minimum velocity to check collision
  minVelocity: number;
  // Distance to probe front/back (meters)
  probeDistance: number;
  // Height difference threshold for collision (meters)
  heightThreshold: number;
  // Bounce distance on collision (meters)
  bounceDistance: number;
}

const DEFAULT_AIRCRAFT_CONFIG: AircraftCollisionConfig = {
  lowAltitudeThreshold: 300,
  lowAltitudeCheckInterval: 6,
  highAltitudeCheckInterval: 30,
  collisionBuffer: 2.0,
  probeDistance: 5.0
};

const DEFAULT_CAR_CONFIG: CarCollisionConfig = {
  checkInterval: 4,
  minVelocity: 0.5,
  probeDistance: 1.5,
  heightThreshold: 1.0,
  bounceDistance: 0.3
};

/**
 * SmartCollisionDetector - Efficient collision detection using height caching
 *
 * Aircraft: Altitude-based throttling (2-15 checks/sec based on altitude)
 * Car: Velocity-based throttling (skip when stationary)
 *
 * Uses HeightFieldCache for fast height lookups most of the time,
 * only doing expensive precise checks when collision is likely.
 */
export class SmartCollisionDetector {
  private heightCache: HeightFieldCache;
  private aircraftConfig: AircraftCollisionConfig;
  private carConfig: CarCollisionConfig;
  private frameCount: number = 0;

  // Scratch variables
  private static readonly scratchCarto = new Cesium.Cartographic();
  private static readonly scratchTransform = new Cesium.Matrix4();
  private static readonly scratchLocalForward = new Cesium.Cartesian3();
  private static readonly scratchWorldForward = new Cesium.Cartesian3();
  private static readonly scratchProbe = new Cesium.Cartesian3();
  private static readonly scratchScaled = new Cesium.Cartesian3();

  constructor(
    scene: Cesium.Scene,
    aircraftConfig: Partial<AircraftCollisionConfig> = {},
    carConfig: Partial<CarCollisionConfig> = {}
  ) {
    this.heightCache = new HeightFieldCache(scene, {
      gridResolutionMeters: 15,
      cacheTTLMs: 2000,
      gridRadius: 3
    });

    this.aircraftConfig = { ...DEFAULT_AIRCRAFT_CONFIG, ...aircraftConfig };
    this.carConfig = { ...DEFAULT_CAR_CONFIG, ...carConfig };
  }

  /**
   * Increment frame counter - call once per frame
   */
  public tick(): void {
    this.frameCount++;
  }

  /**
   * Check aircraft collision with smart altitude-based throttling
   *
   * At high altitude: checks every 30 frames (~2/sec at 60fps)
   * At low altitude: checks every 6 frames (~10/sec at 60fps)
   * Uses cached heights for fast preliminary check, precise check only when close
   */
  public checkAircraftCollision(
    position: Cesium.Cartesian3,
    heading: number,
    exclude?: any[]
  ): CollisionResult {
    const carto = Cesium.Cartographic.fromCartesian(
      position,
      Cesium.Ellipsoid.WGS84,
      SmartCollisionDetector.scratchCarto
    );

    if (!carto) {
      return { collision: false };
    }

    const altitude = carto.height;
    const config = this.aircraftConfig;

    // Determine check interval based on altitude
    const checkInterval = altitude > config.lowAltitudeThreshold
      ? config.highAltitudeCheckInterval
      : config.lowAltitudeCheckInterval;

    // Update background cache when checking
    if (this.frameCount % 45 === 0) {
      this.heightCache.updateGridAround(position, exclude);
    }

    // Not time to check yet
    if (this.frameCount % checkInterval !== 0) {
      return { collision: false };
    }

    // Fast check: use cached height
    const cachedHeight = this.heightCache.getHeight(position, {
      needsPrecision: false,
      exclude
    });

    if (cachedHeight === null) {
      return { collision: false };
    }

    // Quick check - are we close to ground?
    const heightAboveGround = altitude - cachedHeight;

    if (heightAboveGround > config.collisionBuffer * 3) {
      // Clearly above ground, no collision
      return { collision: false, groundHeight: cachedHeight };
    }

    // We're close - do a precise check
    const preciseHeight = this.heightCache.getHeight(position, {
      needsPrecision: true,
      exclude
    });

    if (preciseHeight === null) {
      return { collision: false };
    }

    // Check ground collision
    if (altitude <= preciseHeight + config.collisionBuffer) {
      return {
        collision: true,
        type: 'ground',
        groundHeight: preciseHeight
      };
    }

    // Check forward probe for terrain ahead
    const forwardCollision = this.checkForwardProbe(
      position,
      heading,
      altitude,
      config.probeDistance,
      config.collisionBuffer,
      exclude
    );

    if (forwardCollision) {
      return {
        collision: true,
        type: 'front',
        groundHeight: preciseHeight
      };
    }

    return { collision: false, groundHeight: preciseHeight };
  }

  /**
   * Check car collision with velocity-based throttling
   *
   * Stationary: no checks
   * Moving: checks every 4 frames (~15/sec at 60fps)
   */
  public checkCarCollision(
    position: Cesium.Cartesian3,
    heading: number,
    velocity: number,
    exclude?: any[]
  ): CollisionResult & { bounce?: number } {
    const config = this.carConfig;

    // Skip if barely moving
    if (Math.abs(velocity) < config.minVelocity) {
      return { collision: false };
    }

    // Not time to check yet
    if (this.frameCount % config.checkInterval !== 0) {
      return { collision: false };
    }

    // Update background cache periodically
    if (this.frameCount % 30 === 0) {
      this.heightCache.updateGridAround(position, exclude);
    }

    const carto = Cesium.Cartographic.fromCartesian(
      position,
      Cesium.Ellipsoid.WGS84,
      SmartCollisionDetector.scratchCarto
    );

    if (!carto) {
      return { collision: false };
    }

    const vehicleHeight = carto.height;

    // Build transform for forward direction
    Cesium.Transforms.eastNorthUpToFixedFrame(
      position,
      Cesium.Ellipsoid.WGS84,
      SmartCollisionDetector.scratchTransform
    );

    SmartCollisionDetector.scratchLocalForward.x = Math.cos(heading);
    SmartCollisionDetector.scratchLocalForward.y = -Math.sin(heading);
    SmartCollisionDetector.scratchLocalForward.z = 0;

    const worldForward = Cesium.Matrix4.multiplyByPointAsVector(
      SmartCollisionDetector.scratchTransform,
      SmartCollisionDetector.scratchLocalForward,
      SmartCollisionDetector.scratchWorldForward
    );
    Cesium.Cartesian3.normalize(worldForward, worldForward);

    // Check front probe
    Cesium.Cartesian3.multiplyByScalar(
      worldForward,
      config.probeDistance,
      SmartCollisionDetector.scratchScaled
    );
    const frontProbe = Cesium.Cartesian3.add(
      position,
      SmartCollisionDetector.scratchScaled,
      SmartCollisionDetector.scratchProbe
    );

    const frontHeight = this.heightCache.getHeight(frontProbe, {
      needsPrecision: true,
      exclude
    });

    if (frontHeight !== null && frontHeight > vehicleHeight + config.heightThreshold) {
      return {
        collision: true,
        type: 'front',
        bounce: -config.bounceDistance
      };
    }

    // Check back probe
    Cesium.Cartesian3.multiplyByScalar(
      worldForward,
      -config.probeDistance,
      SmartCollisionDetector.scratchScaled
    );
    const backProbe = Cesium.Cartesian3.add(
      position,
      SmartCollisionDetector.scratchScaled,
      SmartCollisionDetector.scratchProbe
    );

    const backHeight = this.heightCache.getHeight(backProbe, {
      needsPrecision: true,
      exclude
    });

    if (backHeight !== null && backHeight > vehicleHeight + config.heightThreshold) {
      return {
        collision: true,
        type: 'back',
        bounce: config.bounceDistance
      };
    }

    return { collision: false };
  }

  private checkForwardProbe(
    position: Cesium.Cartesian3,
    heading: number,
    currentAltitude: number,
    probeDistance: number,
    buffer: number,
    exclude?: any[]
  ): boolean {
    Cesium.Transforms.eastNorthUpToFixedFrame(
      position,
      Cesium.Ellipsoid.WGS84,
      SmartCollisionDetector.scratchTransform
    );

    SmartCollisionDetector.scratchLocalForward.x = Math.cos(heading);
    SmartCollisionDetector.scratchLocalForward.y = -Math.sin(heading);
    SmartCollisionDetector.scratchLocalForward.z = 0;

    const worldForward = Cesium.Matrix4.multiplyByPointAsVector(
      SmartCollisionDetector.scratchTransform,
      SmartCollisionDetector.scratchLocalForward,
      SmartCollisionDetector.scratchWorldForward
    );
    Cesium.Cartesian3.normalize(worldForward, worldForward);

    Cesium.Cartesian3.multiplyByScalar(
      worldForward,
      probeDistance,
      SmartCollisionDetector.scratchScaled
    );

    const probe = Cesium.Cartesian3.add(
      position,
      SmartCollisionDetector.scratchScaled,
      SmartCollisionDetector.scratchProbe
    );

    const aheadHeight = this.heightCache.getHeight(probe, {
      needsPrecision: true,
      exclude
    });

    if (aheadHeight !== null && aheadHeight > currentAltitude + buffer) {
      return true;
    }

    return false;
  }

  /**
   * Reset the cache (e.g., when teleporting)
   */
  public reset(): void {
    this.heightCache.clear();
    this.frameCount = 0;
  }

  /**
   * Get debug stats
   */
  public getStats(): { cached: number; pending: number; frame: number } {
    return {
      ...this.heightCache.getStats(),
      frame: this.frameCount
    };
  }
}
