import * as Cesium from 'cesium';
import { ObjectManager } from './ObjectManager';
import { GameObjectType } from '../objects/GameObject';
import { BuilderCursor } from './BuilderCursor';

export class PlacementController {
  private viewer: Cesium.Viewer;
  private objectManager: ObjectManager;
  private isEnabled: boolean = false;
  private currentObjectType: GameObjectType = 'waypoint';
  
  private builderCursor: BuilderCursor | null = null;
  private handler: Cesium.ScreenSpaceEventHandler | null = null;

  constructor(viewer: Cesium.Viewer, objectManager: ObjectManager) {
    this.viewer = viewer;
    this.objectManager = objectManager;
  }

  public enable(startPosition: Cesium.Cartesian3): void {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    this.builderCursor = new BuilderCursor(this.viewer, startPosition);
    this.setupEventHandlers();
    
    console.log('🎯 Placement mode enabled - WASD to move, Space to place');
  }

  public disable(): void {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    
    if (this.builderCursor) {
      this.builderCursor.destroy();
      this.builderCursor = null;
    }
    
    this.removeEventHandlers();
    
    console.log('🎯 Placement mode disabled');
  }

  public setObjectType(type: GameObjectType): void {
    this.currentObjectType = type;
    if (this.builderCursor) {
      this.builderCursor.updateGhostPreview(this.capitalizeObjectType(type));
    }
    console.log(`📦 Selected object type: ${type}`);
  }

  public getObjectType(): GameObjectType {
    return this.currentObjectType;
  }

  private capitalizeObjectType(type: GameObjectType): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  private setupEventHandlers(): void {
    // Space bar to place object (handled externally via InputManager)
    // We'll expose a method for this
  }

  private removeEventHandlers(): void {
    if (this.handler) {
      this.handler.destroy();
      this.handler = null;
    }
  }

  public placeObjectAtCursor(): void {
    if (!this.builderCursor) return;
    
    const position = this.builderCursor.getPosition();
    this.objectManager.placeObject(this.currentObjectType, position);
  }

  public update(deltaTime: number): void {
    if (this.builderCursor) {
      this.builderCursor.update(deltaTime);
    }
  }

  public setMoveInput(input: { forward?: boolean; backward?: boolean; left?: boolean; right?: boolean; up?: boolean; down?: boolean; fast?: boolean }): void {
    if (this.builderCursor) {
      this.builderCursor.setMoveInput(input);
    }
  }

  public isActive(): boolean {
    return this.isEnabled;
  }
}
