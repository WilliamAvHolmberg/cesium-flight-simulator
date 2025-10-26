# 🗺️ Mapbox Mini-Map Setup

## Quick Start

### 1. Get Your Mapbox Token

1. Go to [https://account.mapbox.com/](https://account.mapbox.com/)
2. Sign up for a free account (no credit card required)
3. Navigate to **Access Tokens**
4. Copy your **Default Public Token** (starts with `pk.`)

### 2. Add Token to Environment

Create a `.env` file in `/packages/web/`:

```bash
VITE_MAPBOX_TOKEN=pk.your_actual_token_here
```

**Important:** Add `.env` to `.gitignore` to keep your token private!

### 3. Restart Dev Server

```bash
npm run dev
```

## Features

### Current Features ✅
- **Real-time position tracking** - Vehicle position updates live on the map
- **Heading indicator** - Arrow shows which direction you're facing
- **Altitude display** - Current altitude shown in meters
- **Toggle visibility** - Hide/show the mini-map with the 🗺️ button
- **Expandable view** - Click `+` to expand for better view
- **Dark theme** - Matches your glass UI aesthetic
- **Smooth updates** - Position updates smoothly as you move

### Controls
- **🗺️ Button** (when hidden) - Show mini-map
- **× Button** - Hide mini-map
- **+ / − Button** - Expand/collapse map size
- **Small mode:** 250x250px (default)
- **Large mode:** 500x500px (expanded)

### Future Features 🚀
- **Click to teleport** - Click anywhere on the map to teleport
- **Route planning** - Plan routes and waypoints
- **Points of interest** - Mark favorite locations
- **Custom markers** - Add custom markers and labels
- **Terrain overlay** - Toggle 3D terrain view

## Customization

### Map Styles
Change the `mapStyle` prop in `MiniMap.tsx`:
- `mapbox://styles/mapbox/dark-v11` (current - dark theme)
- `mapbox://styles/mapbox/light-v11` (light theme)
- `mapbox://styles/mapbox/streets-v12` (street map)
- `mapbox://styles/mapbox/satellite-v9` (satellite view)
- `mapbox://styles/mapbox/satellite-streets-v12` (hybrid)

### Size & Position
Adjust in `MiniMap.tsx`:
- Position: Change `bottom-8 right-8` classes
- Small size: Change `w-[250px] h-[250px]`
- Large size: Change `w-[500px] h-[500px]`

### Zoom Levels
- Small mode: `zoom: 13`
- Large mode: `zoom: 14`
- Adjust in the `initialViewState` prop

## Troubleshooting

### Map not showing?
1. Check your `.env` file has the correct token
2. Restart the dev server after adding `.env`
3. Check browser console for errors

### Token invalid?
1. Make sure you copied the **public token** (starts with `pk.`)
2. Token should be the **Default Public Token** from Mapbox dashboard
3. Don't use a **secret token** (starts with `sk.`)

### Performance issues?
1. The map is lazy-loaded and optimized
2. Disable interactions in small mode (already done)
3. Consider reducing update frequency if needed

## Free Tier Limits

Mapbox free tier includes:
- **50,000 map loads/month** - More than enough for development
- **Unlimited map views** - Once loaded, no additional charges
- **No credit card required** - Completely free to start

## Files Created

```
packages/web/src/react/features/minimap/
├── components/
│   └── MiniMap.tsx              # Main mini-map component
├── hooks/
│   └── useVehiclePosition.ts    # Position tracking hook
```

## Dependencies Added

- `mapbox-gl` - Core Mapbox GL JS library
- `react-map-gl` - React wrapper for Mapbox
- `@types/mapbox-gl` - TypeScript definitions


