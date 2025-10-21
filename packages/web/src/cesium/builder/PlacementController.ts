import * as Cesium from 'cesium';
import { ObjectManager } from './ObjectManager';
import { GameObjectType } from '../objects/GameObject';

export class PlacementController {
  private viewer: Cesium.Viewer;
  private objectManager: ObjectManager;
  private isEnabled: boolean = false;
  private currentObjectType: GameObjectType = 'waypoint';
  
  private cursorEntity: Cesium.Entity | null = null;
  private handler: Cesium.ScreenSpaceEventHandler | null = null;
  private lastMousePosition: Cesium.Cartesian2 | null = null;

  constructor(viewer: Cesium.Viewer, objectManager: ObjectManager) {
    this.viewer = viewer;
    this.objectManager = objectManager;
  }

  public enable(): void {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    this.createCursor();
    this.setupEventHandlers();
    
    console.log('🎯 Placement mode enabled - click to place objects');
  }

  public disable(): void {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    this.lastMousePosition = null;
    this.removeCursor();
    this.removeEventHandlers();
    
    console.log('🎯 Placement mode disabled');
  }

  public setObjectType(type: GameObjectType): void {
    this.currentObjectType = type;
    console.log(`📦 Selected object type: ${type}`);
  }

  public getObjectType(): GameObjectType {
    return this.currentObjectType;
  }

  private createCursor(): void {
    this.cursorEntity = this.viewer.entities.add({
      position: new Cesium.CallbackPositionProperty(() => {
        return this.getCursorPosition();
      }, false),
      point: {
        pixelSize: 15,
        color: Cesium.Color.YELLOW.withAlpha(0.8),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }

  private removeCursor(): void {
    if (this.cursorEntity) {
      this.viewer.entities.remove(this.cursorEntity);
      this.cursorEntity = null;
    }
  }

  private setupEventHandlers(): void {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

    // Track mouse movement
    this.handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      this.lastMousePosition = movement.endPosition;
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Left click to place object
    this.handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const position = this.pickPosition(click.position);
      if (position) {
        this.objectManager.placeObject(this.currentObjectType, position);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  private removeEventHandlers(): void {
    if (this.handler) {
      this.handler.destroy();
      this.handler = null;
    }
  }

  private pickPosition(screenPosition: Cesium.Cartesian2): Cesium.Cartesian3 | null {
    // Try to pick terrain/tileset first
    const pickedObject = this.viewer.scene.pick(screenPosition);
    
    if (Cesium.defined(pickedObject)) {
      // Pick exact position on 3D tiles or terrain
      const cartesian = this.viewer.scene.pickPosition(screenPosition);
      if (Cesium.defined(cartesian)) {
        return cartesian;
      }
    }

    // Fallback: pick position on globe ellipsoid
    const ray = this.viewer.camera.getPickRay(screenPosition);
    if (ray) {
      const position = this.viewer.scene.globe.pick(ray, this.viewer.scene);
      if (position) {
        return position;
      }
    }

    return null;
  }

  private getCursorPosition(): Cesium.Cartesian3 | undefined {
    if (!this.lastMousePosition) return undefined;

    const position = this.pickPosition(this.lastMousePosition);
    return position || undefined;
  }

  public isActive(): boolean {
    return this.isEnabled;
  }
}
