import { useGameMethod } from '../../../hooks/useGameMethod';
import type { PlaySession, Guess, Position } from '../../../../cesium/geoguess/types';

export function useChallengePlayer() {
  const { getGeoGuessController } = useGameMethod();

  const getCurrentSession = (): PlaySession | null => {
    const controller = getGeoGuessController();
    return controller?.getCurrentSession() || null;
  };

  const getCurrentPlace = () => {
    const controller = getGeoGuessController();
    return controller?.getCurrentPlace() || null;
  };

  const submitGuess = (position: Position): Guess | null => {
    const controller = getGeoGuessController();
    if (!controller) return null;
    return controller.submitGuess(position);
  };

  const nextPlace = (): boolean => {
    const controller = getGeoGuessController();
    if (!controller) return false;
    return controller.nextPlace();
  };

  return {
    getCurrentSession,
    getCurrentPlace,
    submitGuess,
    nextPlace,
  };
}
