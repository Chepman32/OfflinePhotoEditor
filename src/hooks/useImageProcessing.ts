import { useState, useCallback, useRef } from 'react';
import { imageProcessor, ImageOperation, ProcessingResult } from '../services/imageProcessor';
import { useErrorHandler } from '../utils/errorHandler';

export interface ImageProcessingOptions {
  quality?: number;
  format?: 'jpeg' | 'png';
  generateThumbnail?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

export interface BatchProcessingOptions {
  quality?: number;
  format?: 'jpeg' | 'png';
  onProgress?: (completed: number, total: number) => void;
}

export const useImageProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState<string>('');
  const { handleError } = useErrorHandler();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Process single image
  const processImage = useCallback(async (
    imageUri: string,
    operations: ImageOperation[],
    options: ImageProcessingOptions = {}
  ): Promise<ProcessingResult | null> => {
    try {
      setIsProcessing(true);
      setProgress(0);
      setCurrentOperation('Initializing...');

      const result = await imageProcessor.processImage(imageUri, operations, {
        ...options,
        onProgress: (progressValue) => {
          setProgress(progressValue);
          setCurrentOperation(`Processing... ${Math.round(progressValue)}%`);
        },
      });

      setCurrentOperation('Complete');
      setProgress(100);

      return result;
    } catch (error) {
      handleError(error, { context: 'imageProcessing', imageUri, operations });
      return null;
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
        setCurrentOperation('');
      }, 1000);
    }
  }, [handleError]);

  // Process multiple images in batch
  const processBatch = useCallback(async (
    images: Array<{ uri: string; operations: ImageOperation[] }>,
    options: BatchProcessingOptions = {}
  ): Promise<ProcessingResult[]> => {
    try {
      setIsProcessing(true);
      setProgress(0);
      setCurrentOperation('Processing batch...');

      const results = await imageProcessor.processBatch(images, {
        ...options,
        onProgress: (completed, total) => {
          const progressValue = (completed / total) * 100;
          setProgress(progressValue);
          setCurrentOperation(`Processing ${completed}/${total}...`);
          options.onProgress?.(completed, total);
        },
      });

      setCurrentOperation('Batch complete');
      setProgress(100);

      return results;
    } catch (error) {
      handleError(error, { context: 'batchProcessing', imageCount: images.length });
      return [];
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
        setCurrentOperation('');
      }, 1000);
    }
  }, [handleError]);

  // Queue processing job for background execution
  const queueProcessing = useCallback(async (
    imageUri: string,
    operations: ImageOperation[],
    options: ImageProcessingOptions & {
      onComplete?: (result: ProcessingResult) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<string> => {
    try {
      const jobId = await imageProcessor.queueProcessing({
        imageUri,
        operations,
        priority: options.priority || 'normal',
        onProgress: (progressValue) => {
          setProgress(progressValue);
          setCurrentOperation(`Queued processing... ${Math.round(progressValue)}%`);
        },
        onComplete: (result) => {
          setCurrentOperation('Queued processing complete');
          setProgress(100);
          options.onComplete?.(result);
        },
        onError: (error) => {
          handleError(error, { context: 'queuedProcessing', jobId });
          options.onError?.(error);
        },
      });

      setCurrentOperation('Added to processing queue');
      return jobId;
    } catch (error) {
      handleError(error, { context: 'queueProcessing', imageUri });
      throw error;
    }
  }, [handleError]);

  // Cancel current processing
  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
    setProgress(0);
    setCurrentOperation('Cancelled');
  }, []);

  // Get processing statistics
  const getProcessingStats = useCallback(() => {
    return imageProcessor.getProcessingStats();
  }, []);

  // Clear processing cache
  const clearCache = useCallback(async () => {
    try {
      await imageProcessor.clearCache();
      setCurrentOperation('Cache cleared');
    } catch (error) {
      handleError(error, { context: 'clearCache' });
    }
  }, [handleError]);

  return {
    // State
    isProcessing,
    progress,
    currentOperation,

    // Methods
    processImage,
    processBatch,
    queueProcessing,
    cancelProcessing,
    getProcessingStats,
    clearCache,
  };
};

export const useImageFilters = () => {
  const [appliedFilters, setAppliedFilters] = useState<Map<string, { intensity: number; operation: ImageOperation }>>(new Map());

  const applyFilter = useCallback((filterId: string, intensity: number, operation: ImageOperation) => {
    setAppliedFilters(prev => {
      const newFilters = new Map(prev);
      newFilters.set(filterId, { intensity, operation });
      return newFilters;
    });
  }, []);

  const removeFilter = useCallback((filterId: string) => {
    setAppliedFilters(prev => {
      const newFilters = new Map(prev);
      newFilters.delete(filterId);
      return newFilters;
    });
  }, []);

  const updateFilterIntensity = useCallback((filterId: string, intensity: number) => {
    setAppliedFilters(prev => {
      const newFilters = new Map(prev);
      const existing = newFilters.get(filterId);
      if (existing) {
        newFilters.set(filterId, { ...existing, intensity });
      }
      return newFilters;
    });
  }, []);

  const getFilterOperations = useCallback((): ImageOperation[] => {
    return Array.from(appliedFilters.values()).map(item => item.operation);
  }, [appliedFilters]);

  const clearAllFilters = useCallback(() => {
    setAppliedFilters(new Map());
  }, []);

  return {
    appliedFilters,
    applyFilter,
    removeFilter,
    updateFilterIntensity,
    getFilterOperations,
    clearAllFilters,
  };
};

export const useImageTransformations = () => {
  const [transformations, setTransformations] = useState<ImageOperation[]>([]);

  const addTransformation = useCallback((operation: ImageOperation) => {
    setTransformations(prev => [...prev, operation]);
  }, []);

  const removeTransformation = useCallback((index: number) => {
    setTransformations(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateTransformation = useCallback((index: number, operation: ImageOperation) => {
    setTransformations(prev => prev.map((op, i) => i === index ? operation : op));
  }, []);

  const clearTransformations = useCallback(() => {
    setTransformations([]);
  }, []);

  const getAllOperations = useCallback((): ImageOperation[] => {
    return transformations;
  }, [transformations]);

  return {
    transformations,
    addTransformation,
    removeTransformation,
    updateTransformation,
    clearTransformations,
    getAllOperations,
  };
};

export const useImagePreview = () => {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePreview = useCallback(async (
    imageUri: string,
    operations: ImageOperation[],
    options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
  ) => {
    try {
      setIsGenerating(true);

      // Create a low-quality preview version
      const previewOperations = [
        ...operations,
        { type: 'resize' as const, width: options.maxWidth || 400, height: options.maxHeight || 400 },
      ];

      const result = await imageProcessor.processImage(imageUri, previewOperations, {
        quality: options.quality || 70,
        format: 'jpeg',
        priority: 'high',
      });

      if (result) {
        setPreviewUri(result.processedUri);
      }

      return result;
    } catch (error) {
      console.error('Failed to generate preview:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearPreview = useCallback(() => {
    setPreviewUri(null);
  }, []);

  return {
    previewUri,
    isGenerating,
    generatePreview,
    clearPreview,
  };
};
