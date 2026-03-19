import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { LayersControl, MapContainer, Marker, Polyline, TileLayer, Popup, useMap } from 'react-leaflet'
import type { RouteStop } from '../../types/route'
import { createLocationIcon } from '@utils/leafletIcons'
import 'leaflet/dist/leaflet.css'

type RoutePreviewMapProps = {
  startStop?: RouteStop | null
  endStop?: RouteStop | null
  intermediateStops?: RouteStop[]
  heightClassName?: string
}

const DEFAULT_CENTER: [number, number] = [28.6139, 77.209]

type FitBoundsProps = {
  positions: Array<[number, number]>
}

function FitBounds({ positions }: FitBoundsProps) {
  const map = useMap()

  useEffect(() => {
    if (positions.length < 2) {
      return
    }

    const bounds = L.polyline(positions).getBounds()
    map.fitBounds(bounds, { padding: [24, 24] })
  }, [map, positions])

  return null
}

export function RoutePreviewMap({
  startStop = null,
  endStop = null,
  intermediateStops = [],
  heightClassName = 'h-[220px]',
}: RoutePreviewMapProps) {
  const stops = useMemo(
    () => (startStop ? [startStop, ...intermediateStops, ...(endStop ? [endStop] : [])] : []),
    [endStop, intermediateStops, startStop],
  )

  const positions = useMemo<Array<[number, number]>>(
    () => stops.map((stop) => [stop.lat, stop.lon]),
    [stops],
  )

  const center = positions[0] ?? DEFAULT_CENTER

  return (
    <div className={`w-full overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-700 ${heightClassName}`}>
      <MapContainer
        center={center}
        zoom={14}
        className='h-full w-full rounded-xl'
        scrollWheelZoom
        dragging
        doubleClickZoom
        touchZoom
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
          <>
            <Polyline positions={positions} pathOptions={{ color: '#2563eb', weight: 4 }} />
            <FitBounds positions={positions} />
          </>
        ) : null}

        {startStop ? (
          <Marker position={[startStop.lat, startStop.lon]} icon={createLocationIcon({ color: '#22c55e', size: 30 })}>
            <Popup>
              <div className='text-sm'>
                <div className='font-semibold'>{startStop.name}</div>
                <div>Stop 1</div>
              </div>
            </Popup>
          </Marker>
        ) : null}

        {intermediateStops.map((stop, index) => (
          <Marker key={stop.id} position={[stop.lat, stop.lon]} icon={createLocationIcon({ color: '#f97316', size: 30 })}>
            <Popup>
              <div className='text-sm'>
                <div className='font-semibold'>{stop.name}</div>
                <div>Stop {index + 2}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {endStop ? (
          <Marker position={[endStop.lat, endStop.lon]} icon={createLocationIcon({ color: '#ef4444', size: 30 })}>
            <Popup>
              <div className='text-sm'>
                <div className='font-semibold'>{endStop.name}</div>
                <div>Stop {intermediateStops.length + 2}</div>
              </div>
            </Popup>
          </Marker>
        ) : null}
      </MapContainer>
    </div>
  )
}
