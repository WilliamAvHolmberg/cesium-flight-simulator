import { useState } from 'react';
import { PlaceList } from '../features/geoguess/components/builder/PlaceList';
import { PlaceEditor } from '../features/geoguess/components/builder/PlaceEditor';
import { ChallengeMetadata } from '../features/geoguess/components/builder/ChallengeMetadata';
import { BuilderControls } from '../features/geoguess/components/builder/BuilderControls';
import { MiniMap } from '../features/minimap/components/MiniMap';
import { LocationSelector } from '../features/location/components/LocationSelector';

export function GeoGuessBuilderUI() {
  return (
    <>
      <div className="fixed left-4 top-4 bottom-4 w-80 pointer-events-auto z-40">
        <div className="h-full flex flex-col gap-4">
          <ChallengeMetadata />
          <div className="flex-1 min-h-0">
            <PlaceList />
          </div>
          <PlaceEditor />
        </div>
      </div>

      <div className="fixed top-4 right-4 pointer-events-auto z-40">
        <BuilderControls />
      </div>

      {/* Minimap */}
      <div className="fixed bottom-4 right-4 pointer-events-auto z-40">
        <MiniMap />
      </div>

      {/* Location Search */}
      <div className="fixed top-20 right-4 pointer-events-auto z-40">
        <LocationSelector />
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto z-40">
        <div className="bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-lg border border-slate-700 shadow-lg">
          <p className="text-slate-300 text-sm">
            <span className="text-white font-semibold">Navigate freely</span> • Click "Add" to create location at current position • Select location to reposition
          </p>
        </div>
      </div>
    </>
  );
}
