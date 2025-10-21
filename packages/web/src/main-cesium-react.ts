import { CesiumVehicleGame } from './cesium/bootstrap/main';
import { GameBridge } from './cesium/bridge/GameBridge';
import { mountReactUI } from './react/index';
import { hasValidTokens } from './utils/tokenValidator';
import { mountTokenSetup } from './react/tokenSetup.tsx';
import './cesium.css';

console.log('🎮 Modular Cesium Vehicle Game with React UI is starting...');

async function initializeGame() {
    if (!hasValidTokens()) {
        console.log('⚠️ Missing API tokens - showing setup UI...');
        mountTokenSetup(() => {
            console.log('✅ Tokens configured - reloading...');
            window.location.reload();
        });
        return;
    }

    const game = new CesiumVehicleGame('cesiumContainer');

    console.log('🎬 Starting cinematic sequence...');
    await game.startCinematicSequence();

    console.log('🌉 Creating game bridge...');
    const gameBridge = new GameBridge(game);

    gameBridge.emit('gameReady', { ready: true });

    console.log('⚛️ Mounting React UI...');
    mountReactUI(gameBridge);

    console.log('✅ Game and UI ready!');

    if (typeof window !== 'undefined') {
        (window as { cesiumGame?: CesiumVehicleGame }).cesiumGame = game;
        (window as { gameBridge?: GameBridge }).gameBridge = gameBridge;
    }

    return { game, gameBridge };
}

initializeGame().catch(error => {
    console.error('Failed to start Cesium Vehicle Game:', error);
});

