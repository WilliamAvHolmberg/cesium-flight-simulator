import * as Cesium from 'cesium';

export type GameObjectType = 'waypoint' | 'ring' | 'collectible' | 'start' | 'finish';

export interface GameObjectData {
  id: string;
  type: GameObjectType;
  position: Cesium.Cartesian3;
  rotation?: {
    heading: number;
    pitch: number;
    roll: number;
  };
  properties?: Record<string, any>;
}

export abstract class GameObject {
  public id: string;
  public type: GameObjectType;
  public position: Cesium.Cartesian3;
  public rotation: { heading: number; pitch: number; roll: number };
  public properties: Record<string, any>;
  
  protected entity: Cesium.Entity | null = null;
  protected viewer: Cesium.Viewer | null = null;

  constructor(data: GameObjectData) {
    this.id = data.id;
    this.type = data.type;
    this.position = data.position;
    this.rotation = data.rotation || { heading: 0, pitch: 0, roll: 0 };
    this.properties = data.properties || {};
  }

  public abstract createEntity(viewer: Cesium.Viewer): Cesium.Entity;

  public initialize(viewer: Cesium.Viewer): void {
    this.viewer = viewer;
    this.entity = this.createEntity(viewer);
    viewer.entities.add(this.entity);
  }

  public setPosition(position: Cesium.Cartesian3): void {
    this.position = position;
    if (this.entity) {
      this.entity.position = new Cesium.ConstantPositionProperty(position);
    }
  }

  public setRotation(heading: number, pitch: number, roll: number): void {
    this.rotation = { heading, pitch, roll };
    this.updateRotation();
  }

  protected abstract updateRotation(): void;

  public destroy(): void {
    if (this.entity && this.viewer) {
      this.viewer.entities.remove(this.entity);
      this.entity = null;
    }
  }

  public toJSON(): GameObjectData {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      rotation: this.rotation,
      properties: this.properties,
    };
  }
}
