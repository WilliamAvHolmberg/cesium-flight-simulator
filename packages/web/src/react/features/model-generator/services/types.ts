// MeshyAI API Types

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';

export type ArtStyle = 'realistic' | 'sculpture' | 'cartoon' | 'low-poly' | 'pbr';

export type GenerationStage = 'preview' | 'refining' | 'downloading' | 'completed';

export interface PreviewParams {
  prompt: string;
  artStyle?: ArtStyle;
  negativePrompt?: string;
  shouldRemesh?: boolean;
  enablePbr?: boolean;
}

export interface RefineParams extends PreviewParams {
  previewTaskId: string;
}

export interface TaskStatusResponse {
  id: string;
  status: TaskStatus;
  progress: number;
  model_urls?: {
    glb?: string;
    fbx?: string;
    obj?: string;
    usdz?: string;
    mtl?: string;
  };
  thumbnail_url?: string;
  texture_urls?: {
    base_color?: string;
    metallic?: string;
    normal?: string;
    roughness?: string;
  };
  created_at: number;
  started_at?: number;
  finished_at?: number;
  task_error?: {
    message: string;
    code: string;
  };
}

export interface GenerationTask {
  id: string;
  prompt: string;
  artStyle: ArtStyle;
  status: GenerationStage;
  progress: number;
  previewTaskId?: string;
  refineTaskId?: string;
  thumbnailUrl?: string;
  modelUrl?: string;
  createdAt: Date;
  error?: string;
}

export interface GeneratedModel {
  id: string;
  prompt: string;
  artStyle: ArtStyle;
  thumbnailUrl: string;
  modelUrl: string;
  glbData: ArrayBuffer;
  metadata: {
    createdAt: Date;
    fileSize: number;
    previewTaskId: string;
    refineTaskId: string;
    credits: number;
  };
  tags: string[];
  isFavorite: boolean;
}

export interface GenerateModelParams {
  prompt: string;
  artStyle?: ArtStyle;
  negativePrompt?: string;
  enablePbr?: boolean;
  shouldRemesh?: boolean;
}
