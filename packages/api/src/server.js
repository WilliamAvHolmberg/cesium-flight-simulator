import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
    }
  },
});

// MeshyAI API base URLs
const MESHY_TEXT_TO_3D_BASE = 'https://api.meshy.ai/v2/text-to-3d';
const MESHY_IMAGE_TO_3D_BASE = 'https://api.meshy.ai/v2/image-to-3d';

/**
 * Helper function to forward requests to MeshyAI API
 */
async function forwardToMeshy(method, path, body, apiKey, baseUrl = MESHY_TEXT_TO_3D_BASE) {
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;

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
 * POST /api/meshy/image-to-3d
 * Create image-to-3D task (with file upload or image URL)
 */
app.post('/api/meshy/image-to-3d', upload.single('image'), async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ error: 'Missing x-api-key header' });
    }

    let body = {};

    // Check if a file was uploaded
    if (req.file) {
      // Convert file to base64 data URI
      const base64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      body.image_url = `data:${mimeType};base64,${base64}`;
    } else if (req.body.image_url) {
      // Use provided image URL
      body.image_url = req.body.image_url;
    } else {
      return res.status(400).json({ error: 'No image file or image_url provided' });
    }

    // Add other optional parameters
    if (req.body.ai_model) body.ai_model = req.body.ai_model;
    if (req.body.should_texture !== undefined) body.should_texture = req.body.should_texture;
    if (req.body.enable_pbr !== undefined) body.enable_pbr = req.body.enable_pbr;

    const data = await forwardToMeshy('POST', '', body, apiKey, MESHY_IMAGE_TO_3D_BASE);
    res.json(data);
  } catch (error) {
    console.error('Error creating image-to-3D task:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/meshy/image-to-3d/:taskId
 * Get image-to-3D task status
 */
app.get('/api/meshy/image-to-3d/:taskId', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ error: 'Missing x-api-key header' });
    }

    const { taskId } = req.params;
    const data = await forwardToMeshy('GET', `/${taskId}`, null, apiKey, MESHY_IMAGE_TO_3D_BASE);
    res.json(data);
  } catch (error) {
    console.error('Error getting image-to-3D task status:', error);
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
  console.log(`📡 Proxying text-to-3D requests to: ${MESHY_TEXT_TO_3D_BASE}`);
  console.log(`📡 Proxying image-to-3D requests to: ${MESHY_IMAGE_TO_3D_BASE}`);
});
