import type maplibregl from 'maplibre-gl'
import type { LatLng } from '../types/route'

export function ensureRouteLayer(map: maplibregl.Map) {
  if (map.getSource('route')) return

  map.addSource('route', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} },
  })

  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#3498db', 'line-width': 5, 'line-opacity': 0.7 },
  })
}

export function updateRouteLine(map: maplibregl.Map, routePoints: LatLng[]) {
  ensureRouteLayer(map)

  if (routePoints.length >= 2) {
    const source = map.getSource('route') as maplibregl.GeoJSONSource | undefined
    if (!source) return
    source.setData({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: routePoints.map((p) => [p.lng, p.lat]),
      },
      properties: {},
    })
  }
}

export function hideRouteLine(map: maplibregl.Map) {
  if (map.getLayer('route-line')) {
    map.setLayoutProperty('route-line', 'visibility', 'none')
  }
}
