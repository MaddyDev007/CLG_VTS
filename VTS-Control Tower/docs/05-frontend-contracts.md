# Frontend Contracts

## Role

The frontend is a presentation and operator workflow layer.

It must:

- call scoped backend APIs
- display already-processed data
- format time, labels, charts, and maps
- respect RBAC and tenant visibility

It must not:

- compute canonical trips/events from raw telemetry
- override tenant scope
- store fake production data in place of missing backend data

## Business Logic Rules

Frontend must not calculate authoritative business state such as:

- trip boundaries
- overspeed incidents
- idling incidents
- stop events
- geofence transitions

Some current pages still do local filtering and chart shaping. That is acceptable only for view-level transformations, not canonical business computation.

## Shared Utility Rules

Frontend must use shared helpers for:

- time formatting
- scoped query building
- role-based visibility
- college-context resolution

Current examples:

- [scopedQuery.ts](/home/user/Desktop/codex%20vts%20v2/vts-frontend/src/utils/scopedQuery.ts#L1)
- [userManagementPermissions.ts](/home/user/Desktop/codex%20vts%20v2/vts-frontend/src/utils/userManagementPermissions.ts#L1)
- [useCurrentCollegeContext.ts](/home/user/Desktop/codex%20vts%20v2/vts-frontend/src/hooks/useCurrentCollegeContext.ts#L1)

## Map Rendering Rules

Map views must not flood the browser with raw points indefinitely.

Rules:

- cap visible history/playback points per view
- simplify or segment route rendering where needed
- do not render every raw telemetry point from large time ranges without sampling

Current-state notes:

- live map polls vehicles periodically
- history timeline is capped server-side
- playback components already segment routes in several views

## College Context Rules

- `SUPER_ADMIN`: selected college is a global view context
- other roles: fixed actor college, no selector
- frontend must not let non-super-admins override college by local storage or query manipulation

## UI Data Rules

- no hardcoded placeholder colleges in production UI
- no mixed-college labels on a single page
- all dropdowns must come from scoped API responses
