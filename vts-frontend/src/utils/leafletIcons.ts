import L from 'leaflet'

type LocationIconOptions = {
  color: string
  size?: number
  pulse?: boolean
}

export function createLocationIcon({ color, size = 30, pulse = false }: LocationIconOptions): L.DivIcon {
  const pulseStyle = pulse ? 'animation: ping 1.4s ease-in-out infinite;' : ''

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    html: `
      <span style="display:block;width:${size}px;height:${size}px;color:${color};${pulseStyle}">
        <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
          <path d="M12 2.5c-4.1 0-7.5 3.4-7.5 7.6 0 5.4 6.2 11.6 7.1 12.5.2.2.4.2.6 0 .9-.9 7.1-7.1 7.1-12.5 0-4.2-3.4-7.6-7.3-7.6zm0 10.7c-1.7 0-3.1-1.4-3.1-3.1s1.4-3.1 3.1-3.1 3.1 1.4 3.1 3.1-1.4 3.1-3.1 3.1z"/>
        </svg>
      </span>
    `,
  })
}
