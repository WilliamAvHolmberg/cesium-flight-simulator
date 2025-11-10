import { useState, useCallback } from 'react';
import { MeshyAPIService } from '../services/meshyApi';
import type { GenerateModelParams, GeneratedModel, GenerationTask } from '../services/types';
import { generateId, extractTags } from '../utils/modelUtils';
import { useGeneration } from '../context/GenerationContext';

export function useModelGenerator() {
  const { apiKey, addTask, updateTask, removeTask, addModel } = useGeneration();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateModel = useCallback(
    async (params: GenerateModelParams): Promise<GeneratedModel | null> => {
      if (!apiKey) {
        setError('API key not set');
        return null;
      }

      setIsGenerating(true);
      setError(null);

      const taskId = generateId();
      const meshyApi = new MeshyAPIService(apiKey);

      // Handle image preview for UI
      let imagePreview: string | undefined;
      if (params.mode === 'image-to-3d' && params.imageFile) {
        imagePreview = URL.createObjectURL(params.imageFile);
      } else if (params.mode === 'image-to-3d' && params.imageUrl) {
        imagePreview = params.imageUrl;
      }

      // Create initial task
      const task: GenerationTask = {
        id: taskId,
        mode: params.mode,
        prompt: params.mode === 'text-to-3d' ? params.prompt! : 'Image-to-3D Generation',
        imagePreview,
        artStyle: params.mode === 'text-to-3d' ? (params.artStyle || 'realistic') : undefined,
        status: 'preview',
        progress: 0,
        createdAt: new Date(),
      };

      addTask(task);

      try {
        // Route to appropriate generation method
        if (params.mode === 'text-to-3d') {
          return await generateTextTo3D(params, taskId, meshyApi);
        } else {
          return await generateImageTo3D(params, taskId, meshyApi, imagePreview);
        }
      } catch (err) {
        console.error('Model generation failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        updateTask(taskId, {
          error: errorMessage,
        });

        // Remove failed task after 10 seconds
        setTimeout(() => {
          removeTask(taskId);
        }, 10000);

        setIsGenerating(false);
        return null;
      }
    },
    [apiKey, addTask, updateTask, removeTask, addModel]
  );

  const generateTextTo3D = useCallback(
    async (params: GenerateModelParams, taskId: string, meshyApi: MeshyAPIService): Promise<GeneratedModel | null> => {
      try {
        // Stage 1: Create preview
        console.log('Starting preview generation...');
        updateTask(taskId, { status: 'preview', progress: 0 });

        const previewTaskId = await meshyApi.createPreviewTask({
          prompt: params.prompt!,
          artStyle: params.artStyle,
          negativePrompt: params.negativePrompt,
          shouldRemesh: params.shouldRemesh,
        });

        updateTask(taskId, { previewTaskId });

        // Wait for preview completion
        const previewResult = await meshyApi.waitForCompletion(
          previewTaskId,
          'text-to-3d',
          (progress) => {
            // Preview is 0-40% of total progress
            updateTask(taskId, { progress: Math.round(progress * 0.4) });
          }
        );

        console.log('Preview completed, starting refine...');

        // Stage 2: Create refine task
        updateTask(taskId, { status: 'refining', progress: 40 });

        const refineTaskId = await meshyApi.createRefineTask({
          prompt: params.prompt!,
          artStyle: params.artStyle,
          previewTaskId,
          enablePbr: params.enablePbr,
        });

        updateTask(taskId, { refineTaskId });

        // Wait for refine completion
        const refineResult = await meshyApi.waitForCompletion(
          refineTaskId,
          'text-to-3d',
          (progress) => {
            // Refine is 40-90% of total progress
            updateTask(taskId, { progress: Math.round(40 + progress * 0.5) });
          }
        );

        console.log('Refine completed, downloading model...');

        // Stage 3: Download model
        updateTask(taskId, { status: 'downloading', progress: 90 });

        if (!refineResult.model_urls?.glb) {
          throw new Error('No GLB model URL in response');
        }

        const glbData = await meshyApi.downloadModel(refineResult.model_urls.glb);

        console.log('Model downloaded, saving to cache...');

        // Stage 4: Create model object and save
        const model: GeneratedModel = {
          id: taskId,
          mode: 'text-to-3d',
          prompt: params.prompt!,
          artStyle: params.artStyle || 'realistic',
          thumbnailUrl: refineResult.thumbnail_url || '',
          modelUrl: URL.createObjectURL(new Blob([glbData])),
          glbData,
          metadata: {
            createdAt: new Date(),
            fileSize: glbData.byteLength,
            previewTaskId,
            refineTaskId,
            credits: 20, // Approximate cost
          },
          tags: extractTags(params.prompt!),
          isFavorite: false,
        };

        await addModel(model);

        // Update task to completed
        updateTask(taskId, {
          status: 'completed',
          progress: 100,
          thumbnailUrl: model.thumbnailUrl,
          modelUrl: model.modelUrl,
        });

        console.log('Text-to-3D generation complete!');

        // Remove task after 5 seconds
        setTimeout(() => {
          removeTask(taskId);
        }, 5000);

        setIsGenerating(false);
        return model;
      } catch (err) {
        setIsGenerating(false);
        throw err;
      }
    },
    [addTask, updateTask, removeTask, addModel]
  );

  const generateImageTo3D = useCallback(
    async (params: GenerateModelParams, taskId: string, meshyApi: MeshyAPIService, imagePreview?: string): Promise<GeneratedModel | null> => {
      try {
        // Image-to-3D is typically a single-stage process
        console.log('Starting image-to-3D generation...');
        updateTask(taskId, { status: 'preview', progress: 0 });

        const imageTaskId = await meshyApi.createImageTo3DTask({
          imageFile: params.imageFile,
          imageUrl: params.imageUrl,
          aiModel: params.aiModel || 'latest',
          shouldTexture: params.shouldTexture ?? true,
          enablePbr: params.enablePbr ?? true,
        });

        updateTask(taskId, { previewTaskId: imageTaskId });

        // Wait for completion
        const result = await meshyApi.waitForCompletion(
          imageTaskId,
          'image-to-3d',
          (progress) => {
            // 0-90% for generation
            updateTask(taskId, { progress: Math.round(progress * 0.9) });
          }
        );

        console.log('Image-to-3D completed, downloading model...');

        // Download model
        updateTask(taskId, { status: 'downloading', progress: 90 });

        if (!result.model_urls?.glb) {
          throw new Error('No GLB model URL in response');
        }

        const glbData = await meshyApi.downloadModel(result.model_urls.glb);

        console.log('Model downloaded, saving to cache...');

        // Create model object and save
        const model: GeneratedModel = {
          id: taskId,
          mode: 'image-to-3d',
          prompt: 'Image-to-3D Generation',
          imagePreview,
          thumbnailUrl: result.thumbnail_url || '',
          modelUrl: URL.createObjectURL(new Blob([glbData])),
          glbData,
          metadata: {
            createdAt: new Date(),
            fileSize: glbData.byteLength,
            previewTaskId: imageTaskId,
            refineTaskId: imageTaskId, // Same task for image-to-3D
            credits: 15, // Approximate cost
          },
          tags: ['image-to-3d'],
          isFavorite: false,
        };

        await addModel(model);

        // Update task to completed
        updateTask(taskId, {
          status: 'completed',
          progress: 100,
          thumbnailUrl: model.thumbnailUrl,
          modelUrl: model.modelUrl,
        });

        console.log('Image-to-3D generation complete!');

        // Remove task after 5 seconds
        setTimeout(() => {
          removeTask(taskId);
        }, 5000);

        setIsGenerating(false);
        return model;
      } catch (err) {
        setIsGenerating(false);
        throw err;
      }
    },
    [addTask, updateTask, removeTask, addModel]
  );

  return {
    generateModel,
    isGenerating,
    error,
  };
}
