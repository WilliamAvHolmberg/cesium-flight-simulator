import * as Cesium from 'cesium';
import { GameObject, GameObjectType } from '../objects/GameObject';
import { Waypoint } from '../objects/Waypoint';

export class ObjectManager {
  private objects: Map<string, GameObject> = new Map();
  private viewer: Cesium.Viewer;
  private nextWaypointIndex: number = 1;

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  public placeObject(type: GameObjectType, position: Cesium.Cartesian3): GameObject {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let object: GameObject;
    
    switch (type) {
      case 'waypoint':
        object = new Waypoint({
          id,
          type,
          position,
          properties: { index: this.nextWaypointIndex++ }
        });
        break;
      default:
        throw new Error(`Unknown object type: ${type}`);
    }

    object.initialize(this.viewer);
    this.objects.set(id, object);
    
    console.log(`✨ Placed ${type} at position`, position);
    
    return object;
  }

  public removeObject(id: string): boolean {
    const object = this.objects.get(id);
    if (object) {
      object.destroy();
      this.objects.delete(id);
      console.log(`🗑️ Removed object: ${id}`);
      return true;
    }
    return false;
  }

  public getObject(id: string): GameObject | undefined {
    return this.objects.get(id);
  }

  public getAllObjects(): GameObject[] {
    return Array.from(this.objects.values());
  }

  public clear(): void {
    this.objects.forEach(obj => obj.destroy());
    this.objects.clear();
    this.nextWaypointIndex = 1;
    console.log('🧹 Cleared all objects');
  }

  public getObjectCount(): number {
    return this.objects.size;
  }
}
