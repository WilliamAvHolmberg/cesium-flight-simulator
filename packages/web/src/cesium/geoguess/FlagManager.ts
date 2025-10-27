import * as Cesium from 'cesium';
import type { Position } from './types';

export class FlagManager {
  private flags: Map<string, Cesium.Entity> = new Map();
  private viewer: Cesium.Viewer;

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  addFlag(id: string, position: Position, color: Cesium.Color, label?: string): void {
    this.removeFlag(id);

    const cartesian = Cesium.Cartesian3.fromDegrees(
      position.longitude,
      position.latitude,
      position.height
    );

    const entity = this.viewer.entities.add({
      id: `flag_${id}`,
      position: cartesian,
      cylinder: {
        length: 10,
        topRadius: 0.5,
        bottomRadius: 0.5,
        material: color,
      },
      point: {
        pixelSize: 15,
        color: color,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
      },
      label: label ? {
        text: label,
        font: '14pt sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -20),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      } : undefined,
    });

    this.flags.set(id, entity);
  }

  removeFlag(id: string): void {
    const flag = this.flags.get(id);
    if (flag) {
      this.viewer.entities.remove(flag);
      this.flags.delete(id);
    }
  }

  removeAllFlags(): void {
    this.flags.forEach((flag) => {
      this.viewer.entities.remove(flag);
    });
    this.flags.clear();
  }

  updateFlagPosition(id: string, position: Position): void {
    const flag = this.flags.get(id);
    if (flag) {
      const cartesian = Cesium.Cartesian3.fromDegrees(
        position.longitude,
        position.latitude,
        position.height
      );
      flag.position = new Cesium.ConstantPositionProperty(cartesian);
    }
  }

  hasFlag(id: string): boolean {
    return this.flags.has(id);
  }

  getFlagPosition(id: string): Position | null {
    const flag = this.flags.get(id);
    if (!flag || !flag.position) return null;

    const cartesian = flag.position.getValue(Cesium.JulianDate.now());
    if (!cartesian) return null;

    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    
    return {
      latitude: Cesium.Math.toDegrees(cartographic.latitude),
      longitude: Cesium.Math.toDegrees(cartographic.longitude),
      height: cartographic.height,
    };
  }
}
