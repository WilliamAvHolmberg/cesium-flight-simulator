import { GuessingMap } from '../features/geoguess/components/play/GuessingMap';
import { ScoreDisplay } from '../features/geoguess/components/play/ScoreDisplay';
import { PlaceInfo } from '../features/geoguess/components/play/PlaceInfo';

export function GeoGuessPlayUI() {
  return (
    <>
      <div className="fixed top-4 left-4 pointer-events-auto z-40">
        <ScoreDisplay />
      </div>

      <div className="fixed top-4 right-4 pointer-events-auto z-40">
        <PlaceInfo />
      </div>

      <div className="fixed bottom-4 right-4 pointer-events-auto z-40">
        <GuessingMap />
      </div>
    </>
  );
}
