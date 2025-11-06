import type {
  PreviewParams,
  RefineParams,
  TaskStatusResponse,
} from './types';

export class MeshyAPIService {
  private baseURL = '/api/meshy/text-to-3d';

  constructor(private apiKey: string) {}

  /**
   * Create a preview task (Stage 1: Generate base mesh)
   */
  async createPreviewTask(params: PreviewParams): Promise<string> {
    const response = await fetch(this.baseURL, {
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
   * Create a refine task (Stage 2: Add textures)
   */
  async createRefineTask(params: RefineParams): Promise<string> {
    const response = await fetch(this.baseURL, {
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
   * Poll task status
   */
  async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    const response = await fetch(`${this.baseURL}/${taskId}`, {
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

      const status = await this.getTaskStatus(taskId);

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
      const response = await fetch(`${this.baseURL}/test`, {
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
