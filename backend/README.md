# Campus Rush Backend

Express API for campus locations, crowd reports, GPS matching, nearby distances, and facility slot booking.

## Run

```bash
npm install
copy .env.example .env
npm run dev
```

Set `DATABASE_URL` in `.env` to PostgreSQL. The backend creates the schema and runs the idempotent campus seed automatically at startup. The server listens on `http://localhost:5000` by default.

Required variables are `PORT`, `DATABASE_URL`, `FRONTEND_URL`, and `WALKING_SPEED_MPS`. Without `DATABASE_URL`, an in-memory development store is used so tests can run without PostgreSQL; production deployments should configure PostgreSQL.

## Routes

- `GET /api/locations`
- `GET /api/locations/nearby?latitude=...&longitude=...&category=...`
- `GET /api/locations/:id`
- `GET /api/health`
- `POST /api/location/current`
- `GET /api/crowd/:locationId`
- `GET /api/crowd/:locationId/recent`
- `GET /api/crowd/:locationId/history`
- `GET /api/crowd/reports`
- `POST /api/crowd/report`
- `GET /api/recommendations?category=FOOD&latitude=...&longitude=...`
- `GET /api/recommendations/best-time/:locationId`
- `GET /api/facilities`
- `GET /api/facilities/:id`
- `GET /api/facilities/:id/slots?date=YYYY-MM-DD`
- `POST /api/bookings` (authenticated)
- `GET /api/bookings/my` (authenticated)
- `PATCH /api/bookings/:id/cancel` (authenticated)
- `POST /api/bookings/:bookingId/checkin-qr` (authenticated booking owner)
- `POST /api/admin/facilities/:facilityId/slots` (facility admin)
- `GET /api/admin/facilities/:facilityId/bookings` (facility admin)
- `PATCH /api/admin/slots/:slotId` (facility admin)
- `PATCH /api/admin/slots/:slotId/close` (facility admin)
- `PATCH /api/admin/slots/:slotId/cancel` (facility admin)
- `PATCH /api/admin/bookings/:id/cancel` (facility admin)
- `POST /api/admin/checkin/verify` (facility admin)
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me` with `Authorization: Bearer <token>`

Crowd estimates use reports from the last 30 minutes. Average thresholds are `[0,.5) = EMPTY`, `[.5,1.5) = LOW`, `[1.5,2.5) = MEDIUM`, `[2.5,3.5) = HIGH`, and `[3.5,4] = VERY_HIGH`. Confidence is `UNKNOWN`, `LOW`, `MODERATE`, or `HIGH` based on 0, 1, 2-3, or 4+ reports.

The nearby endpoint uses the Haversine formula and returns an estimated walk time using `WALKING_SPEED_MPS` (default `1.4`). It is not route/navigation time. Crowd estimates and booking availability are separate systems.

Schema and seed files are in `db/schema.sql` and `db/seed.sql`. The database contains `users`, `locations`, and `crowd_reports`; crowd data is not stored on locations. JWT authentication is implemented for signup, login, and `/me`; continuous GPS tracking is not implemented.

Facility records are seeded for Library, Cafeteria, Volleyball Court, and Gym using existing location IDs. Slots are intentionally not seeded; facility admins create real date/time/capacity slots. Bookings use row-level transactions and a partial unique user/slot index for confirmed bookings to prevent overbooking and duplicate active bookings. Un-checked-in confirmed bookings are automatically cancelled five minutes after creation and release one slot capacity. Check-in QR values are random, stored only as SHA-256 hashes in `booking_checkin_tokens`, valid for five minutes, and atomically transition from `ACTIVE` to `USED` while the booking transitions to `CHECKED_IN`.
