# WhatsRoom Backend

Backend for the existing Expo frontend.

## Features

- `POST /api/rooms` create new room id
- `GET /api/rooms/:roomId` validate room id
- `GET /api/rooms/:roomId/messages?limit=120` fetch room history
- Socket.IO events:
  - `join-room` (ack)
  - `leave-room` (ack)
  - `send-message` (ack)
  - `typing`
  - server emits `receive-message`, `typing`, `online-users`
- MongoDB persistence for rooms and messages

## 1) Install and configure

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` if needed:

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/whatsroom
CORS_ORIGIN=*
ROOM_ID_LENGTH=8
MESSAGE_MAX_LENGTH=2000
```

## 2) Run backend

Make sure MongoDB is running first.

Quickest local option (Docker):

```bash
docker run -d --name whatsroom-mongo -p 27017:27017 mongo:7
```

Then start backend:

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:4000/health
```

## 3) Connect frontend

In `../.env` (frontend), point to your backend host/IP:

```env
API_BASE_URL=http://<YOUR_PC_LAN_IP>:4000
```

Then restart Expo frontend.

## 4) Deploy on Render (from GitHub)

This repo includes `../render.yaml` for easy deploy.

Required Render environment variables:

```env
MONGODB_URI=<your mongodb atlas uri>
CORS_ORIGIN=*
```

After deploy, use your Render backend URL in frontend `.env`:

```env
API_BASE_URL=https://<your-render-service>.onrender.com
```
