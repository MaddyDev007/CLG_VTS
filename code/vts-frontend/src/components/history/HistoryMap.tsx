import { useEffect, useMemo } from 'react'
import { LayersControl, MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import type { HistoryEvent, HistoryPoint } from '../../types/history'
import { createLocationIcon } from '@utils/leafletIcons'
import 'leaflet/dist/leaflet.css'

type HistoryMapProps = {
  timeline: HistoryPoint[]
  events: HistoryEvent[]
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

export function HistoryMap({ timeline, events, currentPointIndex = 0 }: HistoryMapProps) {
  const route = useMemo<Array<[number, number]>>(
    () => timeline.map((point) => [point.lat, point.lon] as [number, number]),
    [timeline],
  )

  const markerPositions = useMemo(() => {
    const eventToPoint = new Map(timeline.map((point) => [point.timestamp, point]))
    return events
      .map((event, index) => {
        const point = eventToPoint.get(event.time)
        if (!point) {
          return null
        }

        return {
          key: `${event.type}-${event.time}-${index}`,
          type: event.type,
          position: [point.lat, point.lon] as [number, number],
        }
      })
      .filter((marker): marker is { key: string; type: HistoryEvent['type']; position: [number, number] } =>
        Boolean(marker),
      )
  }, [events, timeline])

  const boundedIndex = timeline.length
    ? Math.max(0, Math.min(timeline.length - 1, currentPointIndex))
    : 0
  const currentPoint = timeline[boundedIndex] ?? null
  const center = currentPoint ? ([currentPoint.lat, currentPoint.lon] as [number, number]) : route[0] ?? DEFAULT_CENTER

  return (
    <div className='h-full min-h-[360px] w-full'>
      <MapContainer
        center={center}
        zoom={14}
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

        {route.length > 1 ? <Polyline positions={route} pathOptions={{ color: '#06b6d4', weight: 4 }} /> : null}

        {markerPositions.map((marker) => {
          const color =
            marker.type === 'trip_start'
              ? '#22c55e'
              : marker.type === 'trip_end'
                ? '#3b82f6'
                : marker.type === 'stop'
                  ? '#ef4444'
                  : '#f97316'

          return (
            <Marker
              key={marker.key}
              position={marker.position}
              icon={createLocationIcon({ color, size: 30 })}
            />
          )
        })}

        {currentPoint ? (
          <Marker
            position={[currentPoint.lat, currentPoint.lon]}
            icon={createLocationIcon({ color: '#06b6d4', size: 30 })}
          />
        ) : null}
      </MapContainer>
    </div>
  )
}
