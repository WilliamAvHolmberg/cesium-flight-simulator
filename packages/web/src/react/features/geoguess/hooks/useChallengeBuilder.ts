import { useGameMethod } from '../../../hooks/useGameMethod';
import type { Challenge } from '../../../../cesium/geoguess/types';

export function useChallengeBuilder() {
  const { getGeoGuessController } = useGameMethod();

  const getCurrentChallenge = (): Challenge | null => {
    const controller = getGeoGuessController();
    return controller?.getCurrentChallenge() || null;
  };

  const addPlace = (label: string) => {
    const controller = getGeoGuessController();
    if (!controller) return null;

    // Create place with no position initially - user will click on map to set it
    const place = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: { latitude: 0, longitude: 0, height: 0 }, // Dummy position, will be replaced
      label,
    };

    const challenge = controller.getCurrentChallenge();
    if (challenge) {
      challenge.places.push(place);
      return place;
    }
    
    return null;
  };

  const updatePlace = (placeId: string, updates: any) => {
    const controller = getGeoGuessController();
    if (controller) {
      controller.updatePlace(placeId, updates);
    }
  };

  const deletePlace = (placeId: string) => {
    const controller = getGeoGuessController();
    if (controller) {
      controller.deletePlace(placeId);
    }
  };

  const selectPlace = (placeId: string) => {
    const controller = getGeoGuessController();
    if (controller) {
      controller.selectPlace(placeId);
    }
  };

  const getSelectedPlace = () => {
    const controller = getGeoGuessController();
    return controller?.getSelectedPlace() || null;
  };

  const updateChallengeMetadata = (updates: Partial<Challenge>) => {
    const challenge = getCurrentChallenge();
    if (challenge) {
      Object.assign(challenge, updates);
    }
  };

  return {
    getCurrentChallenge,
    addPlace,
    updatePlace,
    deletePlace,
    selectPlace,
    getSelectedPlace,
    updateChallengeMetadata,
  };
}
