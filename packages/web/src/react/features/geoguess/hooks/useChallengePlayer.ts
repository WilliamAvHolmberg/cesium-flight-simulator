import { useGameMethod } from '../../../hooks/useGameMethod';
import type { PlaySession, Guess, Position } from '../../../../cesium/geoguess/types';

export function useChallengePlayer() {
  const { callMethod } = useGameMethod();

  const getCurrentSession = (): PlaySession | null => {
    return callMethod<PlaySession | null>('getGeoGuessController.getCurrentSession');
  };

  const getCurrentPlace = () => {
    return callMethod<any>('getGeoGuessController.getCurrentPlace');
  };

  const submitGuess = (position: Position): Guess => {
    return callMethod<Guess>('getGeoGuessController.submitGuess', position);
  };

  const nextPlace = (): boolean => {
    return callMethod<boolean>('getGeoGuessController.nextPlace');
  };

  return {
    getCurrentSession,
    getCurrentPlace,
    submitGuess,
    nextPlace,
  };
}
