# Stream Overlay

Run the overlay and admin server with Docker:

```sh
docker compose up --build
```

Open:

- Overlay: http://localhost:3001
- Admin controls: http://localhost:3001/admin

Progress is stored in a Docker volume named `stream-overlay_overlay-data`.
