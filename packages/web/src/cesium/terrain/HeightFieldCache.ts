import * as Cesium from 'cesium';

interface GridCell {
  height: number;
  timestamp: number;
}

/**
 * HeightFieldCache - Tiered height sampling with caching
 *
 * Reduces expensive clampToHeight calls by:
 * 1. Caching heights in a grid around the vehicle
 * 2. Interpolating between cached points for most frames
 * 3. Only doing expensive 3D tile raycasts periodically
 */
export class HeightFieldCache {
  private grid: Map<string, GridCell> = new Map();
  private readonly GRID_RESOLUTION: number; // In radians
  private readonly CACHE_TTL: number;
  private readonly GRID_RADIUS: number;

  private pendingSamples: Set<string> = new Set();
  private lastFullUpdate = 0;
  private readonly UPDATE_INTERVAL = 500; // ms between grid refreshes

  // Scratch variables - no allocations in hot paths
  private static readonly scratchCarto = new Cesium.Cartographic();
  private static readonly scratchPosition = new Cesium.Cartesian3();
  private static readonly scratchCarto2 = new Cesium.Cartographic();

  constructor(
    private scene: Cesium.Scene,
    options: {
      gridResolutionMeters?: number;
      cacheTTLMs?: number;
      gridRadius?: number;
    } = {}
  ) {
    // ~10m resolution at equator by default
    const resolutionMeters = options.gridResolutionMeters ?? 10;
    this.GRID_RESOLUTION = resolutionMeters / 6378137; // Convert meters to radians
    this.CACHE_TTL = options.cacheTTLMs ?? 3000;
    this.GRID_RADIUS = options.gridRadius ?? 3; // 7x7 grid
  }

  /**
   * Get height at position using tiered approach:
   * 1. Try cached grid interpolation (fast)
   * 2. Fall back to Globe.getHeight (medium - terrain only)
   * 3. Only use clampToHeight if precision needed (slow)
   */
  public getHeight(
    position: Cesium.Cartesian3,
    options: {
      needsPrecision?: boolean;
      exclude?: any[];
    } = {}
  ): number | null {
    const carto = Cesium.Cartographic.fromCartesian(
      position,
      Cesium.Ellipsoid.WGS84,
      HeightFieldCache.scratchCarto
    );

    if (!carto) return null;

    // Try cached interpolation first (fast)
    if (!options.needsPrecision) {
      const cached = this.interpolateFromGrid(carto.longitude, carto.latitude);
      if (cached !== null) {
        return cached;
      }
    }

    // Try Globe.getHeight (sync, terrain only, medium speed)
    const globe = this.scene.globe;
    if (globe) {
      const globeHeight = globe.getHeight(carto);
      if (globeHeight !== undefined) {
        return globeHeight;
      }
    }

    // Last resort: expensive clampToHeight
    if (options.needsPrecision) {
      const clamped = this.scene.clampToHeight(position, options.exclude);
      if (clamped) {
        const clampedCarto = Cesium.Cartographic.fromCartesian(
          clamped,
          Cesium.Ellipsoid.WGS84,
          HeightFieldCache.scratchCarto2
        );
        if (clampedCarto) {
          // Cache this expensive result
          this.setCachedHeight(carto.longitude, carto.latitude, clampedCarto.height);
          return clampedCarto.height;
        }
      }
    }

    return null;
  }

  /**
   * Get height synchronously from cache only - never does expensive ops
   * Returns null if not cached
   */
  public getCachedHeight(longitude: number, latitude: number): number | null {
    return this.interpolateFromGrid(longitude, latitude);
  }

  /**
   * Update the height grid around a position
   * Call this periodically (every 500ms or so), NOT every frame
   * Uses requestAnimationFrame to spread work across frames
   */
  public updateGridAround(
    position: Cesium.Cartesian3,
    exclude?: any[]
  ): void {
    const now = performance.now();
    if (now - this.lastFullUpdate < this.UPDATE_INTERVAL) {
      return;
    }
    this.lastFullUpdate = now;

    const carto = Cesium.Cartographic.fromCartesian(
      position,
      Cesium.Ellipsoid.WGS84,
      HeightFieldCache.scratchCarto
    );
    if (!carto) return;

    // Sample grid points - spread across frames
    const points: { lon: number; lat: number; key: string }[] = [];

    for (let dx = -this.GRID_RADIUS; dx <= this.GRID_RADIUS; dx++) {
      for (let dy = -this.GRID_RADIUS; dy <= this.GRID_RADIUS; dy++) {
        const lon = carto.longitude + dx * this.GRID_RESOLUTION;
        const lat = carto.latitude + dy * this.GRID_RESOLUTION;
        const key = this.getGridKey(lon, lat);

        // Skip if still valid or already pending
        const existing = this.grid.get(key);
        if (existing && now - existing.timestamp < this.CACHE_TTL) {
          continue;
        }
        if (this.pendingSamples.has(key)) {
          continue;
        }

        points.push({ lon, lat, key });
      }
    }

    // Sample a few points per frame to avoid blocking
    const SAMPLES_PER_FRAME = 3;
    let index = 0;

    const sampleBatch = () => {
      const endIndex = Math.min(index + SAMPLES_PER_FRAME, points.length);

      for (let i = index; i < endIndex; i++) {
        const point = points[i];
        this.samplePoint(point.lon, point.lat, point.key, exclude);
      }

      index = endIndex;
      if (index < points.length) {
        requestAnimationFrame(sampleBatch);
      }
    };

    if (points.length > 0) {
      requestAnimationFrame(sampleBatch);
    }
  }

  private samplePoint(
    lon: number,
    lat: number,
    key: string,
    exclude?: any[]
  ): void {
    this.pendingSamples.add(key);

    // Create position at high altitude for raycast
    const position = Cesium.Cartesian3.fromRadians(
      lon,
      lat,
      10000, // Sample from 10km up
      Cesium.Ellipsoid.WGS84,
      HeightFieldCache.scratchPosition
    );

    const clamped = this.scene.clampToHeight(position, exclude);

    if (clamped) {
      const clampedCarto = Cesium.Cartographic.fromCartesian(
        clamped,
        Cesium.Ellipsoid.WGS84,
        HeightFieldCache.scratchCarto2
      );
      if (clampedCarto) {
        this.grid.set(key, {
          height: clampedCarto.height,
          timestamp: performance.now()
        });
      }
    }

    this.pendingSamples.delete(key);
  }

  private setCachedHeight(lon: number, lat: number, height: number): void {
    const key = this.getGridKey(lon, lat);
    this.grid.set(key, {
      height,
      timestamp: performance.now()
    });
  }

  private interpolateFromGrid(lon: number, lat: number): number | null {
    const now = performance.now();

    // Find the 4 surrounding grid points
    const baseLon = Math.floor(lon / this.GRID_RESOLUTION) * this.GRID_RESOLUTION;
    const baseLat = Math.floor(lat / this.GRID_RESOLUTION) * this.GRID_RESOLUTION;

    const p00 = this.grid.get(this.getGridKey(baseLon, baseLat));
    const p10 = this.grid.get(this.getGridKey(baseLon + this.GRID_RESOLUTION, baseLat));
    const p01 = this.grid.get(this.getGridKey(baseLon, baseLat + this.GRID_RESOLUTION));
    const p11 = this.grid.get(this.getGridKey(baseLon + this.GRID_RESOLUTION, baseLat + this.GRID_RESOLUTION));

    // Check validity and count valid points
    const validPoints: GridCell[] = [];
    const checkValid = (p: GridCell | undefined) => {
      if (p && now - p.timestamp < this.CACHE_TTL) {
        validPoints.push(p);
        return p;
      }
      return null;
    };

    const v00 = checkValid(p00);
    const v10 = checkValid(p10);
    const v01 = checkValid(p01);
    const v11 = checkValid(p11);

    // Need at least 1 point for nearest-neighbor, 3 for decent interpolation
    if (validPoints.length === 0) {
      return null;
    }

    // If only 1-2 points, use nearest neighbor
    if (validPoints.length < 3) {
      return validPoints[0].height;
    }

    // Bilinear interpolation
    const tx = (lon - baseLon) / this.GRID_RESOLUTION;
    const ty = (lat - baseLat) / this.GRID_RESOLUTION;

    // Use available points, falling back to neighbors
    const h00 = v00?.height ?? v10?.height ?? v01?.height ?? v11!.height;
    const h10 = v10?.height ?? v00?.height ?? v11?.height ?? v01!.height;
    const h01 = v01?.height ?? v00?.height ?? v11?.height ?? v10!.height;
    const h11 = v11?.height ?? v10?.height ?? v01?.height ?? v00!.height;

    const h0 = h00 * (1 - tx) + h10 * tx;
    const h1 = h01 * (1 - tx) + h11 * tx;

    return h0 * (1 - ty) + h1 * ty;
  }

  private getGridKey(lon: number, lat: number): string {
    const lonKey = Math.round(lon / this.GRID_RESOLUTION);
    const latKey = Math.round(lat / this.GRID_RESOLUTION);
    return `${lonKey},${latKey}`;
  }

  /**
   * Clear all cached data
   */
  public clear(): void {
    this.grid.clear();
    this.pendingSamples.clear();
  }

  /**
   * Get cache stats for debugging
   */
  public getStats(): { cached: number; pending: number } {
    return {
      cached: this.grid.size,
      pending: this.pendingSamples.size
    };
  }
}
