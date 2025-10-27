import * as Cesium from 'cesium';
import type { Position } from './types';

export function calculateDistance(pos1: Position, pos2: Position): number {
  const point1 = Cesium.Cartographic.fromDegrees(pos1.longitude, pos1.latitude);
  const point2 = Cesium.Cartographic.fromDegrees(pos2.longitude, pos2.latitude);

  const geodesic = new Cesium.EllipsoidGeodesic(point1, point2);
  return geodesic.surfaceDistance;
}

export function calculatePoints(distanceInMeters: number): number {
  if (distanceInMeters <= 100) {
    return 1000;
  }
  
  const maxDistance = 20000000;
  const clampedDistance = Math.min(distanceInMeters, maxDistance);
  
  const ratio = clampedDistance / maxDistance;
  const points = Math.round(1000 * (1 - ratio));
  
  return Math.max(0, points);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(2)}km`;
  }
}
