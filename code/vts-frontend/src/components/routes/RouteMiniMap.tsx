import { useMemo } from 'react'
import { LayersControl, MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet'
import type { RouteStop } from '../../types/route'
import { createLocationIcon } from '@utils/leafletIcons'
import 'leaflet/dist/leaflet.css'

type RouteMiniMapProps = {
  startStop?: RouteStop | null
  endStop?: RouteStop | null
  intermediateStops?: RouteStop[]
}

const DEFAULT_CENTER: [number, number] = [28.6139, 77.209]

export function RouteMiniMap({ startStop = null, endStop = null, intermediateStops = [] }: RouteMiniMapProps) {
  const stops = useMemo(
    () => (startStop ? [startStop, ...intermediateStops, ...(endStop ? [endStop] : [])] : []),
    [endStop, intermediateStops, startStop],
  )
  const positions = useMemo<Array<[number, number]>>(
    () => stops.map((stop) => [stop.lat, stop.lon]),
    [stops],
  )
  const center = positions[0] ?? DEFAULT_CENTER
  const mapKey = useMemo(
    () => positions.map(([lat, lon]) => `${lat},${lon}`).join(':') || 'empty',
    [positions],
  )

  return (
    <div className='h-[120px] w-[220px] overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-700'>
      <MapContainer
        key={mapKey}
        center={center}
        zoom={14}
        className='h-full w-full rounded-xl'
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        zoomControl={false}
      >
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
          <Polyline positions={positions} pathOptions={{ color: '#2563eb', weight: 4 }} />
        ) : null}
        {startStop ? (
          <Marker position={[startStop.lat, startStop.lon]} icon={createLocationIcon({ color: '#22c55e', size: 30 })} />
        ) : null}
        {endStop ? (
          <Marker position={[endStop.lat, endStop.lon]} icon={createLocationIcon({ color: '#ef4444', size: 30 })} />
        ) : null}
      </MapContainer>
    </div>
  )
}
