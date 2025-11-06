import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MeshyAI API base URL
const MESHY_API_BASE = 'https://api.meshy.ai/v2/text-to-3d';

/**
 * Helper function to forward requests to MeshyAI API
 */
async function forwardToMeshy(method, path, body, apiKey) {
  const url = path.startsWith('http') ? path : `${MESHY_API_BASE}${path}`;

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MeshyAI API error: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * POST /api/meshy/text-to-3d
 * Create preview or refine task
 */
app.post('/api/meshy/text-to-3d', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ error: 'Missing x-api-key header' });
    }

    const data = await forwardToMeshy('POST', '', req.body, apiKey);
    res.json(data);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/meshy/text-to-3d/:taskId
 * Get task status
 */
app.get('/api/meshy/text-to-3d/:taskId', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ error: 'Missing x-api-key header' });
    }

    const { taskId } = req.params;
    const data = await forwardToMeshy('GET', `/${taskId}`, null, apiKey);
    res.json(data);
  } catch (error) {
    console.error('Error getting task status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/meshy/download
 * Proxy download requests to avoid CORS
 */
app.get('/api/meshy/download', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    console.log('Proxying download request:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    // Get the content type and buffer
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    // Set headers and send the buffer
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.byteLength);
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MeshyAI Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying requests to: ${MESHY_API_BASE}`);
});
