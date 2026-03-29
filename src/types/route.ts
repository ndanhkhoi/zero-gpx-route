export interface LatLng {
  lat: number
  lng: number
  routeIndex?: number
}

export type DrawMode = 'click' | 'freehand'
export type RouteType = 'run' | 'walk'
