# Latency Topology Visualizer

## Overview
This project is an interactive 3D latency topology visualizer for cryptocurrency exchange servers and cloud regions. It features:
- A 3D globe with exchange server markers
- Animated, color-coded latency lines with real-time mock updates
- Cloud provider region overlays
- Historical latency trends with recharts
- Filtering, search, and export features
- Responsive, modern UI using Next.js, Tailwind CSS, and shadcn/ui

## Features
- **3D World Map**: Interactive globe using Three.js and @react-three/fiber
- **Exchange Markers**: Major crypto exchanges plotted as 3D markers
- **Animated Latency Lines**: Real-time, color-coded connections between servers
- **Cloud Provider Regions**: Visual overlays for AWS, GCP, Azure
- **Historical Trends**: Time-series latency charts with recharts
- **Filtering & Controls**: Filter by exchange, provider, latency; theme toggle
- **Export**: Download latency charts as PNG or CSV

## Installation & Setup

### 1. Clone the Repository or extract the zip file.
```bash
git clone <your-repo-url>
cd latency-topology-visualizer
```

### 2. Install Dependencies
```bash
npm install
```

#### Key Dependencies and Why They Are Used
- **next**: React framework for SSR and static web apps
- **react, react-dom**: Core React libraries
- **three**: 3D rendering engine for the globe
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers for react-three-fiber (controls, stars, etc.)
- **tailwindcss, postcss, autoprefixer**: Utility-first CSS framework and tooling
- **shadcn/ui**: Modern, accessible React UI components (Card, Switch, Popover, etc.)
- **zustand**: State management (for future extensibility)
- **swr**: Data fetching and caching (for real APIs in the future)
- **recharts**: Charting library for historical latency trends
- **axios**: HTTP client (for real API integration)
- **date-fns**: Date formatting utilities
- **html-to-image, file-saver**: Export chart as PNG/CSV
- **next-themes**: Theme (dark/light) management

### 3. Development Server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build
```bash
npm run build
npm start
```

## Project Structure
- `app/` - Next.js app directory (routing, layout, global styles)
- `components/` - All React components (Globe, UI, chart, etc.)
  - `Globe.tsx` - Main 3D visualization and side panel
  - `ui/` - shadcn/ui components (Card, Switch, Popover, etc.)
- `public/` - Static assets (SVGs, textures)
- `lib/` - Utility functions

#Installation and there use
- **three, @react-three/fiber, @react-three/drei**: For rendering the interactive 3D globe, markers, lines, and overlays.
- **tailwindcss, postcss, autoprefixer**: For styling the UI in a utility-first, responsive way.
- **shadcn/ui**: For modern, accessible UI controls (side panel, toggles, popovers, etc.).
- **zustand, swr**: For scalable state management and data fetching (mocked now, ready for real APIs).
- **recharts**: For rendering historical latency charts.
- **axios, date-fns**: For future real API integration and date formatting.
- **html-to-image, file-saver**: For exporting the chart as PNG or CSV.
- **next-themes**: For dark/light mode support.

## Usage
- Use the side panel to filter exchanges, providers, and latency range.
- Toggle dark/light mode and cloud region overlays.
- Select server pairs and time ranges to view historical latency trends.
- Export charts as PNG or CSV.

## Source & Technologies
- 3D globe texture: [Three.js Earth Texture](https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg)
- Built with Next.js, React, Three.js, Tailwind CSS, shadcn/ui, recharts, and more.

