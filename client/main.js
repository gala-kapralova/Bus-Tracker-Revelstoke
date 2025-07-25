// Create a new OpenLayers map instance
const map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      // Use OpenStreetMap as the base layer
      source: new ol.source.OSM() 
    })
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([-118.1970, 50.9981]), // Revelstoke
    zoom: 13
  })
});

// Vector layer to show bus icons
const vectorLayer = new ol.layer.Vector({
  source: new ol.source.Vector()
});
map.addLayer(vectorLayer);

// Assign a color to each route number
function getColorByRoute(route) {
  const colorMap = {
    '1': '#e74c3c',
    '2': '#3498db',
    '5': '#2ecc71',
    '8': '#9b59b6',
    '10': '#f39c12',
    '11': '#34495e',
    '12': '#1abc9c',
    '19': '#8e44ad',
    '97': '#7f8c8d',
  };
  // Default color if not listed
  return colorMap[route] || '#555';
}

// Fetch real-time bus data from backend
async function fetchBuses() {
  const res = await fetch('http://bus-tracker-revelstoke.up.railway.app/api/buses');
  const data = await res.json();

  // Extract vehicle positions and route IDs
  const features = data.entity
    .filter(e => e.vehicle && e.vehicle.position)
    .map(e => {
      const lat = e.vehicle.position.latitude;
      const lon = e.vehicle.position.longitude;
      const route = e.vehicle.trip?.routeId?.split('-')[0] || 'N/A';
      return new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])),
        name: route
      });
    });

  // Clear old bus icons
  vectorLayer.getSource().clear();
  vectorLayer.getSource().addFeatures(features);

  // Set style for each bus icon with route number and color
  features.forEach(f => {
    const route = f.get('name');
    const color = getColorByRoute(route);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 64 64">
        <rect x="8" y="16" width="48" height="28" rx="4" ry="4" fill="${color}"/>
        <circle cx="20" cy="48" r="4" fill="black"/>
        <circle cx="44" cy="48" r="4" fill="black"/>
        <text x="32" y="34" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="sans-serif">${route}</text>
      </svg>
    `;

    const iconStyle = new ol.style.Style({
      image: new ol.style.Icon({
        src: 'data:image/svg+xml;utf8,' + encodeURIComponent(svg),
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        scale: window.devicePixelRatio >= 2 ? 1.5 : 1
      })
    });

    f.setStyle(iconStyle);
  });
}

// Initial fetch and polling every 30 seconds
fetchBuses();
setInterval(fetchBuses, 30000);
