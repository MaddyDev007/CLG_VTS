declare module 'react-leaflet' {
  import type { ComponentType } from 'react';

  export const MapContainer: ComponentType<any>;
  export const TileLayer: ComponentType<any>;
  export const Marker: ComponentType<any>;
  export const Popup: ComponentType<any>;
  export const Tooltip: ComponentType<any>;
  export const Circle: ComponentType<any>;
  export const Polyline: ComponentType<any>;
  export const useMap: () => any;
  export const useMapEvents: (handlers: any) => any;
}
