# Atmos ☁️

**A calmer way to check the sky and plan your day.**

Atmos is a responsive weather dashboard built with React and TypeScript. It pairs a quiet, detail-rich interface with live forecast data, saved places, and useful forecast summaries.

## Features

- Current conditions: temperature, feels-like temperature, humidity, wind, and a plain-language weather summary.
- City search with debounced suggestions from Open-Meteo geocoding.
- Hourly outlook and seven-day forecast with daily highs, lows, and precipitation chances.
- UV index, sunrise and sunset times, and chance of rain.
- Up to five saved places, stored in browser local storage.
- Celsius/Fahrenheit switching and persistent dark/light themes.
- Optional browser geolocation, keyboard-friendly search, visible focus states, and reduced-motion support.
- No API key or account required.

## Stack

| Tool | Purpose |
| --- | --- |
| React + TypeScript | UI and typed data models |
| Vite | Development server and production build |
| CSS | Responsive custom design system |
| Lucide React | Interface icons |
| Vitest | Unit tests for weather helpers |
| Open-Meteo | Forecast and geocoding APIs |
| GitHub Actions | Test, build, and GitHub Pages deployment |

## Run locally

Requires Node.js 20 or newer.

```bash
git clone https://github.com/Ali-Rostami-1382/Atmos.git
cd Atmos
npm install
npm run dev
```

Run tests and build a production bundle:

```bash
npm test
npm run build
npm run preview
```

## Data and privacy

Atmos uses the public [Open-Meteo forecast API](https://open-meteo.com/) and [geocoding API](https://open-meteo.com/en/docs/geocoding-api). No API key is needed for this demo. Saved places and theme preference stay in local storage. Location is requested only when you select the location button. The app has no backend or cross-device sync.

## Deployment

The included GitHub Actions workflow tests, builds, and deploys `dist` to GitHub Pages when changes reach `main`. In repository **Settings → Pages**, select **GitHub Actions** as the deployment source. Vite uses `/Atmos/` as its base path in GitHub Actions, matching the intended repository name.

## Structure

```text
src/
├── components/WeatherGlyph.tsx
├── lib/weather.ts
├── lib/weather.test.ts
├── types/weather.ts
├── App.tsx
├── main.tsx
└── styles.css
.github/workflows/deploy.yml
```

## Ideas for a next iteration

- Add an end-to-end test for city search and saved places.
- Add precipitation graphs, wind direction, and improved internationalization.
- Refine loading states while switching between cities.

---

Built as a frontend portfolio project with a focus on thoughtful UI, real data, and maintainable React + TypeScript code.
