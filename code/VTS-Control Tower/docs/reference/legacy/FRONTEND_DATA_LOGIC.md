# Frontend Data Logic Audit

This document lists frontend-calculated data, filtered lists, derived state, and UI metrics that are not directly stored in the database.

## Dashboard

| Component | File | Variable | Logic | API Endpoint | Value Type | Business Meaning |
| --- | --- | --- | --- | --- | --- | --- |
| DashboardPage | `vts-frontend/src/pages/dashboard/DashboardPage.tsx` | `stoppedCount` | If `counts.stopped` is defined, use it; else `max(0, counts.total - counts.moving - counts.idling - counts.offline)` | `GET /vehicles/status-counts` | computed aggregation | Backfills the stopped count when the API omits it, to keep totals consistent. |
| DashboardPage | `vts-frontend/src/pages/dashboard/DashboardPage.tsx` | `derivedStopped` | `max(0, total - moving - idling - offline)` if API response does not include `stopped` | `GET /vehicles/status-counts` | computed aggregation | Ensures a stopped bucket for dashboard cards and charts. |
| DashboardPage | `vts-frontend/src/pages/dashboard/DashboardPage.tsx` | `activities` | `notifications.slice(0, 10).map(mapNotificationToActivity)` | `GET /notifications` | filtered from API response | Recent activity feed showing the latest 10 items. |
| DashboardPage | `vts-frontend/src/pages/dashboard/DashboardPage.tsx` | `mapNotificationToActivity().activityType` | Maps `notification.type` to labels (`Overspeed detected`, `Vehicle stopped`, etc.) | `GET /notifications` | derived in frontend | Human-friendly activity category for the dashboard. |
| DashboardPage | `vts-frontend/src/pages/dashboard/DashboardPage.tsx` | `mapNotificationToActivity().timestamp` | Converts ISO to relative text (`just now`, `5 min ago`, `2 hr ago`) | `GET /notifications` | derived in frontend | Relative time shown in the activity feed. |
| DashboardPage | `vts-frontend/src/pages/dashboard/DashboardPage.tsx` | `pieData` | Converts `counts` into chart data objects | `GET /vehicles/status-counts` | derived in frontend | Chart-ready breakdown of vehicle status. |

## Vehicles

| Component | File | Variable | Logic | API Endpoint | Value Type | Business Meaning |
| --- | --- | --- | --- | --- | --- | --- |
| VehiclesPage | `vts-frontend/src/pages/dashboard/VehiclesPage.tsx` | `initialStatusFilter` | Reads `status` from URL query; defaults to `all` if invalid | N/A | derived in frontend | Initializes the status filter from the URL for shareable views. |
| VehiclesPage | `vts-frontend/src/pages/dashboard/VehiclesPage.tsx` | `filteredVehicles` | Search by name/registration/address and status filter | `GET /vehicles` | filtered from API response | The vehicles shown in the card grid. |
| VehiclesPage | `vts-frontend/src/pages/dashboard/VehiclesPage.tsx` | `derivedStatus` | `!lastSeen ? offline : speed > 5 ? moving : speed > 0 ? idling : stopped` | `GET /vehicles` | derived in frontend | Status label used for filtering when backend status is unavailable or stale. |
| VehicleTable | `vts-frontend/src/components/vehicles/VehicleTable.tsx` | `filteredVehicles` | Search by vehicle fields + derived status (same logic as above) | `GET /vehicles` | filtered from API response | The rows shown in the vehicle table. |
| VehicleTable | `vts-frontend/src/components/vehicles/VehicleTable.tsx` | `sortedVehicles` | Sorts by selected column; parses `lastSeen` to timestamp | `GET /vehicles` | derived in frontend | User-controlled ordering of the vehicle table. |
| VehicleTable | `vts-frontend/src/components/vehicles/VehicleTable.tsx` | `totalPages`, `paginatedVehicles` | Pagination from `sortedVehicles` and `pageSize` | `GET /vehicles` | derived in frontend | Table paging for large fleets. |

## Trips

| Component | File | Variable | Logic | API Endpoint | Value Type | Business Meaning |
| --- | --- | --- | --- | --- | --- | --- |
| TripsPage | `vts-frontend/src/pages/dashboard/TripsPage.tsx` | `filteredTrips` | Date-range + vehicle filters computed in memory | `GET /trips` | filtered from API response | Trips shown after applying UI filters. |
| TripsPage | `vts-frontend/src/pages/dashboard/TripsPage.tsx` | `vehicleOptions` | Deduplicates vehicle IDs and sorts labels | `GET /trips` | derived in frontend | Options for the vehicle filter dropdown. |
| TripTable | `vts-frontend/src/components/trips/TripTable.tsx` | `sortedTrips` | Sorts by chosen field; dates parsed to timestamps | `GET /trips` | derived in frontend | User-controlled trip ordering. |
| TripTable | `vts-frontend/src/components/trips/TripTable.tsx` | `totalPages`, `paginatedTrips` | Pagination from sorted list | `GET /trips` | derived in frontend | Trip table paging. |
| TripDetailPage | `vts-frontend/src/pages/dashboard/TripDetailPage.tsx` | `normalizeTrip` | Fills missing fields and derives duration (ms) from start/end times | `GET /trips/:tripId` | derived in frontend | Ensures detail view always has required fields for display. |
| TripDetailPage | `vts-frontend/src/pages/dashboard/TripDetailPage.tsx` | `generateFallbackPlayback` | Creates synthetic playback points if API returns none | `GET /trips/:tripId/playback` | derived in frontend | Prevents empty playback UI when backend lacks data. |
| TripDetailPage | `vts-frontend/src/pages/dashboard/TripDetailPage.tsx` | `maxSpeed` | `playback.reduce(max)` | `GET /trips/:tripId/playback` | computed aggregation | Maximum speed reached during the trip. |
| TripDetailPage | `vts-frontend/src/pages/dashboard/TripDetailPage.tsx` | `averageSpeed` | `sum(speed) / count` | `GET /trips/:tripId/playback` | computed aggregation | Average speed for the trip. |
| TripDetailPage | `vts-frontend/src/pages/dashboard/TripDetailPage.tsx` | `currentPoint` | `playback[currentPointIndex] ?? null` | `GET /trips/:tripId/playback` | derived in frontend | Current playback location for map/controls. |
| useTripPlayback | `vts-frontend/src/hooks/useTripPlayback.ts` | `currentPointIndex`, `currentPoint`, `speed`, `isPlaying` | Timer-driven index progression with bounds checks and speed multiplier | `GET /trips/:tripId/playback` | derived in frontend | Client-side playback state for trip animation. |

## Telemetry

| Component | File | Variable | Logic | API Endpoint | Value Type | Business Meaning |
| --- | --- | --- | --- | --- | --- | --- |
| TelemetryDataPage | `vts-frontend/src/pages/dashboard/TelemetryDataPage.tsx` | `rows` | Filters server results by `deviceId` on the client | `GET /telemetry` | filtered from API response | Final telemetry rows shown in the table. |
| TelemetryDataPage | `vts-frontend/src/pages/dashboard/TelemetryDataPage.tsx` | `vehicleOptions` | Deduplicates vehicle IDs and sorts labels | `GET /telemetry` | derived in frontend | Vehicle filter options. |
| TelemetryDataPage | `vts-frontend/src/pages/dashboard/TelemetryDataPage.tsx` | `deviceOptions` | Unique device IDs from telemetry rows | `GET /telemetry` | derived in frontend | Device filter options. |
| TelemetryFilters | `vts-frontend/src/components/telemetry/TelemetryFilters.tsx` | `resolvedFilters` | Builds date range start/end ISO strings, normalizes ignition and empty values | `GET /telemetry` | derived in frontend | Normalized filter payload passed to API. |

## History

| Component | File | Variable | Logic | API Endpoint | Value Type | Business Meaning |
| --- | --- | --- | --- | --- | --- | --- |
| HistoryPage | `vts-frontend/src/pages/dashboard/HistoryPage.tsx` | `filteredData` | Date-range + vehicle filter in memory | `GET /history` | filtered from API response | Vehicle history rows shown to users. |
| HistoryPage | `vts-frontend/src/pages/dashboard/HistoryPage.tsx` | `vehicleOptions` | Maps vehicles to `{id, label}` list | `GET /history` | derived in frontend | Vehicle filter options. |
| HistoryFilters | `vts-frontend/src/components/history/HistoryFilters.tsx` | `resolvedFilters` | Normalizes date range filters and empty values | N/A | derived in frontend | UI filter state for history. |
| HistoryTimeline | `vts-frontend/src/components/history/HistoryTimeline.tsx` | `sortedEvents` | Sorts timeline events by time ascending | `GET /history/:vehicleId/timeline` | derived in frontend | Chronological ordering of events. |
| HistoryTimeline | `vts-frontend/src/components/history/HistoryTimeline.tsx` | `pagedEvents` | Pagination of timeline events | `GET /history/:vehicleId/timeline` | derived in frontend | Controlled paging of event timeline. |
| HistoryMap | `vts-frontend/src/components/history/HistoryMap.tsx` | `route` | Maps timeline points to `[lat, lon]` polyline | `GET /history/:vehicleId/timeline` | derived in frontend | Route polyline for the map. |
| HistoryMap | `vts-frontend/src/components/history/HistoryMap.tsx` | `markerPositions` | Joins events to timeline points by timestamp and filters missing matches | `GET /history/:vehicleId/timeline` | derived in frontend | Event markers placed on the map path. |
| HistoryMap | `vts-frontend/src/components/history/HistoryMap.tsx` | `currentPoint`, `center` | Bounds `currentPointIndex`, fallbacks to route or default center | `GET /history/:vehicleId/timeline` | derived in frontend | Map centering and current-position marker. |

## Events (Overspeed / Idling / Stop)

| Component | File | Variable | Logic | API Endpoint | Value Type | Business Meaning |
| --- | --- | --- | --- | --- | --- | --- |
| OverspeedPage | `vts-frontend/src/pages/dashboard/OverspeedPage.tsx` | `filteredEvents` | Date-range + vehicle + speed limit filters | `GET /events/overspeed` | filtered from API response | Overspeed events shown after filters. |
| OverspeedPage | `vts-frontend/src/pages/dashboard/OverspeedPage.tsx` | `vehicleOptions` | Deduplicates vehicle IDs and sorts labels | `GET /events/overspeed` | derived in frontend | Vehicle filter options for overspeed. |
| OverspeedFilters | `vts-frontend/src/components/events/OverspeedFilters.tsx` | `resolvedFilters` | Builds ISO date range, normalizes speed limit | `GET /events/overspeed` | derived in frontend | Filter payload sent to API. |
| OverspeedTable | `vts-frontend/src/components/events/OverspeedTable.tsx` | `filteredEvents` | Search by vehicle name | `GET /events/overspeed` | filtered from API response | Search results in overspeed table. |
| OverspeedTable | `vts-frontend/src/components/events/OverspeedTable.tsx` | `sortedEvents`, `paginatedEvents` | Sorts by column, then paginates | `GET /events/overspeed` | derived in frontend | Ordering and pagination of overspeed events. |
| IdlingPage | `vts-frontend/src/pages/dashboard/IdlingPage.tsx` | `filteredEvents` | Date-range + vehicle + min-duration filters | `GET /events/idling` | filtered from API response | Idling events after filters. |
| IdlingFilters | `vts-frontend/src/components/events/IdlingFilters.tsx` | `resolvedFilters` | Builds ISO date range, normalizes min duration (ms) | `GET /events/idling` | derived in frontend | Filter payload for idling events. |
| IdlingTable | `vts-frontend/src/components/events/IdlingTable.tsx` | `filteredEvents`, `sortedEvents`, `paginatedEvents` | Search by vehicle, sort, paginate | `GET /events/idling` | derived in frontend | Idling list behavior. |
| StopPage | `vts-frontend/src/pages/dashboard/StopPage.tsx` | `filteredEvents` | Date-range + vehicle + min-duration filters | `GET /events/stop` | filtered from API response | Stop events after filters. |
| StopFilters | `vts-frontend/src/components/events/StopFilters.tsx` | `resolvedFilters` | Builds ISO date range, normalizes min duration (ms) | `GET /events/stop` | derived in frontend | Filter payload for stop events. |
| StopTable | `vts-frontend/src/components/events/StopTable.tsx` | `filteredEvents`, `sortedEvents`, `paginatedEvents` | Search by vehicle, sort, paginate | `GET /events/stop` | derived in frontend | Stop events list behavior. |

## Geofences

| Component | File | Variable | Logic | API Endpoint | Value Type | Business Meaning |
| --- | --- | --- | --- | --- | --- | --- |
| GeofenceList | `vts-frontend/src/components/geofence/GeofenceList.tsx` | `filteredGeofences` | Search by name or address | `GET /geofences` | filtered from API response | Search results for geofences. |
| GeofenceList | `vts-frontend/src/components/geofence/GeofenceList.tsx` | `sortedGeofences`, `paginatedGeofences` | Sort by column, paginate | `GET /geofences` | derived in frontend | Ordering and paging for geofence list. |

## Routes

| Component | File | Variable | Logic | API Endpoint | Value Type | Business Meaning |
| --- | --- | --- | --- | --- | --- | --- |
| RoutesTable | `vts-frontend/src/components/routes/RoutesTable.tsx` | `filteredRoutes` | Search by route name or assigned vehicle name | `GET /routes` | filtered from API response | Routes shown after search. |
| RoutesTable | `vts-frontend/src/components/routes/RoutesTable.tsx` | `paginatedRoutes` | Slice list by page/limit | `GET /routes` | derived in frontend | Pagination of routes table. |
| RouteMiniMap | `vts-frontend/src/components/routes/RouteMiniMap.tsx` | `positions` | Maps stops into polyline coordinates | `GET /routes` | derived in frontend | Map preview geometry for routes. |

## Users

| Component | File | Variable | Logic | API Endpoint | Value Type | Business Meaning |
| --- | --- | --- | --- | --- | --- | --- |
| UsersTable | `vts-frontend/src/components/users/UsersTable.tsx` | `sortedUsers` | Sorts users by selected column; parses `createdAt` | `GET /users` | derived in frontend | User list ordering. |

## Notifications

| Component | File | Variable | Logic | API Endpoint | Value Type | Business Meaning |
| --- | --- | --- | --- | --- | --- | --- |
| NotificationsList | `vts-frontend/src/components/notifications/NotificationsList.tsx` | `sortedNotifications` | Sorts by timestamp descending | `GET /notifications` | derived in frontend | Latest notifications on top. |
| NotificationsList | `vts-frontend/src/components/notifications/NotificationsList.tsx` | `paginatedNotifications` | Slices sorted list by page/limit | `GET /notifications` | derived in frontend | Notification paging. |
| NotificationsList | `vts-frontend/src/components/notifications/NotificationsList.tsx` | `typeLabel` | Maps `type` to readable labels | `GET /notifications` | derived in frontend | Human-readable notification category labels. |
| notificationStore | `vts-frontend/src/store/notificationStore.ts` | `unreadCount` | `reduce` count of items where `read === false` | `GET /notifications` | computed aggregation | Unread notification badge count. |
| notificationStore | `vts-frontend/src/store/notificationStore.ts` | `toasts` | Prepends new notifications and caps at 5 items | `GET /notifications` | derived in frontend | Toast stack for recent alerts. |

## UI Playback / Maps

| Component | File | Variable | Logic | API Endpoint | Value Type | Business Meaning |
| --- | --- | --- | --- | --- | --- | --- |
| TripPlaybackMap | `vts-frontend/src/components/trips/TripPlaybackMap.tsx` | `routeSegments` | Splits playback points into segments for the map | `GET /trips/:tripId/playback` | derived in frontend | Visual playback route for trips. |
| OverspeedPlaybackMap | `vts-frontend/src/components/events/OverspeedPlaybackMap.tsx` | `routeSegments` | Splits playback points into segments for event playback | `GET /events/overspeed/:id/playback` | derived in frontend | Map route for overspeed event playback. |
| StopMap | `vts-frontend/src/components/events/StopMap.tsx` | `routeSegments` | Splits playback points into segments for stop playback | `GET /events/stop/:id/playback` | derived in frontend | Map route for stop event playback. |
| IdlingMap | `vts-frontend/src/components/events/IdlingMap.tsx` | `routeSegments` | Splits playback points into segments for idling playback | `GET /events/idling/:id/playback` | derived in frontend | Map route for idling event playback. |
