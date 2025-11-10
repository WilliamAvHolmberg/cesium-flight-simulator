import type {
  PreviewParams,
  RefineParams,
  ImageToModelParams,
  ImageRefineParams,
  TaskStatusResponse,
} from './types';

export class MeshyAPIService {
  private textTo3dBaseURL = '/api/meshy/text-to-3d';
  private imageTo3dBaseURL = '/api/meshy/image-to-3d';

  constructor(private apiKey: string) {}

  /**
   * Create a text-to-3D preview task (Stage 1: Generate base mesh)
   */
  async createPreviewTask(params: PreviewParams): Promise<string> {
    const response = await fetch(this.textTo3dBaseURL, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'preview',
        prompt: params.prompt,
        art_style: params.artStyle || 'realistic',
        negative_prompt: params.negativePrompt || '',
        should_remesh: params.shouldRemesh ?? true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `API Error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.result; // Task ID
  }

  /**
   * Create a text-to-3D refine task (Stage 2: Add textures)
   */
  async createRefineTask(params: RefineParams): Promise<string> {
    const response = await fetch(this.textTo3dBaseURL, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'refine',
        preview_task_id: params.previewTaskId,
        enable_pbr: params.enablePbr ?? true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `API Error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.result; // Task ID
  }

  /**
   * Create an image-to-3D task
   */
  async createImageTo3DTask(params: ImageToModelParams): Promise<string> {
    let body: any = {};
    let headers: Record<string, string> = {
      'x-api-key': this.apiKey,
    };

    // Handle file upload vs URL
    if (params.imageFile) {
      const formData = new FormData();
      formData.append('image', params.imageFile);
      if (params.aiModel) formData.append('ai_model', params.aiModel);
      if (params.shouldTexture !== undefined)
        formData.append('should_texture', String(params.shouldTexture));
      if (params.enablePbr !== undefined) formData.append('enable_pbr', String(params.enablePbr));

      const response = await fetch(this.imageTo3dBaseURL, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          // Don't set Content-Type, browser will set it with boundary for multipart/form-data
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || `API Error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.result; // Task ID
    } else if (params.imageUrl) {
      // Use JSON for URL-based requests
      body.image_url = params.imageUrl;
      if (params.aiModel) body.ai_model = params.aiModel;
      if (params.shouldTexture !== undefined) body.should_texture = params.shouldTexture;
      if (params.enablePbr !== undefined) body.enable_pbr = params.enablePbr;

      headers['Content-Type'] = 'application/json';

      const response = await fetch(this.imageTo3dBaseURL, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || `API Error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.result; // Task ID
    } else {
      throw new Error('Either imageFile or imageUrl must be provided');
    }
  }

  /**
   * Poll task status (works for both text-to-3D and image-to-3D)
   */
  async getTaskStatus(taskId: string, mode: 'text-to-3d' | 'image-to-3d' = 'text-to-3d'): Promise<TaskStatusResponse> {
    const baseURL = mode === 'image-to-3d' ? this.imageTo3dBaseURL : this.textTo3dBaseURL;
    const response = await fetch(`${baseURL}/${taskId}`, {
      headers: {
        'x-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `API Error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  }

  /**
   * Wait for task completion with polling
   */
  async waitForCompletion(
    taskId: string,
    mode: 'text-to-3d' | 'image-to-3d' = 'text-to-3d',
    onProgress?: (progress: number) => void,
    pollInterval = 5000,
    timeout = 600000 // 10 minutes
  ): Promise<TaskStatusResponse> {
    const startTime = Date.now();

    while (true) {
      // Check timeout
      if (Date.now() - startTime > timeout) {
        throw new Error('Task timeout - generation took too long');
      }

      const status = await this.getTaskStatus(taskId, mode);

      // Update progress callback
      if (onProgress) {
        onProgress(status.progress);
      }

      // Check if completed
      if (status.status === 'SUCCEEDED') {
        return status;
      }

      // Check if failed
      if (status.status === 'FAILED') {
        throw new Error(
          `Task failed: ${status.task_error?.message || 'Unknown error'}`
        );
      }

      if (status.status === 'CANCELED') {
        throw new Error('Task was canceled');
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  /**
   * Download model file via proxy (to avoid CORS)
   */
  async downloadModel(url: string): Promise<ArrayBuffer> {
    // Use our proxy endpoint to download the model
    const proxyUrl = `/api/meshy/download?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`Failed to download model: ${response.status}`);
    }

    return await response.arrayBuffer();
  }

  /**
   * Test API key validity
   */
  async testApiKey(): Promise<boolean> {
    try {
      // Try to create a dummy request to test authentication
      const response = await fetch(`${this.textTo3dBaseURL}/test`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      // Even if endpoint doesn't exist, 401 means bad auth, anything else means auth worked
      return response.status !== 401;
    } catch {
      return false;
    }
  }
}
