import * as Cesium from 'cesium';

export class TerrainClamping {
  private groundOffset: number;
  
  constructor(groundOffset: number = 0.0) {
    this.groundOffset = groundOffset;
  }

  public clampToGround(
    position: Cesium.Cartesian3, 
    scene: Cesium.Scene, 
    objectsToExclude?: any[]
  ): Cesium.Cartesian3 {
    try {
      const directClamp = scene.clampToHeight(position, objectsToExclude);
      
      if (directClamp) {
        const groundCartographic = Cesium.Cartographic.fromCartesian(directClamp);
        const currentCartographic = Cesium.Cartographic.fromCartesian(position);

        const adjustedCartographic = new Cesium.Cartographic(
          currentCartographic.longitude,
          currentCartographic.latitude,
          groundCartographic.height + this.groundOffset
        );
        
        return Cesium.Cartographic.toCartesian(adjustedCartographic);
      }
    } catch (error) {
      console.log('Terrain clamping failed:', error);
    }

    return position;
  }

  public setGroundOffset(offset: number): void {
    this.groundOffset = offset;
  }

  public getGroundOffset(): number {
    return this.groundOffset;
  }
}



