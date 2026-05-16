export interface LatLng {
  lat: number
  lng: number
  routeIndex?: number
}

export type RouteType = 'run' | 'walk'

export interface AnchorSegment {
  kind: 'anchor'
  id: string
  point: LatLng
}

interface StrokeSegment {
  kind: 'stroke'
  id: string
  points: LatLng[]
}

export type DrawSegment = AnchorSegment | StrokeSegment
