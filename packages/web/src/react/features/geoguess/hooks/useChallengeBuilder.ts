import { useGameMethod } from '../../../hooks/useGameMethod';
import type { Challenge } from '../../../../cesium/geoguess/types';

export function useChallengeBuilder() {
  const { callMethod } = useGameMethod();

  const getCurrentChallenge = (): Challenge | null => {
    return callMethod<Challenge | null>('getGeoGuessController.getCurrentChallenge');
  };

  const addPlace = (label: string) => {
    const controller = callMethod<any>('getGeoGuessController');
    if (!controller) return null;

    const teleporter = controller.getTeleporter();
    const currentPos = teleporter.getCurrentPosition();
    
    return controller.addPlace(currentPos, label);
  };

  const updatePlace = (placeId: string, updates: any) => {
    callMethod('getGeoGuessController.updatePlace', placeId, updates);
  };

  const deletePlace = (placeId: string) => {
    callMethod('getGeoGuessController.deletePlace', placeId);
  };

  const selectPlace = (placeId: string) => {
    callMethod('getGeoGuessController.selectPlace', placeId);
  };

  const getSelectedPlace = () => {
    return callMethod<any>('getGeoGuessController.getSelectedPlace');
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
