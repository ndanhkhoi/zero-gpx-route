import { forwardRef } from 'react'
import type maplibregl from 'maplibre-gl'
import { MapGeocoder } from './map-geocoder'

interface MapCanvasProps {
  map: maplibregl.Map | null
}

export const MapCanvas = forwardRef<HTMLDivElement, MapCanvasProps>(({ map }, ref) => {
  return (
    <div
      ref={ref}
      className="map-canvas relative w-full min-h-[300px] h-[clamp(300px,60vh,900px)] sm:min-h-[420px] lg:min-h-[620px] lg:h-[clamp(420px,75vh,900px)] rounded-xl overflow-hidden"
    >
      <MapGeocoder map={map} />
    </div>
  )
})

MapCanvas.displayName = 'MapCanvas'
