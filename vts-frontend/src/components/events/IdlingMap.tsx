import { useEffect } from 'react'
import { Circle, LayersControl, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import type { TripPlaybackPoint } from '../../types/trip'
import { createLocationIcon } from '@utils/leafletIcons'
import 'leaflet/dist/leaflet.css'

type IdlingMapProps = {
  lat: number
  lon: number
  routePoints?: TripPlaybackPoint[]
  currentPointIndex?: number
}

type MapViewUpdaterProps = {
  center: [number, number]
}

function MapViewUpdater({ center }: MapViewUpdaterProps) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true })
  }, [center, map])

  return null
}

export function IdlingMap({ lat, lon, routePoints = [], currentPointIndex = 0 }: IdlingMapProps) {
  const hasPlaybackPoint = routePoints.length > 0
  const boundedIndex = hasPlaybackPoint
    ? Math.max(0, Math.min(routePoints.length - 1, currentPointIndex))
    : 0
  const activePoint = hasPlaybackPoint ? routePoints[boundedIndex] : null
  const center: [number, number] = activePoint ? [activePoint.lat, activePoint.lon] : [lat, lon]

  return (
    <div className='h-full min-h-[360px] w-full'>
      <MapContainer
        center={center}
        zoom={16}
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

        <Marker position={center} icon={createLocationIcon({ color: '#f97316', size: 30 })} />
        <Circle
          center={center}
          radius={20}
          pathOptions={{
            color: '#f97316',
            fillColor: '#f97316',
            fillOpacity: 0.22,
            weight: 2,
          }}
        />
      </MapContainer>
    </div>
  )
}
