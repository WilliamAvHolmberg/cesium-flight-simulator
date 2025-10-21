import * as Cesium from 'cesium';
import { GameObject, GameObjectData } from './GameObject';

export class Waypoint extends GameObject {
  constructor(data: GameObjectData) {
    super(data);
  }

  public createEntity(_viewer: Cesium.Viewer): Cesium.Entity {
    const cartographic = Cesium.Cartographic.fromCartesian(this.position);
    const heightAboveTerrain = 5;
    const elevatedPosition = Cesium.Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      cartographic.height + heightAboveTerrain
    );

    return new Cesium.Entity({
      id: this.id,
      position: elevatedPosition,
      point: {
        pixelSize: 20,
        color: Cesium.Color.CYAN,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: `Waypoint ${this.properties.index || ''}`,
        font: '12px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -15),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }

  protected updateRotation(): void {
    // Waypoints don't rotate
  }
}
