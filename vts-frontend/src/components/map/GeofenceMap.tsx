import { useEffect } from 'react'
import type { LeafletEvent } from 'leaflet'
import { Circle, LayersControl, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { createLocationIcon } from '@utils/leafletIcons'
import 'leaflet/dist/leaflet.css'

type GeofenceMapProps = {
  center: [number, number]
  radius: number
  lat: number
  lon: number
  onLocationSelect?: (lat: number, lon: number) => void
}

type MapViewUpdaterProps = {
  center: [number, number]
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

function MapViewUpdater({ center }: MapViewUpdaterProps) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true })
  }, [center, map])

  return null
}

type MapTapHandlerProps = {
  onLocationSelect?: (lat: number, lon: number) => void
}

function MapTapHandler({ onLocationSelect }: MapTapHandlerProps) {
  useMapEvents({
    click(event) {
      if (!onLocationSelect) {
        return
      }
      onLocationSelect(event.latlng.lat, event.latlng.lng)
    },
  })

  return null
}

export function GeofenceMap({ center, radius, lat, lon, onLocationSelect }: GeofenceMapProps) {
  return (
    <div className='h-full min-h-[320px] w-full'>
      <MapContainer
        center={center}
        zoom={15}
        className='h-full w-full rounded-2xl'
        scrollWheelZoom
      >
        <MapResizeHandler />
        <MapViewUpdater center={center} />
        <MapTapHandler onLocationSelect={onLocationSelect} />

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

        <Marker
          position={[lat, lon]}
          icon={createLocationIcon({ color: '#06b6d4', size: 30 })}
          draggable={Boolean(onLocationSelect)}
          eventHandlers={{
            dragend(event: LeafletEvent) {
              if (!onLocationSelect) {
                return
              }

              const marker = event.target as { getLatLng: () => { lat: number; lng: number } }
              const latLng = marker.getLatLng()
              onLocationSelect(latLng.lat, latLng.lng)
            },
          }}
        />
        <Circle
          center={[lat, lon]}
          radius={radius}
          pathOptions={{
            color: '#06b6d4',
            fillColor: '#06b6d4',
            fillOpacity: 0.2,
            weight: 2,
          }}
        />
      </MapContainer>
    </div>
  )
}
