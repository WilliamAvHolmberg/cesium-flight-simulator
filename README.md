# Cesium Flight Simulator

A 3D flight simulator built with Cesium, React, and TypeScript. Fly aircraft or drive a car across real-world terrain with multiple camera modes and a mini-map.

## Features

- **Multiple Vehicles** - Switch between aircraft and car
- **Camera Modes** - Follow, close follow, and drone cameras
- **Real Terrain** - Built on Cesium's global 3D terrain data
- **Mini-Map** - Real-time position tracking with Mapbox
- **Location Teleport** - Jump to famous locations instantly
- **Quality Presets** - Performance, balanced, quality, and ultra modes
- **Crash Detection** - Aircraft collision detection with terrain
- **AI 3D Model Generator** - Generate custom 3D models with MeshyAI (optional)

## Quick Start

### Prerequisites

- Node.js 18 or higher
- Free API tokens from Mapbox and Cesium Ion

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/cesium-flight-simulator.git
cd cesium-flight-simulator/packages/web

# Install dependencies
npm install

# Run the development server
npm run dev
```

The app will prompt you for API tokens on first launch, or you can create a `.env` file:

```bash
VITE_MAPBOX_TOKEN=your_mapbox_token_here
VITE_CESIUM_TOKEN=your_cesium_token_here
```

### Getting API Tokens

**Mapbox Token** (for mini-map)
1. Sign up at [mapbox.com](https://account.mapbox.com/)
2. Copy your default public token (starts with `pk.`)

**Cesium Ion Token** (for 3D terrain)
1. Sign up at [cesium.com/ion](https://ion.cesium.com/tokens)
2. Copy your default access token

Both services are free for development use.

## 3D Model Generation (Optional)

If you want to generate custom 3D models using AI, you can enable the MeshyAI integration:

### Prerequisites

- MeshyAI API key (subscription required - get it from [meshy.ai](https://www.meshy.ai))
- Node.js proxy server (to handle CORS)

### Setup

1. **Start the proxy server:**
   ```bash
   cd packages/api
   npm install
   npm run dev
   ```

2. **Start the web app:**
   ```bash
   cd packages/web
   npm run dev
   ```

3. **In the app:**
   - Open the Model Generator overlay
   - Enter your MeshyAI API key
   - Start generating 3D models with text prompts
   - Replace the airplane with your generated models

The generator supports two art styles (realistic and sculpture) and allows you to customize rotation and scale before replacing the vehicle model.

## Controls

| Key | Action |
|-----|--------|
| `W` | Throttle |
| `S` | Brake |
| `A` / `D` / `←` / `→` | Roll |
| `C` | Switch camera |
| `M` | Toggle vehicle |
| `?` | Show controls |
| `~` | Debug panel |

## Tech Stack

- **Cesium** - 3D globe and terrain rendering
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Mapbox GL** - 2D mini-map
- **MeshyAI API** - AI-powered 3D model generation (optional)
- **Express** - Proxy server for CORS handling (optional)

## Project Structure

```
packages/
├── web/src/
│   ├── cesium/           # Core 3D engine
│   │   ├── vehicles/     # Aircraft and car implementations
│   │   ├── camera/       # Camera systems
│   │   ├── managers/     # Vehicle and camera management
│   │   └── bridge/       # React-Cesium communication
│   └── react/            # UI layer
│       ├── features/     # UI features (HUD, controls, mini-map, model-generator)
│       └── hooks/        # React hooks for game state
└── api/                  # Express proxy server for MeshyAI (optional)
```

## Development

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [Cesium](https://cesium.com/) for the 3D rendering engine
- [Mapbox](https://www.mapbox.com/) for map tiles and styling
- [MeshyAI](https://www.meshy.ai/) for AI-powered 3D model generation

