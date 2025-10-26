import * as Cesium from 'cesium';

export class BuilderCursor {
  private viewer: Cesium.Viewer;
  private position: Cesium.Cartesian3;
  private cursorEntity: Cesium.Entity | null = null;
  private ghostEntity: Cesium.Entity | null = null;
  
  private moveSpeed: number = 20;
  private fastMoveSpeed: number = 80;
  
  private moveInput = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    fast: false
  };

  constructor(viewer: Cesium.Viewer, startPosition: Cesium.Cartesian3) {
    this.viewer = viewer;
    this.position = startPosition.clone();
    this.createCursorEntity();
    this.createGhostPreview();
  }

  private createCursorEntity(): void {
    this.cursorEntity = this.viewer.entities.add({
      position: new Cesium.CallbackPositionProperty(() => this.position, false),
      point: {
        pixelSize: 12,
        color: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: '⊕ Spawn Point',
        font: '11px sans-serif',
        fillColor: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -20),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }

  private createGhostPreview(): void {
    const cartographic = Cesium.Cartographic.fromCartesian(this.position);
    const previewPosition = Cesium.Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      cartographic.height + 5
    );

    this.ghostEntity = this.viewer.entities.add({
      position: new Cesium.CallbackPositionProperty(() => {
        const cart = Cesium.Cartographic.fromCartesian(this.position);
        return Cesium.Cartesian3.fromRadians(
          cart.longitude,
          cart.latitude,
          cart.height + 5
        );
      }, false),
      point: {
        pixelSize: 20,
        color: Cesium.Color.CYAN.withAlpha(0.5),
        outlineColor: Cesium.Color.WHITE.withAlpha(0.5),
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: 'Preview',
        font: '10px sans-serif',
        fillColor: Cesium.Color.WHITE.withAlpha(0.7),
        outlineColor: Cesium.Color.BLACK.withAlpha(0.7),
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -15),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }

  public update(deltaTime: number): void {
    const speed = this.moveInput.fast ? this.fastMoveSpeed : this.moveSpeed;
    const moveDistance = speed * deltaTime;

    if (!this.hasAnyInput()) return;

    const cameraHeading = this.viewer.camera.heading;
    const cameraPitch = this.viewer.camera.pitch;

    const transform = Cesium.Transforms.eastNorthUpToFixedFrame(this.position);
    
    const localForward = new Cesium.Cartesian3(
      -Math.sin(cameraHeading) * Math.cos(cameraPitch),
      Math.cos(cameraHeading) * Math.cos(cameraPitch),
      0
    );
    
    const localRight = new Cesium.Cartesian3(
      Math.cos(cameraHeading),
      Math.sin(cameraHeading),
      0
    );
    
    const localUp = new Cesium.Cartesian3(0, 0, 1);

    const worldForward = Cesium.Matrix4.multiplyByPointAsVector(transform, localForward, new Cesium.Cartesian3());
    const worldRight = Cesium.Matrix4.multiplyByPointAsVector(transform, localRight, new Cesium.Cartesian3());
    const worldUp = Cesium.Matrix4.multiplyByPointAsVector(transform, localUp, new Cesium.Cartesian3());
    
    Cesium.Cartesian3.normalize(worldForward, worldForward);
    Cesium.Cartesian3.normalize(worldRight, worldRight);
    Cesium.Cartesian3.normalize(worldUp, worldUp);

    if (this.moveInput.forward) {
      const delta = Cesium.Cartesian3.multiplyByScalar(worldForward, moveDistance, new Cesium.Cartesian3());
      Cesium.Cartesian3.add(this.position, delta, this.position);
    }
    if (this.moveInput.backward) {
      const delta = Cesium.Cartesian3.multiplyByScalar(worldForward, -moveDistance, new Cesium.Cartesian3());
      Cesium.Cartesian3.add(this.position, delta, this.position);
    }
    if (this.moveInput.right) {
      const delta = Cesium.Cartesian3.multiplyByScalar(worldRight, moveDistance, new Cesium.Cartesian3());
      Cesium.Cartesian3.add(this.position, delta, this.position);
    }
    if (this.moveInput.left) {
      const delta = Cesium.Cartesian3.multiplyByScalar(worldRight, -moveDistance, new Cesium.Cartesian3());
      Cesium.Cartesian3.add(this.position, delta, this.position);
    }
    if (this.moveInput.up) {
      const delta = Cesium.Cartesian3.multiplyByScalar(worldUp, moveDistance, new Cesium.Cartesian3());
      Cesium.Cartesian3.add(this.position, delta, this.position);
    }
    if (this.moveInput.down) {
      const delta = Cesium.Cartesian3.multiplyByScalar(worldUp, -moveDistance, new Cesium.Cartesian3());
      Cesium.Cartesian3.add(this.position, delta, this.position);
    }
  }

  private hasAnyInput(): boolean {
    return Object.values(this.moveInput).some(value => value === true);
  }

  public setMoveInput(input: Partial<typeof this.moveInput>): void {
    Object.assign(this.moveInput, input);
  }

  public getPosition(): Cesium.Cartesian3 {
    return this.position.clone();
  }

  public setPosition(position: Cesium.Cartesian3): void {
    this.position = position.clone();
  }

  public destroy(): void {
    if (this.cursorEntity) {
      this.viewer.entities.remove(this.cursorEntity);
      this.cursorEntity = null;
    }
    if (this.ghostEntity) {
      this.viewer.entities.remove(this.ghostEntity);
      this.ghostEntity = null;
    }
  }

  public updateGhostPreview(objectType: string): void {
    if (!this.ghostEntity || !this.ghostEntity.label) return;
    
    this.ghostEntity.label.text = new Cesium.ConstantProperty(`Preview: ${objectType}`);
  }
}
