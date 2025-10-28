import * as Cesium from 'cesium';
import type { Position } from './types';

export class LocationTeleporter {
  private viewer: Cesium.Viewer;

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  teleportTo(position: Position, duration: number = 0): void {
    const destination = Cesium.Cartesian3.fromDegrees(
      position.longitude,
      position.latitude,
      position.height + 100
    );

    const orientation = {
      heading: 0,
      pitch: Cesium.Math.toRadians(-20),
      roll: 0,
    };

    if (duration === 0) {
      // Instant teleport
      this.viewer.camera.setView({
        destination: destination,
        orientation: orientation,
      });
    } else {
      // Smooth camera flight
      this.viewer.camera.flyTo({
        destination: destination,
        duration: duration,
        orientation: orientation,
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
      });
    }
  }

  getCurrentPosition(): Position {
    const camera = this.viewer.camera;
    const cartographic = Cesium.Cartographic.fromCartesian(camera.position);

    return {
      latitude: Cesium.Math.toDegrees(cartographic.latitude),
      longitude: Cesium.Math.toDegrees(cartographic.longitude),
      height: cartographic.height,
    };
  }

  getTerrainHeight(latitude: number, longitude: number): Promise<number> {
    const position = Cesium.Cartographic.fromDegrees(longitude, latitude);
    
    return new Promise((resolve) => {
      Cesium.sampleTerrainMostDetailed(
        this.viewer.terrainProvider,
        [position]
      ).then((samples) => {
        resolve(samples[0].height || 0);
      }).catch(() => {
        resolve(0);
      });
    });
  }
}
