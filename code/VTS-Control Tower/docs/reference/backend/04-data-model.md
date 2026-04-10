# Data Model

## users
| column | type | description |
| --- | --- | --- |
| id | uuid | primary key |
| name | varchar | display name |
| email | varchar | unique login |
| role | varchar | SUPER_ADMIN / COLLEGE_ADMIN / FLEET_MANAGER / STUDENT |
| collegeId | uuid? | optional college id |
| status | varchar | active / disabled |
| passwordHash | varchar | bcrypt hash |
| createdAt | timestamptz | created timestamp |

## vehicles
| column | type | description |
| --- | --- | --- |
| id | uuid | primary key |
| registrationNumber | varchar | registration number |
| vehicleName | varchar | vehicle name |
| vehicleType | varchar | Bus / Car / Van / Truck |
| status | varchar | moving / idling / offline / maintenance |
| deviceId | varchar? | assigned device UID (e.g. VTU_001) |
| speed | float | current speed |
| lat | float? | latitude |
| lon | float? | longitude |
| address | varchar? | human-readable address |
| lastSeen | timestamptz? | last telemetry timestamp |
| createdAt | timestamptz | created timestamp |
| updatedAt | timestamptz | updated timestamp |

## devices
| column | type | description |
| --- | --- | --- |
| id | uuid | primary key |
| deviceId | varchar | unique device UID (e.g. VTU_001) |
| imei | varchar | unique IMEI |
| assignedVehicleId | uuid? | vehicle FK |
| assignedVehicleName | varchar? | denormalized name |
| status | varchar | assigned / unassigned |
| createdAt | timestamptz | created timestamp |
| updatedAt | timestamptz | updated timestamp |

## telemetry
| column | type | description |
| --- | --- | --- |
| id | uuid | primary key |
| vehicleId | uuid | vehicle FK |
| vehicleName | varchar | denormalized name |
| deviceId | varchar | device UID (not DB UUID) |
| timestamp | timestamptz | telemetry time |
| lat | float | latitude |
| lon | float | longitude |
| address | varchar | address (optional) |
| speed | float | speed km/h |
| ignition | boolean | ignition state |
| battery | float | battery (mv) |
| signal | float | signal (dbm) |
| geofenceId | uuid? | current geofence id |
| geofenceName | varchar? | current geofence name |
| createdAt | timestamptz | persisted at |

## trips
| column | type | description |
| --- | --- | --- |
| id | uuid | primary key |
| vehicleId | uuid | vehicle FK |
| vehicleName | varchar | denormalized name |
| startLocation | varchar | start address |
| endLocation | varchar | end address |
| startTime | timestamptz | trip start |
| endTime | timestamptz? | trip end |
| duration | float | minutes (legacy storage; API returns ms) |
| distance | float | km |

## trip_playback_points
| column | type | description |
| --- | --- | --- |
| id | uuid | primary key |
| tripId | uuid | trip FK |
| timestamp | timestamptz | point time |
| lat | float | latitude |
| lon | float | longitude |
| speed | float | speed km/h |

## routes
| column | type | description |
| --- | --- | --- |
| id | uuid | primary key |
| name | varchar | route name |
| startStop | jsonb | start stop snapshot |
| endStop | jsonb | end stop snapshot |
| intermediateStops | jsonb | intermediate stops snapshot |
| assignedVehicleId | uuid? | vehicle FK |
| assignedVehicleName | varchar? | denormalized name |
| stopsCount | int | stop count |
| status | varchar | active / idle |
| createdAt | timestamptz | created timestamp |

## route_stops
| column | type | description |
| --- | --- | --- |
| id | uuid | primary key |
| routeId | uuid | route FK |
| name | varchar | stop name |
| lat | float | latitude |
| lon | float | longitude |
| stopOrder | int | ordering |
| stopType | varchar | start / intermediate / end |

## geofences
| column | type | description |
| --- | --- | --- |
| id | uuid | primary key |
| name | varchar | geofence name |
| address | varchar | address |
| lat | float | latitude |
| lon | float | longitude |
| radius | float | meters |
| isStop | boolean | marks as stop |
| createdAt | timestamptz | created timestamp |
| updatedAt | timestamptz | updated timestamp |

## overspeed_events
| column | type | description |
| --- | --- | --- |
| id | uuid | primary key |
| vehicleId | uuid | vehicle FK |
| vehicleName | varchar | denormalized name |
| tripId | uuid | trip FK |
| maxSpeed | float | max speed |
| speedLimit | float | limit |
| duration | float | seconds (legacy storage; API returns ms) |
| startTime | timestamptz | event start |
| endTime | timestamptz | event end |
| location | varchar | location |
| lat | float | latitude |
| lon | float | longitude |

## idling_events
| column | type | description |
| --- | --- | --- |
| id | uuid | primary key |
| vehicleId | uuid | vehicle FK |
| vehicleName | varchar | denormalized name |
| tripId | uuid | trip FK |
| duration | float | seconds (legacy storage; API returns ms) |
| startTime | timestamptz | event start |
| endTime | timestamptz | event end |
| location | varchar | location |
| lat | float | latitude |
| lon | float | longitude |

## stop_events
| column | type | description |
| --- | --- | --- |
| id | uuid | primary key |
| vehicleId | uuid | vehicle FK |
| vehicleName | varchar | denormalized name |
| tripId | uuid | trip FK |
| duration | float | seconds (legacy storage; API returns ms) |
| startTime | timestamptz | event start |
| endTime | timestamptz | event end |
| location | varchar | location |
| lat | float | latitude |
| lon | float | longitude |

## notifications
| column | type | description |
| --- | --- | --- |
| id | uuid | primary key |
| type | varchar | overspeed/geofence_enter/geofence_exit/idling/stop |
| vehicleId | uuid | vehicle FK |
| vehicleName | varchar | denormalized name |
| message | varchar | message |
| location | varchar | location |
| timestamp | timestamptz | event time |
| read | boolean | read state |

## profile_preferences
| column | type | description |
| --- | --- | --- |
| id | uuid | primary key |
| userId | uuid | user FK |
| timezone | varchar | timezone |
| preferences | jsonb | notification preferences |

## Relationships
- Vehicle → Telemetry (1:N)
- Vehicle → Trips (1:N)
- Vehicle → Routes (1:N)
- Vehicle → Devices (1:N)
- Trip → Playback Points (1:N)
- Route → Route Stops (1:N)
- Vehicle → Events (1:N)
