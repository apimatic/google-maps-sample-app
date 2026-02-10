import './styles.css';

declare global {
  interface Window {
    initRestaurantSpin: () => void;
  }
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

interface AppState {
  map: google.maps.Map | null;
  marker: google.maps.Marker | null;
  circle: google.maps.Circle | null;
  center: { lat: number; lng: number } | null;
  radiusMeters: number;
  placesService: google.maps.places.PlacesService | null;
}

const state: AppState = {
  map: null,
  marker: null,
  circle: null,
  center: null,
  radiusMeters: 2000,
  placesService: null,
};

function renderAppContainer(): {
  app: HTMLElement;
  mapWrap: HTMLDivElement;
  controls: HTMLDivElement;
  radiusInput: HTMLInputElement;
  useLocationBtn: HTMLButtonElement;
  spinBtn: HTMLButtonElement;
  spinOverlay: HTMLElement;
  wheel: HTMLElement;
  spinAgainBtn: HTMLButtonElement;
  resultPanel: HTMLElement;
  resultContent: HTMLDivElement;
} {
  const app = document.getElementById('app')!;
  app.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = '<h1>🍴 Restaurant Spin</h1>';
  app.appendChild(header);

  const controls = document.createElement('div');
  controls.className = 'controls';
  controls.innerHTML = `
    <div class="control-group">
      <label for="radius">Radius (m)</label>
      <input type="number" id="radius" class="radius-input" value="2000" min="500" max="50000" step="500" />
    </div>
    <button type="button" class="btn btn-secondary" id="use-location">Use my location</button>
    <button type="button" class="btn btn-primary" id="spin">Spin</button>
  `;
  app.appendChild(controls);

  const mapWrap = document.createElement('div');
  mapWrap.className = 'map-wrap';
  mapWrap.innerHTML = '<div id="map"></div>';
  app.appendChild(mapWrap);

  const spinOverlay = document.createElement('div');
  spinOverlay.className = 'spin-overlay hidden';
  spinOverlay.id = 'spin-overlay';
  spinOverlay.innerHTML = `
    <div class="wheel-container">
      <div class="wheel-pointer"></div>
      <div class="wheel" id="wheel">
        <div class="wheel-inner">SPIN</div>
      </div>
    </div>
    <p class="spin-text" id="spin-text">Finding restaurants…</p>
    <button type="button" class="btn btn-primary spin-again-btn" id="spin-again">Spin again</button>
  `;
  app.appendChild(spinOverlay);

  const resultPanel = document.createElement('div');
  resultPanel.className = 'result-panel hidden';
  resultPanel.id = 'result-panel';
  const resultContent = document.createElement('div');
  resultContent.id = 'result-content';
  resultPanel.appendChild(resultContent);
  app.appendChild(resultPanel);

  const radiusInput = document.getElementById('radius') as HTMLInputElement;
  radiusInput.value = String(state.radiusMeters);
  const useLocationBtn = document.getElementById('use-location') as HTMLButtonElement;
  const spinBtn = document.getElementById('spin') as HTMLButtonElement;
  const wheel = document.getElementById('wheel')!;
  const spinAgainBtn = document.getElementById('spin-again') as HTMLButtonElement;

  return {
    app,
    mapWrap,
    controls,
    radiusInput,
    useLocationBtn,
    spinBtn,
    spinOverlay,
    wheel,
    spinAgainBtn,
    resultPanel,
    resultContent,
  };
}

function showMessage(message: string, isError = false): void {
  const app = document.getElementById('app')!;
  const existing = app.querySelector('.message');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.className = `message${isError ? ' error' : ''}`;
  div.textContent = message;
  app.appendChild(div);
}

function showNoKey(): void {
  const app = document.getElementById('app')!;
  app.innerHTML = `
    <div class="no-key">
      <h2>API key required</h2>
      <p>Create a <code>.env</code> file in the project root with:</p>
      <p><code>VITE_GOOGLE_MAPS_API_KEY=your_key_here</code></p>
      <p>Enable <strong>Maps JavaScript API</strong> and <strong>Places API</strong> (and optionally Street View Static API) in Google Cloud Console, then restart the dev server.</p>
    </div>
  `;
}

function initMap(): void {
  const {
    radiusInput,
    useLocationBtn,
    spinBtn,
    spinOverlay,
    wheel,
    spinAgainBtn,
    resultPanel,
    resultContent,
  } = renderAppContainer();

  const defaultCenter = { lat: 40.7128, lng: -74.006 };
  const map = new google.maps.Map(document.getElementById('map')!, {
    zoom: 13,
    center: defaultCenter,
    mapTypeControl: true,
    streetViewControl: true,
    fullscreenControl: true,
    zoomControl: true,
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#1d1d22' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#a1a1aa' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#0f0f12' }] },
    ],
  });

  const marker = new google.maps.Marker({
    map,
    position: defaultCenter,
    draggable: true,
    title: 'Search center',
  });

  const circle = new google.maps.Circle({
    map,
    center: defaultCenter,
    radius: state.radiusMeters,
    fillColor: '#f59e0b',
    fillOpacity: 0.15,
    strokeColor: '#f59e0b',
    strokeOpacity: 0.6,
    strokeWeight: 2,
  });

  const placesService = new google.maps.places.PlacesService(map);

  state.map = map;
  state.marker = marker;
  state.circle = circle;
  state.center = defaultCenter;
  state.placesService = placesService;

  map.addListener('click', (e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat();
    const lng = e.latLng?.lng();
    if (lat != null && lng != null) {
      const center = { lat, lng };
      state.center = center;
      marker.setPosition(center);
      circle.setCenter(center);
    }
  });

  marker.addListener('dragend', () => {
    const pos = marker.getPosition();
    if (pos) {
      state.center = { lat: pos.lat(), lng: pos.lng() };
      circle.setCenter(state.center);
    }
  });

  function updateRadius(): void {
    const val = parseInt(radiusInput.value, 10);
    if (!Number.isNaN(val) && val >= 500 && val <= 50000) {
      state.radiusMeters = val;
      circle.setRadius(state.radiusMeters);
    }
  }

  radiusInput.addEventListener('change', updateRadius);
  radiusInput.addEventListener('input', updateRadius);

  useLocationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showMessage('Geolocation is not supported by your browser.', true);
      return;
    }
    useLocationBtn.disabled = true;
    useLocationBtn.textContent = 'Locating…';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        state.center = center;
        marker.setPosition(center);
        circle.setCenter(center);
        map.panTo(center);
        map.setZoom(15);
        useLocationBtn.disabled = false;
        useLocationBtn.textContent = 'Use my location';
      },
      () => {
        showMessage('Could not get your location. Try dropping a pin on the map.', true);
        useLocationBtn.disabled = false;
        useLocationBtn.textContent = 'Use my location';
      },
      { enableHighAccuracy: true }
    );
  });

  function showSpinOverlay(show: boolean, text = 'Finding restaurants…'): void {
    spinOverlay.classList.toggle('hidden', !show);
    const spinText = document.getElementById('spin-text');
    if (spinText) spinText.textContent = text;
    if (show) {
      wheel.classList.add('spinning');
    } else {
      wheel.classList.remove('spinning');
    }
  }

  function pickRandomPlace(results: google.maps.places.PlaceResult[]): google.maps.places.PlaceResult | null {
    if (!results.length) return null;
    return results[Math.floor(Math.random() * results.length)];
  }

  function buildStreetViewUrl(lat: number, lng: number, width = 600, height = 300): string {
    const key = encodeURIComponent(API_KEY!);
    const loc = `${lat},${lng}`;
    return `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&location=${encodeURIComponent(loc)}&key=${key}`;
  }

  function buildDirectionsUrl(origin: { lat: number; lng: number }, dest: { lat: number; lng: number }): string {
    const o = `${origin.lat},${origin.lng}`;
    const d = `${dest.lat},${dest.lng}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(o)}&destination=${encodeURIComponent(d)}&travelmode=driving`;
  }

  function renderResult(place: google.maps.places.PlaceResult, origin: { lat: number; lng: number }): void {
    const lat = place.geometry?.location?.lat();
    const lng = place.geometry?.location?.lng();
    const name = place.name || 'Restaurant';
    const address = place.vicinity || (place as google.maps.places.PlaceResult & { formatted_address?: string }).formatted_address || '';

    let photosHtml = '';
    if (place.photos && place.photos.length > 0) {
      const urls = place.photos.slice(0, 5).map((p) => {
        return p.getUrl({ maxWidth: 400, maxHeight: 300 });
      });
      photosHtml = `<div class="result-photos">${urls.map((url) => `<img src="${url}" alt="" loading="lazy" />`).join('')}</div>`;
    }

    let streetViewHtml = '';
    if (lat != null && lng != null) {
      const svUrl = buildStreetViewUrl(lat, lng);
      streetViewHtml = `<div class="streetview-wrap"><img src="${svUrl}" alt="Street View" loading="lazy" /></div>`;
    }

    const directionsUrl = lat != null && lng != null ? buildDirectionsUrl(origin, { lat, lng }) : '#';
    const rating = place.rating != null ? `⭐ ${place.rating}${place.user_ratings_total != null ? ` (${place.user_ratings_total} reviews)` : ''}` : '';

    resultContent.innerHTML = `
      <h2>Your pick</h2>
      <div class="result-card">
        ${photosHtml}
        <div class="result-body">
          <h3 class="result-name">${escapeHtml(name)}</h3>
          <p class="result-address">${escapeHtml(address)}</p>
          ${rating ? `<p class="result-rating">${rating}</p>` : ''}
          ${streetViewHtml}
          <div class="result-actions">
            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Get directions</a>
            <button type="button" class="btn btn-secondary" id="spin-again-2">Spin again</button>
          </div>
        </div>
      </div>
    `;

    resultPanel.classList.remove('hidden');
    document.getElementById('spin-again-2')?.addEventListener('click', () => {
      resultPanel.classList.add('hidden');
      spinBtn.click();
    });
  }

  function escapeHtml(s: string): string {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function doSpin(): void {
    if (!state.center || !state.placesService) {
      showMessage('Set a location first: click the map or use "Use my location".', true);
      return;
    }

    showSpinOverlay(true, 'Finding restaurants…');
    spinBtn.disabled = true;

    const request: google.maps.places.PlaceSearchRequest = {
      location: state.center,
      radius: state.radiusMeters,
      type: 'restaurant',
    };

    state.placesService.nearbySearch(request, (results, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !results?.length) {
        showSpinOverlay(false);
        spinBtn.disabled = false;
        showMessage(status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
          ? 'No restaurants found in this radius. Try a larger radius or different location.'
          : `Places request failed: ${status}.`, true);
        return;
      }

      const textEl = document.getElementById('spin-text');
      if (textEl) textEl.textContent = 'Picking one…';

      const place = pickRandomPlace(results);
      if (!place) {
        showSpinOverlay(false);
        spinBtn.disabled = false;
        showMessage('No place selected.', true);
        return;
      }

      setTimeout(() => {
        showSpinOverlay(false);
        spinBtn.disabled = false;
        renderResult(place, state.center!);
      }, 800);
    });
  }

  spinBtn.addEventListener('click', doSpin);

  spinAgainBtn.addEventListener('click', () => {
    resultPanel.classList.add('hidden');
    doSpin();
  });
}

function loadGoogleMaps(apiKey: string): void {
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=initRestaurantSpin`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

function bootstrap(): void {
  if (!API_KEY || API_KEY === 'your_api_key_here') {
    showNoKey();
    return;
  }

  window.initRestaurantSpin = () => initMap();
  loadGoogleMaps(API_KEY);
}

bootstrap();
