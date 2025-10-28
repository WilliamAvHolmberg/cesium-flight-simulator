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
        length: 50, // Taller flag (50m)
        topRadius: 2,
        bottomRadius: 2,
        material: color,
      },
      point: {
        pixelSize: 25, // Bigger point
        color: color,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: label ? {
        text: label,
        font: '24pt bold sans-serif', // Bigger, bold text
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -60),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scale: 1.2,
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
