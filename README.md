# Google Maps Platform Sample Application

This app allows the user to provide their location on the map and picks a random restaurant within a specific radius of user's location. The app shows photos from Google Places and the user gets the option to see the directions or spin again.

This sample was generated using [APIMatic’s context plugins](https://www.apimatic.io/) for API integration guidance.

## Demo

![Video Demo](sample-app.gif)

## Features

- **Drop a pin or use your location** — Set the search center by clicking the map or using the browser’s geolocation.
- **Adjustable radius** — Choose how far you’re willing to travel (500 m–50 km) with a live circle on the map.
- **Spin for a random restaurant** — One click runs a Places nearby search and picks a random restaurant in the circle.
- **Google Places photos** — View place photos returned by the Places API.
- **Street View preview** — See a static Street View image of the storefront when available.
- **One-click directions** — Open Google Maps with directions from your location to the chosen place.
- **Spin again** — Not happy with the pick? Spin again from the overlay or the result card.

## Quick Start

### Prerequisites

- **Google Maps Platform API key** — [Get and configure a key](https://developers.google.com/maps/documentation/javascript/get-api-key) in Google Cloud Console. Enable **Maps JavaScript API**, **Places API**, and **Street View Static API**.
- **Node.js 16+**
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/apimatic/GoogleMapsSampleApp.git
cd GoogleMapsSampleApp

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API key (VITE_GOOGLE_MAPS_API_KEY=...)

# Run the app
npm run dev
```

Open the URL shown in the terminal (e.g. `http://localhost:5173`).

## How It Works

The app is a client-side single-page application. The **Maps JavaScript API** loads with the `places` library and is initialized with the API key from `.env`. The map supports click-to-place a draggable marker and a **Circle** whose radius is tied to the “Radius (m)” input. When the user clicks **Spin**, the **PlacesService** runs a `nearbySearch` request with type `restaurant` and the current center and radius. One result is chosen at random. Place photos are rendered using the photo objects’ `getUrl()` method; the **Street View Static API** is used to show a storefront image via a simple image URL. Directions are provided as a **Google Maps directions URL** (origin and destination coordinates), so “Get directions” opens Google Maps in a new tab. The “wheel” is a CSS animation overlay shown during the request to add suspense before revealing the result.

## AI Generation Details

This application was generated using **Cursor** with the **APIMatic Context Plugin**.

### Prompt Used

> Create a web application using google maps platform apis sdk. for credentials create an env file in which the user will provide the API Key. The user will Drop a pin (or use your location) on the map, draw a circle for how far you are willing to travel, and click "spin." The app picks a random restaurant within that radius, shows you photos from Google Places, a Street View preview of the storefront, and one-click directions. Not happy with the pick? Spin again. The wheel animation and suspense make it feel like a game.

### Time Investment

- Initial generation: ~10 minutes  
- Testing and iteration: ~5 minutes  
- **Total: ~15 mins**

## Tech Stack

| Layer      | Technology |
|-----------|------------|
| Frontend  | HTML, TypeScript, Vite, CSS |
| Backend   | None (client-side only) |
| APIs      | Google Maps JavaScript API, Places API, Street View Static API |
| AI Assistant | Cursor with APIMatic Context Plugin |

## Resources

- [Google Maps Platform documentation](https://developers.google.com/maps)
- [APIMatic Portal for this API](https://gm-poc-apimatic.pages.dev/)
