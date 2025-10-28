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

    const teleporter = controller.getTeleporter();
    const currentPos = teleporter.getCurrentPosition();
    
    return controller.addPlace(currentPos, label);
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
