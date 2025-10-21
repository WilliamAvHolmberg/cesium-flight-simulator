import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { getTokens } from '../../utils/tokenValidator';

export interface QualityConfig {
  fxaaEnabled: boolean;
  maximumScreenSpaceError: number;
  dynamicScreenSpaceError: boolean;
  dynamicScreenSpaceErrorFactor: number;
  skipLevelOfDetail: boolean;
  bloomEnabled: boolean;
  hdr: boolean;
  exposure: number;
}

export class Scene {
  public viewer: Cesium.Viewer;
  public scene: Cesium.Scene;
  public camera: Cesium.Camera;
  public clock: Cesium.Clock;
  public primitives: Cesium.PrimitiveCollection;

  private rotationSpeed = Cesium.Math.toRadians(0.1);
  private earthSpinListener: Cesium.Event.RemoveCallback | null = null;
  private tileset: Cesium.Cesium3DTileset | null = null;

  constructor(containerId: string) {
    Cesium.Ion.defaultAccessToken = getTokens().cesium;
    
    this.viewer = new Cesium.Viewer(containerId, {
      timeline: false,
      animation: false,
      baseLayer: false,
      baseLayerPicker: false,
      geocoder: false,
      shadows: false,
      msaaSamples: 4
    });

    this.scene = this.viewer.scene;
    this.camera = this.viewer.camera;
    this.clock = this.viewer.clock;
    this.primitives = this.scene.primitives;

    this.setupScene();
    this.setupPostProcessing();
    this.loadTerrain();
  }

  private setupScene(): void {
    this.viewer.scene.globe.show = false;
    this.scene.debugShowFramesPerSecond = true;

    // Mars-like atmosphere
    if (this.scene.skyAtmosphere) {
      // this.scene.skyAtmosphere.atmosphereMieCoefficient = new Cesium.Cartesian3(9.0e-5, 2.0e-5, 1.0e-5);
      // this.scene.skyAtmosphere.atmosphereRayleighCoefficient = new Cesium.Cartesian3(9.0e-6, 2.0e-6, 1.0e-6);
      // this.scene.skyAtmosphere.atmosphereRayleighScaleHeight = 9000;
      // this.scene.skyAtmosphere.atmosphereMieScaleHeight = 2700.0;
      // this.scene.skyAtmosphere.saturationShift = -0.1;
      // this.scene.skyAtmosphere.perFragmentAtmosphere = true;
    }
  }

  private setupPostProcessing(): void {
    const bloom = this.viewer.scene.postProcessStages.bloom;
    bloom.enabled = true;
    bloom.uniforms.brightness = -0.5;
    bloom.uniforms.stepSize = 1.0;
    bloom.uniforms.sigma = 3.0;
    bloom.uniforms.delta = 1.5;
    this.scene.highDynamicRange = true;
    this.viewer.scene.postProcessStages.exposure = 1.5;
    
    this.viewer.scene.postProcessStages.fxaa.enabled = true;
  }

  private async loadTerrain(): Promise<void> {
    try {
      this.tileset = await Cesium.createGooglePhotorealistic3DTileset(
        {
          onlyUsingWithGoogleGeocoder: true,
        },
        {
          maximumScreenSpaceError: 24,
          dynamicScreenSpaceError: true,
          dynamicScreenSpaceErrorDensity: 2.0e-4,
          dynamicScreenSpaceErrorFactor: 24.0,
          dynamicScreenSpaceErrorHeightFalloff: 0.25,
          cullRequestsWhileMoving: true,
          cullRequestsWhileMovingMultiplier: 60.0,
          skipLevelOfDetail: true,
          baseScreenSpaceError: 1024,
          skipScreenSpaceErrorFactor: 16,
          skipLevels: 1,
        }
      );
      this.primitives.add(this.tileset);
      
      this.setVehicleQualityMode('aircraft');
    } catch (error) {
      console.log('Terrain loading failed:', error);
    }
  }

  public clampToHeight(position: Cesium.Cartesian3, objectsToExclude?: any[]): Cesium.Cartesian3 | undefined {
    return this.scene.clampToHeight(position, objectsToExclude);
  }

  public setVehicleQualityMode(vehicleType: 'aircraft' | 'car'): void {
    if (!this.tileset) return;
    
    this.tileset.maximumScreenSpaceError = 24;
    console.log(`${vehicleType === 'car' ? '🚗' : '✈️'} Switched to ${vehicleType} mode - SSE: 24`);
  }

  public getQualityConfig(): QualityConfig {
    return {
      fxaaEnabled: this.viewer.scene.postProcessStages.fxaa.enabled,
      maximumScreenSpaceError: this.tileset?.maximumScreenSpaceError ?? 24,
      dynamicScreenSpaceError: this.tileset?.dynamicScreenSpaceError ?? true,
      dynamicScreenSpaceErrorFactor: this.tileset?.dynamicScreenSpaceErrorFactor ?? 24.0,
      skipLevelOfDetail: this.tileset?.skipLevelOfDetail ?? true,
      bloomEnabled: this.viewer.scene.postProcessStages.bloom.enabled,
      hdr: this.scene.highDynamicRange,
      exposure: this.viewer.scene.postProcessStages.exposure,
    };
  }

  public updateQualityConfig(config: Partial<QualityConfig>): void {
    if (config.fxaaEnabled !== undefined) {
      this.viewer.scene.postProcessStages.fxaa.enabled = config.fxaaEnabled;
    }

    if (this.tileset) {
      if (config.maximumScreenSpaceError !== undefined) {
        this.tileset.maximumScreenSpaceError = config.maximumScreenSpaceError;
      }
      if (config.dynamicScreenSpaceError !== undefined) {
        this.tileset.dynamicScreenSpaceError = config.dynamicScreenSpaceError;
      }
      if (config.dynamicScreenSpaceErrorFactor !== undefined) {
        this.tileset.dynamicScreenSpaceErrorFactor = config.dynamicScreenSpaceErrorFactor;
      }
      if (config.skipLevelOfDetail !== undefined) {
        this.tileset.skipLevelOfDetail = config.skipLevelOfDetail;
      }
    }

    if (config.bloomEnabled !== undefined) {
      this.viewer.scene.postProcessStages.bloom.enabled = config.bloomEnabled;
    }
    if (config.hdr !== undefined) {
      this.scene.highDynamicRange = config.hdr;
    }
    if (config.exposure !== undefined) {
      this.viewer.scene.postProcessStages.exposure = config.exposure;
    }
  }

  // Earth spinning functionality for startup sequence
  public startEarthSpin(): void {
    if (this.earthSpinListener) {
      return; // Already spinning
    }

    this.earthSpinListener = this.scene.postRender.addEventListener(() => {
      this.camera.rotateRight(this.rotationSpeed);
    });

    console.log('🌍 Earth spinning started - exploring the world...');
  }

  public stopEarthSpin(): void {
    if (this.earthSpinListener) {
      this.earthSpinListener();
      this.earthSpinListener = null;
      console.log('🌍 Earth spinning stopped');
    }
  }

  // Two-phase smooth zoom animation to target location
  public async zoomToLocation(position: Cesium.Cartesian3, duration: number = 5000): Promise<void> {
    const phase1Duration = duration - 1000; // Most of the time for approach
    const phase2Duration = 1000; // Last 1 second for final positioning

    console.log('📍 Zooming to spawn location...');

    // Phase 1: Approach the location without specific orientation
    await new Promise<void>((resolve) => {
      this.camera.flyTo({
        destination: Cesium.Cartesian3.fromRadians(
          Cesium.Cartographic.fromCartesian(position).longitude,
          Cesium.Cartographic.fromCartesian(position).latitude,
          400
        ),
        duration: phase1Duration / 1000, // Convert to seconds
        complete: () => {
          console.log('📍 Phase 1 complete - approaching target...');
          resolve();
        }
      });
    });

    // Phase 2: Final positioning with specific orientation
    return new Promise((resolve) => {
      const heading = Cesium.Math.toRadians(230.0);
      const pitch = Cesium.Math.toRadians(-15.0);

      this.camera.flyTo({
        destination: position,
        orientation: {
          heading: heading,
          pitch: pitch,
          roll: 0.0
        },
        duration: phase2Duration / 1000, // Convert to seconds
        complete: () => {
          console.log('📍 Zoom complete - ready for vehicle spawn');
          resolve();
        }
      });
    });
  }
}
