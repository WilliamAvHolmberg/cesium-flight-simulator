import type { GeneratedModel } from './types';

export class ModelCacheService {
  private dbName = 'cesium-flight-sim-models';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store for models
        if (!db.objectStoreNames.contains('models')) {
          const store = db.createObjectStore('models', { keyPath: 'id' });
          store.createIndex('createdAt', 'metadata.createdAt', { unique: false });
          store.createIndex('tags', 'tags', { multiEntry: true });
          store.createIndex('isFavorite', 'isFavorite', { unique: false });
          console.log('Created models object store with indexes');
        }
      };
    });
  }

  /**
   * Ensure DB is initialized
   */
  private ensureDb(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  /**
   * Save a model to the cache
   */
  async saveModel(model: GeneratedModel): Promise<void> {
    const db = this.ensureDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('models', 'readwrite');
      const store = tx.objectStore('models');
      const request = store.put(model);

      request.onsuccess = () => {
        console.log('Model saved to cache:', model.id);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save model:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all models from the cache
   */
  async getAllModels(): Promise<GeneratedModel[]> {
    const db = this.ensureDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('models', 'readonly');
      const store = tx.objectStore('models');
      const request = store.getAll();

      request.onsuccess = () => {
        const models = request.result as GeneratedModel[];
        console.log(`Loaded ${models.length} models from cache`);
        resolve(models);
      };

      request.onerror = () => {
        console.error('Failed to load models:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get a single model by ID
   */
  async getModel(id: string): Promise<GeneratedModel | undefined> {
    const db = this.ensureDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('models', 'readonly');
      const store = tx.objectStore('models');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result as GeneratedModel | undefined);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Delete a model from the cache
   */
  async deleteModel(id: string): Promise<void> {
    const db = this.ensureDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('models', 'readwrite');
      const store = tx.objectStore('models');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('Model deleted from cache:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete model:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Update model favorite status
   */
  async toggleFavorite(id: string): Promise<void> {
    const model = await this.getModel(id);
    if (!model) {
      throw new Error(`Model not found: ${id}`);
    }

    model.isFavorite = !model.isFavorite;
    await this.saveModel(model);
  }

  /**
   * Search models by tags
   */
  async searchByTag(tag: string): Promise<GeneratedModel[]> {
    const db = this.ensureDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('models', 'readonly');
      const store = tx.objectStore('models');
      const index = store.index('tags');
      const request = index.getAll(tag);

      request.onsuccess = () => {
        resolve(request.result as GeneratedModel[]);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get favorite models
   */
  async getFavorites(): Promise<GeneratedModel[]> {
    const allModels = await this.getAllModels();
    return allModels.filter((model) => model.isFavorite);
  }

  /**
   * Clear all models from cache
   */
  async clearAll(): Promise<void> {
    const db = this.ensureDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('models', 'readwrite');
      const store = tx.objectStore('models');
      const request = store.clear();

      request.onsuccess = () => {
        console.log('All models cleared from cache');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to clear cache:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get total storage size (approximate)
   */
  async getStorageSize(): Promise<number> {
    const models = await this.getAllModels();
    return models.reduce((total, model) => total + model.metadata.fileSize, 0);
  }

  /**
   * Get storage size in human-readable format
   */
  async getStorageSizeFormatted(): Promise<string> {
    const bytes = await this.getStorageSize();
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${mb.toFixed(2)} MB`;
  }
}

// Export singleton instance
export const modelCache = new ModelCacheService();
