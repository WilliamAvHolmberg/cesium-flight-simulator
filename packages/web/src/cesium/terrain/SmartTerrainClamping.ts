import * as Cesium from 'cesium';
import { HeightFieldCache } from './HeightFieldCache';

/**
 * SmartTerrainClamping - Performant ground snapping using cached heights
 *
 * Instead of calling clampToHeight every frame (60 expensive ops/sec),
 * this uses cached + interpolated heights most frames, only doing
 * expensive checks periodically.
 *
 * Result: ~4 expensive ops/sec + 56 cheap interpolations
 */
export class SmartTerrainClamping {
  private heightCache: HeightFieldCache;
  private lastKnownHeight: number = 0;
  private hasInitialHeight: boolean = false;
  private frameCount: number = 0;
  private groundOffset: number;

  // How often to do a precise check (every N frames)
  private readonly PRECISE_CHECK_INTERVAL = 15;
  // How often to refresh the background grid (every N frames)
  private readonly GRID_UPDATE_INTERVAL = 30;

  // Smoothing factor for height transitions (prevents popping)
  private readonly HEIGHT_LERP_FACTOR = 0.3;

  // Scratch variables - no allocations in hot path
  private static readonly scratchCarto = new Cesium.Cartographic();
  private static readonly scratchResult = new Cesium.Cartesian3();

  constructor(scene: Cesium.Scene, groundOffset: number = 0) {
    this.groundOffset = groundOffset;
    this.heightCache = new HeightFieldCache(scene, {
      gridResolutionMeters: 8, // Slightly finer grid for car
      cacheTTLMs: 2000,
      gridRadius: 4 // 9x9 grid
    });
  }

  /**
   * Clamp position to ground - smart version
   *
   * Most frames: Uses cached/interpolated height (very fast)
   * Every 15 frames: Does one precise clampToHeight check
   * Every 30 frames: Refreshes background height grid
   */
  public clampToGround(
    position: Cesium.Cartesian3,
    _scene: Cesium.Scene,
    exclude?: any[]
  ): Cesium.Cartesian3 {
    this.frameCount++;

    // Update background cache periodically
    if (this.frameCount % this.GRID_UPDATE_INTERVAL === 0) {
      this.heightCache.updateGridAround(position, exclude);
    }

    let groundHeight: number;

    // Every N frames, do a precise check
    const doPreciseCheck = !this.hasInitialHeight ||
      this.frameCount % this.PRECISE_CHECK_INTERVAL === 0;

    if (doPreciseCheck) {
      const preciseHeight = this.heightCache.getHeight(position, {
        needsPrecision: true,
        exclude
      });

      if (preciseHeight !== null) {
        groundHeight = preciseHeight;
        this.lastKnownHeight = preciseHeight;
        this.hasInitialHeight = true;
      } else {
        groundHeight = this.lastKnownHeight;
      }
    } else {
      // Fast path: use cached/interpolated height
      const cachedHeight = this.heightCache.getHeight(position, {
        needsPrecision: false,
        exclude
      });

      if (cachedHeight !== null) {
        // Smooth transition to avoid popping
        groundHeight = Cesium.Math.lerp(
          this.lastKnownHeight,
          cachedHeight,
          this.HEIGHT_LERP_FACTOR
        );
        this.lastKnownHeight = groundHeight;
      } else {
        // No cached data, use last known
        groundHeight = this.lastKnownHeight;
      }
    }

    // Apply height to position without allocating new Cartographic
    const carto = Cesium.Cartographic.fromCartesian(
      position,
      Cesium.Ellipsoid.WGS84,
      SmartTerrainClamping.scratchCarto
    );

    if (!carto) {
      return position;
    }

    carto.height = groundHeight + this.groundOffset;

    return Cesium.Cartographic.toCartesian(
      carto,
      Cesium.Ellipsoid.WGS84,
      SmartTerrainClamping.scratchResult
    );
  }

  /**
   * Get the current ground height without clamping position
   */
  public getGroundHeight(
    position: Cesium.Cartesian3,
    precise: boolean = false,
    exclude?: any[]
  ): number | null {
    return this.heightCache.getHeight(position, {
      needsPrecision: precise,
      exclude
    });
  }

  /**
   * Force a precise height check (use sparingly)
   */
  public forcePreciseCheck(
    position: Cesium.Cartesian3,
    exclude?: any[]
  ): number | null {
    const height = this.heightCache.getHeight(position, {
      needsPrecision: true,
      exclude
    });

    if (height !== null) {
      this.lastKnownHeight = height;
      this.hasInitialHeight = true;
    }

    return height;
  }

  public setGroundOffset(offset: number): void {
    this.groundOffset = offset;
  }

  public getGroundOffset(): number {
    return this.groundOffset;
  }

  /**
   * Reset the cache (e.g., when teleporting)
   */
  public reset(): void {
    this.heightCache.clear();
    this.hasInitialHeight = false;
    this.lastKnownHeight = 0;
    this.frameCount = 0;
  }

  /**
   * Get debug stats
   */
  public getStats(): { cached: number; pending: number; lastHeight: number } {
    return {
      ...this.heightCache.getStats(),
      lastHeight: this.lastKnownHeight
    };
  }
}
