import { useEffect, useMemo } from 'react'
import { LayersControl, MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import type { TripPlaybackPoint } from '../../types/trip'
import { convertTelemetryToPolyline } from '../../utils/polylineUtils'
import { createLocationIcon } from '@utils/leafletIcons'
import 'leaflet/dist/leaflet.css'

type TripPlaybackMapProps = {
  routePoints: TripPlaybackPoint[]
  currentPointIndex?: number
}

type MapViewUpdaterProps = {
  center: [number, number]
}

const DEFAULT_CENTER: [number, number] = [28.6139, 77.209]

function MapViewUpdater({ center }: MapViewUpdaterProps) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true })
  }, [center, map])

  return null
}

export function TripPlaybackMap({ routePoints, currentPointIndex = 0 }: TripPlaybackMapProps) {
  const positions = useMemo<[number, number][]>(
    () => convertTelemetryToPolyline(routePoints),
    [routePoints],
  )

  const boundedIndex = routePoints.length
    ? Math.max(0, Math.min(routePoints.length - 1, currentPointIndex))
    : 0
  const startPoint = routePoints[0] ?? null
  const endPoint = routePoints[routePoints.length - 1] ?? null
  const currentPoint = routePoints[boundedIndex] ?? null
  const center = currentPoint
    ? ([currentPoint.lat, currentPoint.lon] as [number, number])
    : startPoint
      ? ([startPoint.lat, startPoint.lon] as [number, number])
      : DEFAULT_CENTER

  return (
    <div className='h-full min-h-[360px] w-full'>
      <MapContainer
        center={center}
        zoom={15}
        className='h-full w-full rounded-xl'
        scrollWheelZoom={false}
        touchZoom
      >
        <MapViewUpdater center={center} />
        <LayersControl position='topright'>
          <LayersControl.BaseLayer name='OpenStreetMap'>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked name='Satellite'>
            <TileLayer
              attribution='Tiles &copy; Esri'
              url='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {positions.length > 1 ? (
          <Polyline positions={positions} pathOptions={{ color: '#06b6d4', weight: 4 }} />
        ) : null}

        {startPoint ? (
          <Marker position={[startPoint.lat, startPoint.lon]} icon={createLocationIcon({ color: '#22c55e', size: 30 })} />
        ) : null}

        {endPoint ? (
          <Marker position={[endPoint.lat, endPoint.lon]} icon={createLocationIcon({ color: '#ef4444', size: 30 })} />
        ) : null}

        {currentPoint ? (
          <Marker
            position={[currentPoint.lat, currentPoint.lon]}
            icon={createLocationIcon({ color: '#2563eb', size: 30, pulse: true })}
          />
        ) : null}
      </MapContainer>
    </div>
  )
}
