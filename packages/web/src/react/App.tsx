import { useState } from 'react';
import { IntroScreen } from './shared/components/IntroScreen';
import { DebugPanel } from './features/debug/components/DebugPanel';
import { PlayModeUI } from './layouts/PlayModeUI';
import { BuilderModeUI } from './layouts/BuilderModeUI';
import { GeoGuessBuilderUI } from './layouts/GeoGuessBuilderUI';
import { GeoGuessPlayUI } from './layouts/GeoGuessPlayUI';
import { MainMenu } from './features/menu/components/MainMenu';
import { GeoGuessMenu } from './features/geoguess/components/GeoGuessMenu';
import { ModeToggle } from './features/builder/components/ModeToggle';
import { useGameMode } from './hooks/useGameMode';
import { ThrottleSlider } from './features/controls/components/mobile/ThrottleSlider';
import { isMobileDevice } from './shared/utils/mobileDetect';
import { useGameMethod } from './hooks/useGameMethod';
import { HUD } from './features/hud/components/HUD';
import { CrashScreen } from './features/crash/components/CrashScreen';
import { ChallengeStorage } from '../cesium/geoguess/storage';

export function App() {
  const { mode, setMode } = useGameMode();
  const [appMode, setAppMode] = useState<'menu' | 'flightsim' | 'geoguess_menu'>('menu');

  const isMobile = isMobileDevice();
  const { setThrottle, getGeoGuessController } = useGameMethod();

  const handleThrottleChange = (percent: number) => {
    setThrottle(percent / 100);
  };

  const handleSelectMainMode = (mainMode: 'flightsim' | 'geoguess') => {
    if (mainMode === 'flightsim') {
      setAppMode('flightsim');
      setMode('play');
    } else {
      setAppMode('geoguess_menu');
    }
  };

  const handleStartBuilder = () => {
    setAppMode('flightsim'); // Hide menu by changing app mode
    setMode('geoguess_builder');
    const controller = getGeoGuessController();
    if (controller) {
      controller.startBuilding();
    }
  };

  const handlePlayChallenge = async (challengeId: string) => {
    const challenge = ChallengeStorage.getChallenge(challengeId);
    if (!challenge) {
      alert('Challenge not found!');
      return;
    }
    
    if (challenge.places.length === 0) {
      alert('This challenge has no locations!');
      return;
    }

    // IMPORTANT: Set mode FIRST so vehicle gets configured
    setMode('geoguess_play');
    
    // Wait a frame for React to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // NOW start playing (this will trigger teleportation)
    const controller = getGeoGuessController();
    if (controller) {
      controller.startPlaying(challenge);
    }
    
    // Hide menu AFTER starting
    setAppMode('flightsim');
  };

  const handleBackToMain = () => {
    setAppMode('menu');
  };

  return (
    <>
      {/* Menus */}
      {appMode === 'menu' && <MainMenu onSelectMode={handleSelectMainMode} />}
      {appMode === 'geoguess_menu' && (
        <GeoGuessMenu
          onStartBuilder={handleStartBuilder}
          onPlayChallenge={handlePlayChallenge}
          onBackToMain={handleBackToMain}
        />
      )}

      {/* Global UI - always visible when in game */}
      {appMode === 'flightsim' && (
        <>
          <IntroScreen />
          <DebugPanel />
          
          {/* Mode toggle button (temporary for testing) */}
          <div className="fixed bottom-4 right-4 z-50 pointer-events-auto">
            <ModeToggle />
          </div>
          
          {/* Mode-specific UI */}
          {mode === 'play' && !isMobile && <PlayModeUI />}
          {mode === 'builder' && <BuilderModeUI />}
          <HUD />
          {isMobile && <ThrottleSlider onChange={handleThrottleChange} />}
          <CrashScreen />
        </>
      )}

      {/* GeoGuess UI */}
      {mode === 'geoguess_builder' && <GeoGuessBuilderUI />}
      {mode === 'geoguess_play' && <GeoGuessPlayUI />}
    </>
  );
}


