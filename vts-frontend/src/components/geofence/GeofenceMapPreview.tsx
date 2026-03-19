import { Circle, LayersControl, MapContainer, Marker, TileLayer } from 'react-leaflet'
import { createLocationIcon } from '@utils/leafletIcons'
import 'leaflet/dist/leaflet.css'

type GeofenceMapPreviewProps = {
  lat: number
  lon: number
  radius: number
}

export function GeofenceMapPreview({ lat, lon, radius }: GeofenceMapPreviewProps) {
  return (
    <div className='h-[120px] w-[200px] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700'>
      <MapContainer
        center={[lat, lon]}
        zoom={15}
        className='h-full w-full'
        dragging={false}
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        attributionControl={false}
      >
        <LayersControl position='topright'>
          <LayersControl.BaseLayer name='OpenStreetMap'>
            <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked name='Satellite'>
            <TileLayer url='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' />
          </LayersControl.BaseLayer>
        </LayersControl>
        <Marker position={[lat, lon]} icon={createLocationIcon({ color: '#06b6d4', size: 30 })} />
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
