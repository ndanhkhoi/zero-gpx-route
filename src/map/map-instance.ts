import maplibregl from 'maplibre-gl'

const DEFAULT_CENTER: [number, number] = [106.40129754087178, 10.354175408990718]

export function createMapInstance(): maplibregl.Map {
  const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: DEFAULT_CENTER,
    zoom: 16,
  })

  map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right')

  const geolocate = new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: false,
  })
  map.addControl(geolocate, 'top-right')

  map.on('load', () => geolocate.trigger())

  return map
}
