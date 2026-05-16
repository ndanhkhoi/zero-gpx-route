import maplibregl from 'maplibre-gl'
import { useEffect, useRef, useState, type RefObject } from 'react'

const DEFAULT_CENTER: [number, number] = [106.40129754087178, 10.354175408990718]

export interface UseMapInstanceResult {
  containerRef: RefObject<HTMLDivElement | null>
  map: maplibregl.Map | null
}

export function useMapInstance(): UseMapInstanceResult {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [map, setMap] = useState<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const instance = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: DEFAULT_CENTER,
      zoom: 16,
      attributionControl: false,
    })

    instance.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right')

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
    })
    instance.addControl(geolocate, 'top-right')

    instance.on('load', () => {
      setMap(instance)
    })

    return () => {
      instance.remove()
    }
  }, [])

  return { containerRef, map }
}
