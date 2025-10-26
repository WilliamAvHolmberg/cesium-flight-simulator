const MAPBOX_TOKEN_KEY = 'cesium_mapbox_token';
const CESIUM_TOKEN_KEY = 'cesium_ion_token';

export interface Tokens {
  mapbox: string;
  cesium: string;
}

export function getTokens(): Tokens {
  const envMapbox = import.meta.env.VITE_MAPBOX_TOKEN;
  const envCesium = import.meta.env.VITE_CESIUM_TOKEN;

  if (envMapbox && envCesium) {
    return {
      mapbox: envMapbox,
      cesium: envCesium,
    };
  }

  const localMapbox = localStorage.getItem(MAPBOX_TOKEN_KEY);
  const localCesium = localStorage.getItem(CESIUM_TOKEN_KEY);

  return {
    mapbox: envMapbox || localMapbox || '',
    cesium: envCesium || localCesium || '',
  };
}

export function hasValidTokens(): boolean {
  const tokens = getTokens();
  return tokens.mapbox.length > 0 && tokens.cesium.length > 0;
}

export function saveTokens(mapbox: string, cesium: string): void {
  localStorage.setItem(MAPBOX_TOKEN_KEY, mapbox);
  localStorage.setItem(CESIUM_TOKEN_KEY, cesium);
}

export function clearTokens(): void {
  localStorage.removeItem(MAPBOX_TOKEN_KEY);
  localStorage.removeItem(CESIUM_TOKEN_KEY);
}


