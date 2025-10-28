# GeoGuess Feature

## Overview
GeoGuess is a location-based guessing game built into the flight simulator. Players can create custom challenges by placing locations around the world, and others can play them by guessing where they are.

## How to Use

### Main Menu
When you start the app, you'll see a main menu with two options:
- **Flight Simulator**: The original flight sim experience
- **GeoGuess**: The new location guessing game

### Creating a Challenge (Builder Mode)

1. Select "GeoGuess" from main menu
2. Click "Create Challenge"
3. You'll enter Builder Mode with:
   - **Left sidebar**: List of locations in your challenge
   - **Challenge Info panel**: Name, description, category, and optional time limit
   - **Top-right controls**: Preview, Save, and Exit buttons

4. **Adding locations**:
   - Click "Add" in the locations panel
   - Use the map search or minimap to navigate to your desired location
   - Click on the 3D map where you want to place the flag
   - Edit the location name and add an optional hint

5. **Managing locations**:
   - Click any location in the list to select and teleport to it
   - Reposition the flag by clicking a new spot on the map
   - Delete locations with the "×" button
   - Locations are numbered in the order they'll appear during play

6. **Saving**:
   - Fill in challenge name (required)
   - Add description, category, and time limit (optional)
   - Click "Preview" to test your challenge
   - Click "Save" to store it locally

### Playing a Challenge

1. Select "GeoGuess" from main menu
2. Click "Play Challenge"
3. Choose a challenge from the list
4. For each location:
   - You'll spawn at the location with a red flag marker
   - Explore the area (altitude is limited to 500m)
   - Use aircraft or free camera mode
   - Click "🗺️ Open Map to Guess" when ready
   - Click on the world map to place your guess
   - Confirm your guess to see results
5. After all locations, you'll see your final score and performance

### Scoring
- **Perfect guess (0-100m)**: 1000 points
- Points decrease linearly with distance
- Maximum distance: 20,000km = 0 points
- Best score for each challenge is saved locally

## Technical Details

### File Structure
```
packages/web/src/
├── cesium/geoguess/
│   ├── types.ts              # TypeScript interfaces
│   ├── storage.ts            # LocalStorage utilities
│   ├── FlagManager.ts        # 3D flag rendering
│   ├── LocationTeleporter.ts # Instant teleportation
│   ├── GeoGuessController.ts # Main game logic
│   └── scoring.ts            # Distance & points calculation
└── react/features/geoguess/
    ├── components/
    │   ├── builder/          # Builder UI components
    │   ├── play/             # Play UI components
    │   ├── GeoGuessMenu.tsx  # GeoGuess main menu
    │   └── ChallengeList.tsx # Challenge selection
    └── hooks/
        ├── useChallengeBuilder.ts # Builder state management
        └── useChallengePlayer.ts  # Play state management
```

### Data Storage
Challenges are stored in localStorage with keys:
- `geoguess_challenges`: Array of all challenges
- `geoguess_scores`: Best scores for each challenge

### Game Modes
Two new game modes added to the mode system:
- `geoguess_builder`: For creating challenges
- `geoguess_play`: For playing challenges

## Features Implemented

✅ **Builder Mode**
- Navigate world with search and minimap
- Click to place location markers
- Edit location labels and hints
- Challenge metadata (name, description, category, time limit)
- Preview before saving
- Save to localStorage

✅ **Play Mode**
- Spawn at each location in sequence
- Altitude-limited free camera
- Interactive 2D guessing map
- Distance-based scoring
- Hint system (optional)
- Results screen after each guess
- Final score summary
- Best score tracking

✅ **UI Components**
- Main menu for mode selection
- GeoGuess submenu
- Challenge browser with metadata
- Builder sidebar with place list
- Play HUD with score display
- Expandable guessing map
- Results and completion screens

✅ **Core Systems**
- Flag rendering in 3D world
- Instant teleportation
- Distance calculation (geodesic)
- Points algorithm
- LocalStorage persistence
- Mode management integration
