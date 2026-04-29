# Open Meeting

Open Meeting is a Discord-inspired full-stack platform with real-time chat, presence, channels, and WebRTC signaling for voice/video/screen-share workflows.

## Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express 5 + Prisma 6 + PostgreSQL |
| Frontend | React 19 + Redux Toolkit + Vite 8 |
| Realtime | Socket.IO 4 (+ optional Redis adapter for horizontal scaling) |
| Calls | WebRTC — offer/answer/ICE signaling over Socket.IO |
| Auth | JWT access tokens (15m) + refresh tokens (7d, SHA-256 hashed) |
| Uploads | Multer — local disk (`UPLOAD_MODE=local`) or AWS S3 / compatible (`UPLOAD_MODE=s3`) |
| Deployment | Docker + docker-compose (postgres + redis + backend + nginx-frontend) |
| CI | GitHub Actions — syntax check + integration tests + production build |

## Folder Structure

- `backend/` — REST API, Prisma schema, Socket.IO signaling layer, integration tests
- `frontend/` — React client with Discord-like 3-panel layout
- `docs/` — Postman collection + Socket.IO event reference
- `.github/workflows/ci.yml` — CI pipeline
- `docker-compose.yml` — Multi-service local deployment

## Quick Start (Local)

1. Install dependencies:
   ```sh
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. Configure env files:
   ```sh
   copy backend/.env.example backend/.env   # Windows
   cp backend/.env.example backend/.env     # macOS/Linux
   copy frontend/.env.example frontend/.env
   ```
3. Edit `backend/.env` — set `DATABASE_URL` and JWT secrets (minimum 32 chars).
4. Generate Prisma client and push schema:
   ```sh
   cd backend && npx prisma generate && npx prisma db push
   ```
5. Start the app:
   ```sh
   cd backend && npm run dev
   cd frontend && npm run dev
   ```

## Docker Deployment

```sh
docker compose up --build
```

Services:
- `postgres` — PostgreSQL 16 on port 5432
- `redis` — Redis 7 on port 6379
- `backend` — Node.js API on port 4000
- `frontend` — Nginx-served React app on port 8080

Create `backend/.env` from `.env.example` before running. The compose file injects `DATABASE_URL` and `REDIS_URL` automatically.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✓ | — | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | ✓ | — | Min 32-char random string |
| `JWT_REFRESH_SECRET` | ✓ | — | Min 32-char random string |
| `CLIENT_ORIGIN` | ✓ | — | Frontend origin for CORS |
| `PORT` | | 4000 | HTTP port |
| `UPLOAD_MODE` | | `local` | `local` or `s3` |
| `AWS_S3_BUCKET` | S3 only | — | Bucket name |
| `AWS_REGION` | S3 only | — | e.g. `us-east-1` |
| `AWS_ACCESS_KEY_ID` | S3 only | — | IAM key (or leave blank for instance role) |
| `AWS_SECRET_ACCESS_KEY` | S3 only | — | IAM secret |
| `AWS_S3_ENDPOINT` | | — | Custom endpoint (e.g. MinIO) |
| `AWS_CDN_BASE_URL` | | — | CloudFront / CDN base URL override |
| `REDIS_URL` | | — | Redis connection string (enables Socket.IO cluster mode) |
| `WEBRTC_STUN_URLS` | | Google STUN | Comma-separated STUN URLs |
| `WEBRTC_TURN_URLS` | | — | Comma-separated TURN URLs |
| `WEBRTC_TURN_USERNAME` | | — | TURN username |
| `WEBRTC_TURN_CREDENTIAL` | | — | TURN credential |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:4000/api` | Backend REST base URL |
| `VITE_SOCKET_URL` | `http://localhost:4000` | Socket.IO server URL |

## Notable Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register user |
| `POST` | `/api/auth/login` | Login, return tokens |
| `POST` | `/api/auth/refresh` | Rotate refresh token |
| `POST` | `/api/auth/logout` | Invalidate refresh token |
| `GET` | `/api/users/me` | Current user profile |
| `GET/POST` | `/api/servers` | List/create servers |
| `GET/POST` | `/api/servers/:id/channels` | List/create channels |
| `GET/POST` | `/api/chat/:channelId/messages` | Channel message history/create |
| `POST` | `/api/uploads` | Upload file (local or S3) |
| `GET` | `/api/rtc/config` | Dynamic ICE/TURN server list (authenticated) |
| `GET` | `/api-docs` | Swagger UI |
| `GET` | `/api/health` | Health check |

## Testing

```sh
cd backend && npm test
```

Requires a running PostgreSQL instance (see `.env` setup above). The test suite uses Node.js built-in `node:test` + supertest to cover register, login, token refresh, logout, server creation, and the RTC config endpoint.

## WebRTC Architecture

All signaling is server-mediated via Socket.IO:

```
Caller                Server               Callee
  |-- webrtc:offer -->  |-- webrtc:offer --> |
  |                     |                    |
  |<-- webrtc:answer -- | <-- webrtc:answer -|
  |                     |                    |
  |<- webrtc:ice-cand - | <- webrtc:ice-cand-|
```

ICE server config (STUN + optional TURN) is fetched from `GET /api/rtc/config` at call start so credentials are never embedded in client code.

## Redis Scaling

When `REDIS_URL` is set, Socket.IO uses the `@socket.io/redis-adapter` to synchronise events across multiple backend instances. If Redis is unreachable at startup the server falls back to the in-memory adapter with a console warning.

## File Uploads & Media

- Upload endpoint: `POST /api/uploads` (multipart/form-data, max 25 MB)
- Chat renderer auto-detects image/video URLs and renders inline previews
- Switch to S3-compatible storage with `UPLOAD_MODE=s3` + S3 env vars
4. Run database migration + Prisma client generation:
   - `cd backend`
   - `npx prisma migrate dev --name init`
   - `npx prisma generate`
5. Start backend:
   - `npm run dev`
6. Start frontend:
   - `cd ../frontend`
   - `npm run dev`

Frontend runs on `http://localhost:5173`, backend on `http://localhost:4000`.

## Quick Start (Docker)

1. Create env files from examples as above.
2. Ensure `backend/.env` uses:
   - `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/openmeeting`
3. Build and run:
   - `docker compose up --build`
4. Open frontend at `http://localhost:8080`.

## API Docs

- Swagger UI: `http://localhost:4000/api-docs`
- Base API: `http://localhost:4000/api`
- Postman collection: `docs/postman_collection.json`

## Implemented Features

- JWT auth (register/login/refresh/logout)
- Profile management (`/users/me`)
- Server and channel creation
- Channel messaging with edit/delete/reactions/read receipts
- DM conversation and messages
- Presence updates (`user:online`, `user:offline`)
- Typing indicator (`user:typing`)
- WebRTC signaling events (`webrtc:offer`, `webrtc:answer`, `webrtc:ice-candidate`)
- File upload endpoint (`/api/uploads`)
- Rate limiting, CORS, Helmet, Zod validation, centralized error handling
- Lazy-loaded frontend routes and responsive UI

## Production Notes

- Replace local uploads with S3 integration in upload service.
- Add TURN credentials for NAT traversal in production.
- Add Redis adapter for Socket.IO horizontal scaling.
- Add background jobs for notifications and media processing.
- Add end-to-end tests and CI pipeline gates.
