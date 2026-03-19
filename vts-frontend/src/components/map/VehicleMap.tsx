import { useEffect, useRef } from 'react'
import type { LeafletMouseEvent, Marker as LeafletMarker } from 'leaflet'
import { Circle, LayersControl, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { Vehicle } from '../../types/vehicle'
import type { Geofence } from '../../types/geofence'
import type { Route } from '../../types/route'
import { createLocationIcon } from '@utils/leafletIcons'
import 'leaflet/dist/leaflet.css'

type VehicleMapProps = {
  vehicles: Vehicle[]
  center: [number, number]
  zoom: number
  onVehicleClick?: (vehicle: Vehicle) => void
  selectedVehicleId?: string | null
  geofences?: Geofence[]
  routes?: Route[]
}

type MapViewUpdaterProps = {
  center: [number, number]
  zoom: number
}

function markerColor(status: Vehicle['status']): string {
  switch (status) {
    case 'moving':
      return '#22c55e'
    case 'idling':
      return '#eab308'
    case 'offline':
      return '#94a3b8'
    case 'stopped':
      return '#ef4444'
    default:
      return '#3b82f6'
  }
}


function MapResizeHandler() {
  const map = useMap()

  useEffect(() => {
    map.invalidateSize()

    const container = map.getContainer()
    const observedElement = container.parentElement ?? container
    const observer = new ResizeObserver(() => {
      map.invalidateSize()
    })

    observer.observe(observedElement)

    return () => {
      observer.disconnect()
    }
  }, [map])

  return null
}

function MapViewUpdater({ center, zoom }: MapViewUpdaterProps) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [center, map, zoom])

  return null
}

export function VehicleMap({
  vehicles,
  center,
  zoom,
  onVehicleClick,
  selectedVehicleId,
  geofences = [],
  routes = [],
}: VehicleMapProps) {
  const markerRefs = useRef<Map<string, LeafletMarker>>(new Map())
  const lastOpenId = useRef<string | null>(null)

  useEffect(() => {
    if (!selectedVehicleId) {
      return
    }
    if (lastOpenId.current && lastOpenId.current !== selectedVehicleId) {
      const previousMarker = markerRefs.current.get(lastOpenId.current)
      previousMarker?.closeTooltip()
    }
    const marker = markerRefs.current.get(selectedVehicleId)
    if (marker) {
      marker.openTooltip()
      lastOpenId.current = selectedVehicleId
    }
  }, [selectedVehicleId])

  return (
    <div className='h-full min-h-[320px] w-full'>
      <MapContainer
        center={center}
        zoom={zoom}
        className='h-full w-full rounded-2xl'
        scrollWheelZoom
        touchZoom
      >
        <MapResizeHandler />
        <MapViewUpdater center={center} zoom={zoom} />
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

        {geofences.map((geofence) => (
          <Circle
            key={geofence.id}
            center={[geofence.lat, geofence.lon]}
            radius={geofence.radius}
            pathOptions={{
              color: geofence.isStop ? '#38bdf8' : '#22c55e',
              fillColor: geofence.isStop ? '#38bdf8' : '#22c55e',
              fillOpacity: 0.08,
              weight: 2,
            }}
          />
        ))}

        {routes.map((route) => {
          const positions: Array<[number, number]> = [
            [route.startStop.lat, route.startStop.lon],
            ...route.intermediateStops.map((stop) => [stop.lat, stop.lon] as [number, number]),
            [route.endStop.lat, route.endStop.lon],
          ]

          return positions.length > 1 ? (
            <Polyline
              key={route.id}
              positions={positions}
              pathOptions={{
                color: route.status === 'active' ? '#38bdf8' : '#94a3b8',
                weight: route.status === 'active' ? 4 : 3,
                opacity: 0.7,
              }}
            />
          ) : null
        })}

        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            position={[vehicle.lat, vehicle.lon]}
            icon={createLocationIcon({ color: markerColor(vehicle.status), size: 30 })}
            ref={(instance) => {
              if (!instance) {
                markerRefs.current.delete(vehicle.id)
                return
              }
              markerRefs.current.set(vehicle.id, instance)
            }}
            eventHandlers={{
              click(event: LeafletMouseEvent) {
                event.target.openTooltip()
                onVehicleClick?.(vehicle)
              },
            }}
          >
            <Tooltip direction='top' offset={[0, -14]} opacity={1} className='vts-tooltip'>
              <div className='vts-tooltip-content'>
                <div className='vts-tooltip-title'>{vehicle.vehicleName}</div>
                <div className='vts-tooltip-row'>
                  <span>Speed</span>
                  <span>{vehicle.speed} km/h</span>
                </div>
                <div className='vts-tooltip-row'>
                  <span>Status</span>
                  <span className='capitalize'>{vehicle.status}</span>
                </div>
                <div className='vts-tooltip-row'>
                  <span>Last seen</span>
                  <span>{new Date(vehicle.lastSeen).toLocaleString()}</span>
                </div>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
