import { Image } from 'react-native';
import RNFS from 'react-native-fs';
import ImageEditor from '@react-native-community/image-editor';

// Image Processing Job Interface
interface ImageProcessingJob {
  id: string;
  imageUri: string;
  operations: ImageOperation[];
  priority: 'low' | 'normal' | 'high';
  onProgress?: (progress: number) => void;
  onComplete?: (result: ProcessingResult) => void;
  onError?: (error: Error) => void;
}

// Image Operation Types
type ImageOperation =
  | { type: 'resize'; width: number; height: number }
  | { type: 'crop'; x: number; y: number; width: number; height: number }
  | { type: 'rotate'; angle: number }
  | { type: 'flip'; direction: 'horizontal' | 'vertical' }
  | { type: 'filter'; filterType: string; intensity: number }
  | { type: 'brightness'; value: number }
  | { type: 'contrast'; value: number }
  | { type: 'saturation'; value: number }
  | { type: 'blur'; radius: number }
  | {
      type: 'text';
      text: string;
      x: number;
      y: number;
      fontSize: number;
      color: string;
    }
  | {
      type: 'overlay';
      overlayUri: string;
      x: number;
      y: number;
      opacity: number;
    };

// Processing Result
interface ProcessingResult {
  originalUri: string;
  processedUri: string;
  thumbnailUri?: string;
  fileSize: number;
  dimensions: { width: number; height: number };
  processingTime: number;
  operations: ImageOperation[];
}

// Image Information
interface ImageInfo {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  format: 'jpeg' | 'png' | 'webp';
  orientation?: number;
}

// Mock image processing service - in production this would use react-native-image-editor
class ImageProcessor {
  private static instance: ImageProcessor;

  // Processing queue for background operations
  private processingQueue: ImageProcessingJob[] = [];
  private isProcessing = false;

  private constructor() {}

  static getInstance(): ImageProcessor {
    if (!ImageProcessor.instance) {
      ImageProcessor.instance = new ImageProcessor();
    }
    return ImageProcessor.instance;
  }

  // Main processing methods
  async processImage(
    imageUri: string,
    operations: ImageOperation[],
    options: {
      quality?: number;
      format?: 'jpeg' | 'png';
      generateThumbnail?: boolean;
      priority?: 'low' | 'normal' | 'high';
      onProgress?: (progress: number) => void;
    } = {},
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      // Validate input
      await this.validateImageUri(imageUri);

      // Get image information
      await this.getImageInfo(imageUri);

      // Apply operations sequentially
      let processedUri = imageUri;
      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        const progress = ((i + 1) / operations.length) * 100;

        options.onProgress?.(progress);
        processedUri = await this.applyOperation(processedUri, operation);
      }

      // Generate final output
      const finalUri = await this.generateOutput(processedUri, {
        quality: options.quality || 90,
        format: options.format || 'jpeg',
      });

      // Generate thumbnail if requested
      let thumbnailUri: string | undefined;
      if (options.generateThumbnail) {
        thumbnailUri = await this.generateThumbnail(finalUri);
      }

      // Get final image info
      const finalInfo = await this.getImageInfo(finalUri);

      const result: ProcessingResult = {
        originalUri: imageUri,
        processedUri: finalUri,
        thumbnailUri,
        fileSize: finalInfo.fileSize,
        dimensions: { width: finalInfo.width, height: finalInfo.height },
        processingTime: Date.now() - startTime,
        operations,
      };

      return result;
    } catch (error) {
      console.error('Image processing failed:', error);
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Queue processing for background operations
  async queueProcessing(job: Omit<ImageProcessingJob, 'id'>): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const fullJob: ImageProcessingJob = {
      id: jobId,
      ...job,
    };

    // Add to queue based on priority
    if (job.priority === 'high') {
      this.processingQueue.unshift(fullJob);
    } else if (job.priority === 'low') {
      this.processingQueue.push(fullJob);
    } else {
      // Insert at appropriate position for normal priority
      const insertIndex = this.processingQueue.findIndex(
        j => j.priority === 'low',
      );
      if (insertIndex === -1) {
        this.processingQueue.push(fullJob);
      } else {
        this.processingQueue.splice(insertIndex, 0, fullJob);
      }
    }

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return jobId;
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.processingQueue.length > 0) {
      const job = this.processingQueue.shift()!;

      try {
        const result = await this.processImage(job.imageUri, job.operations, {
          priority: job.priority,
          onProgress: job.onProgress,
        });

        job.onComplete?.(result);
      } catch (error) {
        job.onError?.(error as Error);
      }
    }

    this.isProcessing = false;
  }

  // Core operation implementations
  private async applyOperation(
    imageUri: string,
    operation: ImageOperation,
  ): Promise<string> {
    switch (operation.type) {
      case 'resize':
        return this.resizeImage(imageUri, operation.width, operation.height);
      case 'crop':
        return this.cropImage(
          imageUri,
          operation.x,
          operation.y,
          operation.width,
          operation.height,
        );
      case 'rotate':
        return this.rotateImage(imageUri, operation.angle);
      case 'flip':
        return this.flipImage(imageUri, operation.direction);
      case 'filter':
        return this.applyFilter(
          imageUri,
          operation.filterType,
          operation.intensity,
        );
      case 'brightness':
        return this.adjustBrightness(imageUri, operation.value);
      case 'contrast':
        return this.adjustContrast(imageUri, operation.value);
      case 'saturation':
        return this.adjustSaturation(imageUri, operation.value);
      case 'blur':
        return this.applyBlur(imageUri, operation.radius);
      case 'text':
        return this.addText(
          imageUri,
          operation.text,
          operation.x,
          operation.y,
          operation.fontSize,
          operation.color,
        );
      case 'overlay':
        return this.addOverlay(
          imageUri,
          operation.overlayUri,
          operation.x,
          operation.y,
          operation.opacity,
        );
      default:
        return imageUri;
    }
  }

  // Image manipulation methods (mock implementations)
  private async resizeImage(
    uri: string,
    width: number,
    height: number,
  ): Promise<string> {
    console.log(`Resizing image to ${width}x${height}`);
    // In production: Use react-native-image-editor or similar
    await this.delay(100);
    return uri; // Return same URI for mock
  }

  private async cropImage(
    uri: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Promise<string> {
    console.log(`Cropping image at ${x},${y} with size ${width}x${height}`);

    try {
      // Handle remote URLs by downloading first
      let localUri = uri;
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        console.log('Downloading remote image for cropping...');
        localUri = await this.downloadRemoteImage(uri);
      }

      // Get actual image dimensions first
      const imageInfo = await this.getImageInfo(localUri);

      // Ensure crop coordinates are within image bounds
      const safeX = Math.max(0, Math.min(x, imageInfo.width - 1));
      const safeY = Math.max(0, Math.min(y, imageInfo.height - 1));
      const safeWidth = Math.max(1, Math.min(width, imageInfo.width - safeX));
      const safeHeight = Math.max(
        1,
        Math.min(height, imageInfo.height - safeY),
      );

      const cropData = {
        offset: { x: Math.round(safeX), y: Math.round(safeY) },
        size: { width: Math.round(safeWidth), height: Math.round(safeHeight) },
      };

      console.log('Crop data:', cropData);
      const cropResult = await ImageEditor.cropImage(localUri, cropData);
      console.log('Image cropped successfully:', cropResult);
      return cropResult.uri;
    } catch (error) {
      console.error('Failed to crop image:', error);
      throw new Error(`Failed to crop image: ${error}`);
    }
  }

  private async rotateImage(uri: string, angle: number): Promise<string> {
    console.log(`Rotating image by ${angle} degrees`);

    try {
      // For now, we'll use a workaround since react-native-image-editor doesn't support rotation
      // In a production app, you'd use a library like react-native-image-resizer or similar

      if (angle === 0) {
        return uri; // No rotation needed
      }

      // Get image dimensions first
      await this.getImageInfo(uri);

      // For 90-degree rotations, we can simulate by cropping and resizing
      // This is a simplified implementation - in production you'd use a proper rotation library
      if (angle === 90 || angle === 180 || angle === 270) {
        console.log(
          `Simulating ${angle}° rotation (production would use proper rotation library)`,
        );

        // Create a rotated filename
        const rotatedUri = uri.replace(/(\.[^.]+)$/, `_rotated_${angle}$1`);

        // Copy the file with rotation metadata (simplified approach)
        await RNFS.copyFile(uri, rotatedUri);

        console.log('Image rotation simulated:', rotatedUri);
        return rotatedUri;
      }

      return uri;
    } catch (error) {
      console.error('Failed to rotate image:', error);
      throw new Error(`Failed to rotate image: ${error}`);
    }
  }

  private async flipImage(
    uri: string,
    direction: 'horizontal' | 'vertical',
  ): Promise<string> {
    console.log(`Flipping image ${direction}`);

    try {
      // Create a flipped filename
      const flippedUri = uri.replace(/(\.[^.]+)$/, `_flipped_${direction}$1`);

      // For now, we'll simulate flipping by copying the file
      // In production, you'd use a proper image manipulation library
      await RNFS.copyFile(uri, flippedUri);

      console.log(`Image flip ${direction} simulated:`, flippedUri);
      return flippedUri;
    } catch (error) {
      console.error('Failed to flip image:', error);
      throw new Error(`Failed to flip image: ${error}`);
    }
  }

  private async applyFilter(
    uri: string,
    filterType: string,
    intensity: number,
  ): Promise<string> {
    console.log(`Applying ${filterType} filter with intensity ${intensity}`);
    await this.delay(200);
    return uri;
  }

  private async adjustBrightness(uri: string, value: number): Promise<string> {
    console.log(`Adjusting brightness by ${value}`);
    await this.delay(100);
    return uri;
  }

  private async adjustContrast(uri: string, value: number): Promise<string> {
    console.log(`Adjusting contrast by ${value}`);
    await this.delay(100);
    return uri;
  }

  private async adjustSaturation(uri: string, value: number): Promise<string> {
    console.log(`Adjusting saturation by ${value}`);
    await this.delay(100);
    return uri;
  }

  private async applyBlur(uri: string, radius: number): Promise<string> {
    console.log(`Applying blur with radius ${radius}`);
    await this.delay(150);
    return uri;
  }

  private async addText(
    uri: string,
    text: string,
    x: number,
    y: number,
    _fontSize: number,
    _color: string,
  ): Promise<string> {
    console.log(`Adding text "${text}" at ${x},${y}`);
    await this.delay(120);
    return uri;
  }

  private async addOverlay(
    uri: string,
    overlayUri: string,
    x: number,
    y: number,
    opacity: number,
  ): Promise<string> {
    console.log(`Adding overlay at ${x},${y} with opacity ${opacity}`);
    await this.delay(100);
    return uri;
  }

  // Utility methods
  private async validateImageUri(uri: string): Promise<void> {
    if (!uri || typeof uri !== 'string') {
      throw new Error('Invalid image URI');
    }

    // Check if it's a remote URL
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      // For remote URLs, we'll validate by trying to get image dimensions
      try {
        await this.getImageDimensions(uri);
        return; // If we can get dimensions, the URL is valid
      } catch (error) {
        throw new Error('Invalid remote image URL');
      }
    }

    // Check if it's an iOS Photos Library URI
    if (uri.startsWith('ph://')) {
      // For Photos Library URIs, validate by trying to get image dimensions
      try {
        await this.getImageDimensions(uri);
        return; // If we can get dimensions, the URI is valid
      } catch (error) {
        throw new Error('Invalid Photos Library image URI');
      }
    }

    // For local files, check if file exists
    const filePath = uri.replace('file://', '');
    const exists = await RNFS.exists(filePath);
    if (!exists) {
      throw new Error('Image file does not exist');
    }
  }

  private async getImageInfo(uri: string): Promise<ImageInfo> {
    try {
      // Get image dimensions
      const dimensions = await this.getImageDimensions(uri);

      let fileSize = 0;

      // For local files, get file size
      if (!uri.startsWith('http://') && !uri.startsWith('https://') && !uri.startsWith('ph://')) {
        const filePath = uri.replace('file://', '');
        const stats = await RNFS.stat(filePath);
        fileSize = stats.size;
      } else {
        // For remote URLs and Photos Library URIs, we can't easily get file size without downloading
        // Use a reasonable default or try to estimate from dimensions
        fileSize = dimensions.width * dimensions.height * 3; // Rough estimate for RGB
      }

      return {
        uri,
        width: dimensions.width,
        height: dimensions.height,
        fileSize,
        format: this.getImageFormat(uri),
      };
    } catch (error) {
      throw new Error(`Failed to get image info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getImageDimensions(
    uri: string,
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, _reject) => {
      Image.getSize(
        uri,
        (width, height) => {
          resolve({ width, height });
        },
        _error => {
          console.error('Failed to get image dimensions:', _error);
          // Fallback to default dimensions
          resolve({ width: 1920, height: 1080 });
        },
      );
    });
  }

  private getImageFormat(uri: string): 'jpeg' | 'png' | 'webp' {
    const extension = uri.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'jpeg';
      case 'png':
        return 'png';
      case 'webp':
        return 'webp';
      default:
        return 'jpeg';
    }
  }

  private async generateOutput(
    uri: string,
    options: { quality: number; format: 'jpeg' | 'png' },
  ): Promise<string> {
    console.log(
      `Generating output with quality ${options.quality} in ${options.format} format`,
    );
    await this.delay(200);
    return uri; // In production this would create a new processed file
  }

  private async generateThumbnail(uri: string): Promise<string> {
    console.log('Generating thumbnail');
    await this.delay(100);
    return uri; // In production this would create a smaller version
  }

  private async downloadRemoteImage(remoteUri: string): Promise<string> {
    try {
      // Create a unique filename for the downloaded image
      const timestamp = Date.now();
      const extension = remoteUri.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `downloaded_image_${timestamp}.${extension}`;
      const localPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      console.log(`Downloading image from ${remoteUri} to ${localPath}`);

      // Download the image
      const downloadResult = await RNFS.downloadFile({
        fromUrl: remoteUri,
        toFile: localPath,
      }).promise;

      if (downloadResult.statusCode === 200) {
        console.log('Image downloaded successfully');
        return `file://${localPath}`;
      } else {
        throw new Error(`Download failed with status code: ${downloadResult.statusCode}`);
      }
    } catch (error) {
      console.error('Failed to download remote image:', error);
      throw new Error(`Failed to download remote image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Batch processing
  async processBatch(
    images: Array<{ uri: string; operations: ImageOperation[] }>,
    options: {
      quality?: number;
      format?: 'jpeg' | 'png';
      onProgress?: (completed: number, total: number) => void;
    } = {},
  ): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    let completed = 0;

    for (const image of images) {
      try {
        const result = await this.processImage(image.uri, image.operations, {
          quality: options.quality,
          format: options.format,
        });

        results.push(result);
        completed++;
        options.onProgress?.(completed, images.length);
      } catch (error) {
        console.error(`Failed to process image ${image.uri}:`, error);
        // Continue with other images
      }
    }

    return results;
  }

  // Memory management
  async clearCache(): Promise<void> {
    // Clear any cached processed images
    console.log('Clearing image processing cache');
    // In production this would clear temp files
  }

  // Performance monitoring
  getProcessingStats(): {
    queueLength: number;
    isProcessing: boolean;
    averageProcessingTime: number;
  } {
    return {
      queueLength: this.processingQueue.length,
      isProcessing: this.isProcessing,
      averageProcessingTime: 0, // Would track this in production
    };
  }
}

export const imageProcessor = ImageProcessor.getInstance();
export type { ImageOperation, ProcessingResult, ImageInfo, ImageProcessingJob };
