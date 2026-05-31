# Starlink Giveaway

This app runs a Starlink giveaway registration and admin draw flow for an event.
Visitors register with contact details, receive an SMS confirmation, and are added
to the active raffle wheel. Admins can review participants, run the wheel, confirm
a winner, and send the winner SMS.

## App Flow

1. A visitor opens the public registration page.
2. The visitor submits name, company, phone, email, interest, and consent.
3. The backend stores the participant with an active raffle status.
4. If automatic SMS is enabled, the backend sends or records the registration SMS.
5. The participant appears in the admin participants table and the draw wheel.
6. An admin opens the draw page and spins the wheel.
7. When the admin confirms the winner, the backend creates a winner record.
8. The backend sends or records the winner SMS.
9. The winner is removed from the active wheel list and appears in the winners page.

Duplicate winner confirmation is handled idempotently, so a retry or double-click
does not create duplicate winner records or duplicate winner SMS records.

## Local Setup

Use Node 20 for best compatibility with the backend engine range.

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd backend
npm install
```

Create the backend environment file:

```bash
copy backend\.env.example backend\.env
```

Edit `backend/.env` with local values. Do not commit `backend/.env`.

Run the backend in one terminal:

```bash
cd backend
npm run dev
```

Run the frontend in another terminal:

```bash
npm run dev
```

Open the local frontend URL shown by Vite, usually:

```text
http://localhost:5173
```

The frontend proxies `/api` requests to the backend on `http://localhost:3001`.
The backend allows local `localhost` and `127.0.0.1` origins for development.

## Backend Environment

Set these in `backend/.env` for local testing, and in the backend hosting provider
for production:

```env
PORT=3001
JWT_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
FRONTEND_URL=http://localhost:5173
SMS4FREE_KEY=
SMS4FREE_USER=
SMS4FREE_PASS=
SMS_SENDER=SpotNet
SMS_DRY_RUN=true
SKIP_SEED=true
DB_PATH=
```

Important variables:

- `JWT_SECRET`: secret used to sign admin tokens.
- `ADMIN_EMAIL`: admin login email.
- `ADMIN_PASSWORD`: admin login password. Store this as a secret in production.
- `FRONTEND_URL`: deployed frontend origin, for CORS in production.
- `SMS4FREE_KEY`: API key from sms4free.co.il.
- `SMS4FREE_USER`: login phone number (e.g. `0549728321`).
- `SMS4FREE_PASS`: SMS4FREE account password.
- `SMS_SENDER`: sender name shown to recipients (e.g. `SpotNet`). With free credits only, use your registered phone number.
- `SMS_DRY_RUN`: set to `true` only for local/testing mock SMS. It records SMS without contacting SMS4FREE.
- `SKIP_SEED`: set to `true` for a clean database without mock participants.
- `DB_PATH`: optional SQLite database path, useful for persistent hosting disks.

For production SMS sending, set all `SMS4FREE_*` variables, leave `SMS_DRY_RUN` unset or
set it to `false`, and verify sender number in the SMS4FREE dashboard.

## Why SMS Can Fail

SMS sending can fail when:

- `SMS4FREE_KEY`, `SMS4FREE_USER`, or `SMS4FREE_PASS` is missing or invalid.
- The SMS4FREE account has no remaining quota.
- The sender name/number is not verified (error `-6`).
- The phone number is invalid or mistyped.
- SMS4FREE or the network is temporarily unavailable.
- The selected audience resolves to zero recipients.
- Local testing uses `SMS_DRY_RUN=true`, which intentionally records instead of sending.

When SMS fails, the app records the SMS status as `נכשל` instead of pretending it
was sent.

## Tests And Build

Run backend flow regression tests:

```bash
cd backend
npm run test:flow
```

Run the frontend production build:

```bash
npm run build
```

The flow test covers registration SMS recording, missing-key failure behavior,
local CORS, winner SMS recording, winner removal from the active wheel, and
duplicate winner confirmation protection.

## Files That Must Stay Private

Never commit real environment files or local database files:

- `backend/.env`
- `.env`
- `data/`
- `*.db`
- `*.db-shm`
- `*.db-wal`

These are ignored by Git in this repository.
