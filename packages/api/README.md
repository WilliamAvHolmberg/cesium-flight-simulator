# MeshyAI Proxy API Server

Lightweight Express.js proxy server to handle MeshyAI API requests and avoid CORS issues.

## Why This Exists

MeshyAI's asset download URLs don't include CORS headers, which blocks direct browser downloads. This proxy server:

1. **Proxies MeshyAI API calls** - Forwards text-to-3D task creation and status polling
2. **Downloads models** - Fetches GLB files from MeshyAI's CDN and streams them to the client
3. **Avoids CORS** - Since the proxy runs on the server, CORS doesn't apply

## Architecture

```
Frontend (React)
    ↓ /api/meshy/text-to-3d (via Vite proxy)
    ↓
Express Server (localhost:3001)
    ↓ https://api.meshy.ai/v2/text-to-3d
    ↓
MeshyAI API
```

## Endpoints

### `POST /api/meshy/text-to-3d`
Create preview or refine task.

**Headers:**
- `x-api-key: string` - MeshyAI API key

**Body:**
```json
{
  "mode": "preview" | "refine",
  "prompt": "helicopter with dinosaur",
  "art_style": "realistic",
  "negative_prompt": "",
  "should_remesh": true,
  "preview_task_id": "abc123" // Only for refine mode
}
```

**Response:**
```json
{
  "result": "task-id-123"
}
```

### `GET /api/meshy/text-to-3d/:taskId`
Poll task status.

**Headers:**
- `x-api-key: string` - MeshyAI API key

**Response:**
```json
{
  "id": "task-id-123",
  "status": "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED",
  "progress": 67,
  "model_urls": {
    "glb": "https://assets.meshy.ai/...",
    "fbx": "https://assets.meshy.ai/...",
    ...
  },
  "thumbnail_url": "https://...",
  ...
}
```

### `GET /api/meshy/download?url=...`
Download model file (CORS proxy).

**Query Parameters:**
- `url: string` - Encoded URL to download

**Response:**
- Binary data (GLB file)
- Content-Type: application/octet-stream

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-06T12:34:56.789Z"
}
```

## Running

### Development
```bash
npm run dev
```

Server starts on `http://localhost:3001`

### Production
```bash
npm start
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |

## Integration with Frontend

The Vite dev server proxies `/api` requests to this Express server:

```javascript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

Frontend calls `/api/meshy/*` which gets forwarded to `http://localhost:3001/api/meshy/*`.

## Security Considerations

⚠️ **This is a proof-of-concept server with NO authentication!**

For production:
- [ ] Add API key validation
- [ ] Rate limiting
- [ ] Request/response logging
- [ ] Error monitoring (Sentry, etc.)
- [ ] Input validation/sanitization
- [ ] HTTPS enforcement
- [ ] Environment-based CORS config

## Dependencies

- `express` - Web framework
- `cors` - CORS middleware

## Files

```
packages/api/
├── src/
│   └── server.js       # Main Express server
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## Troubleshooting

### "Cannot find module 'express'"
**Solution:** Run `npm install` in `packages/api`

### "EADDRINUSE: address already in use"
**Solution:** Port 3001 is already in use. Kill the process or change PORT env var.

### "API Error: 401"
**Solution:** Invalid MeshyAI API key. Check the key in the frontend.

### Download fails with "Failed to fetch"
**Solution:**
- Check the Express server is running on port 3001
- Check Vite proxy config is correct
- Check the asset URL is valid

## Future Enhancements

- [ ] Add request caching (Redis)
- [ ] Add webhook support for async notifications
- [ ] Add batch download support
- [ ] Add model conversion (GLB → other formats)
- [ ] Add storage integration (S3, etc.)
- [ ] Add user authentication
- [ ] Add rate limiting per user
- [ ] Add analytics/metrics
