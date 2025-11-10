// MeshyAI API Types

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';

export type ArtStyle = 'realistic' | 'sculpture';

export type GenerationStage = 'preview' | 'refining' | 'downloading' | 'completed';

export interface PreviewParams {
  prompt: string;
  artStyle?: ArtStyle;
  negativePrompt?: string;
  shouldRemesh?: boolean;
  enablePbr?: boolean;
}

export interface ImageToModelParams {
  imageFile?: File;
  imageUrl?: string;
  aiModel?: 'latest' | 'meshy-4';
  shouldTexture?: boolean;
  enablePbr?: boolean;
}

export interface RefineParams extends PreviewParams {
  previewTaskId: string;
}

export interface ImageRefineParams {
  previewTaskId: string;
  enablePbr?: boolean;
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
  mode: 'text-to-3d' | 'image-to-3d';
  prompt: string;
  imagePreview?: string; // base64 or URL for image mode
  artStyle?: ArtStyle; // Only for text-to-3d
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
  mode: 'text-to-3d' | 'image-to-3d';
  prompt: string;
  imagePreview?: string; // For image-to-3d mode
  artStyle?: ArtStyle; // For text-to-3d mode
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
  mode: 'text-to-3d' | 'image-to-3d';
  // Text-to-3D params
  prompt?: string;
  artStyle?: ArtStyle;
  negativePrompt?: string;
  shouldRemesh?: boolean;
  // Image-to-3D params
  imageFile?: File;
  imageUrl?: string;
  aiModel?: 'latest' | 'meshy-4';
  shouldTexture?: boolean;
  // Common params
  enablePbr?: boolean;
}
