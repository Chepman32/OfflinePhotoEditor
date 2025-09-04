import { Alert } from 'react-native';
import { store } from '../store';
import { setError, setLoading, clearError, setRetryAction } from '../store/slices/errorSlice';
import { AppError, ErrorType } from '../store/slices/errorSlice';
import { announceForAccessibility } from './accessibility';

// Error handling utilities
export class AppErrorHandler {
  static handleError(error: any, context?: Record<string, any>): AppError {
    const errorType = this.classifyError(error);
    const appError = this.createAppError(errorType, error, context);

    // Dispatch to Redux store
    store.dispatch(setError(appError));

    // Log error for debugging
    console.error('App Error:', appError);

    // Announce for accessibility
    announceForAccessibility(`Error: ${appError.title}`);

    return appError;
  }

  static createAppError(type: ErrorType, originalError: any, context?: Record<string, any>): AppError {
    const baseError: Omit<AppError, 'id' | 'timestamp'> = {
      type,
      severity: 'medium',
      context,
      ...this.getErrorDetails(type, originalError),
    };

    return {
      ...baseError,
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
  }

  static classifyError(error: any): ErrorType {
    if (error?.code === 'storage-full' || error?.message?.includes('storage')) {
      return 'storage_full';
    }

    if (error?.code === 'file-too-large' || error?.message?.includes('large')) {
      return 'large_image';
    }

    if (error?.code === 'export-failed' || error?.message?.includes('export')) {
      return 'export_failed';
    }

    if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
      return 'permission_denied';
    }

    if (error?.code === 'network-error' || error?.message?.includes('network')) {
      return 'network_error';
    }

    if (error?.code === 'iap-failed' || error?.message?.includes('purchase')) {
      return 'iap_failed';
    }

    return 'unknown';
  }

  static getErrorDetails(type: ErrorType, originalError: any) {
    const errorDetails = {
      storage_full: {
        title: 'Storage Full',
        message: 'Your device storage is full. Please free up some space and try again.',
        severity: 'high' as const,
        userAction: [
          {
            label: 'Go to Settings',
            action: () => {
              // Navigate to storage settings
              console.log('Navigate to storage settings');
            },
          },
        ],
      },
      large_image: {
        title: 'Image Too Large',
        message: 'The selected image is too large. Would you like to resize it automatically?',
        severity: 'medium' as const,
        userAction: [
          {
            label: 'Resize Automatically',
            action: () => {
              // Implement auto-resize
              console.log('Auto-resize image');
            },
          },
          {
            label: 'Choose Different Image',
            action: () => {
              // Navigate back to photo selection
              console.log('Navigate to photo selection');
            },
          },
        ],
      },
      export_failed: {
        title: 'Export Failed',
        message: 'Failed to export your image. Would you like to try with lower quality?',
        severity: 'medium' as const,
        userAction: [
          {
            label: 'Try Lower Quality',
            action: () => {
              // Retry with lower quality
              console.log('Retry export with lower quality');
            },
          },
        ],
        autoRetry: true,
      },
      permission_denied: {
        title: 'Permission Required',
        message: 'This feature requires additional permissions. Please grant permissions in settings.',
        severity: 'high' as const,
        userAction: [
          {
            label: 'Open Settings',
            action: () => {
              // Open app settings
              console.log('Open app settings');
            },
          },
        ],
      },
      network_error: {
        title: 'Connection Error',
        message: 'Unable to connect to the internet. Please check your connection and try again.',
        severity: 'medium' as const,
        autoRetry: true,
      },
      iap_failed: {
        title: 'Purchase Failed',
        message: 'Unable to complete your purchase. Please try again or contact support.',
        severity: 'high' as const,
        userAction: [
          {
            label: 'Try Again',
            action: () => {
              // Retry purchase
              console.log('Retry purchase');
            },
          },
        ],
      },
      import_failed: {
        title: 'Import Failed',
        message: 'Unable to import the selected file. Please try a different file.',
        severity: 'medium' as const,
      },
      file_not_found: {
        title: 'File Not Found',
        message: 'The selected file could not be found. It may have been moved or deleted.',
        severity: 'medium' as const,
      },
      unsupported_format: {
        title: 'Unsupported Format',
        message: 'This file format is not supported. Please try a different file.',
        severity: 'low' as const,
      },
      memory_error: {
        title: 'Memory Error',
        message: 'Not enough memory available. Please close other apps and try again.',
        severity: 'high' as const,
      },
      unknown: {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Please try again.',
        severity: 'medium' as const,
        autoRetry: true,
      },
    };

    return errorDetails[type] || errorDetails.unknown;
  }

  static showErrorAlert(error: AppError) {
    const buttons = [];

    if (error.userAction) {
      error.userAction.forEach(action => {
        buttons.push({
          text: action.label,
          onPress: action.action,
        });
      });
    }

    buttons.push({
      text: 'Dismiss',
      style: 'cancel',
      onPress: () => store.dispatch(clearError()),
    });

    Alert.alert(error.title, error.message, buttons);
  }

  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> {
    try {
      store.dispatch(setLoading(true));
      const result = await operation();
      store.dispatch(setLoading(false));
      return result;
    } catch (error) {
      store.dispatch(setLoading(false));
      const appError = this.handleError(error, context);

      // Show alert for high severity errors
      if (appError.severity === 'high' || appError.severity === 'critical') {
        this.showErrorAlert(appError);
      }

      return null;
    }
  }

  static async retryOperation(operation: () => Promise<any>, maxRetries: number = 3) {
    let lastError: any = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        store.dispatch(setLoading(true));
        const result = await operation();
        store.dispatch(setLoading(false));
        return result;
      } catch (error) {
        lastError = error;
        store.dispatch(setLoading(false));

        if (i < maxRetries - 1) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    // If all retries failed, handle the error
    this.handleError(lastError);
    return null;
  }
}

// Convenience functions for common error scenarios
export const handleStorageError = (context?: Record<string, any>) =>
  AppErrorHandler.handleError({ code: 'storage-full' }, context);

export const handleLargeImageError = (context?: Record<string, any>) =>
  AppErrorHandler.handleError({ code: 'file-too-large' }, context);

export const handleExportError = (context?: Record<string, any>) =>
  AppErrorHandler.handleError({ code: 'export-failed' }, context);

export const handlePermissionError = (context?: Record<string, any>) =>
  AppErrorHandler.handleError({ code: 'permission-denied' }, context);

// Hook for using error handling in components
export const useErrorHandler = () => {
  const handleError = (error: any, context?: Record<string, any>) =>
    AppErrorHandler.handleError(error, context);

  const withErrorHandling = <T,>(operation: () => Promise<T>, context?: Record<string, any>) =>
    AppErrorHandler.withErrorHandling(operation, context);

  const retryOperation = (operation: () => Promise<any>, maxRetries?: number) =>
    AppErrorHandler.retryOperation(operation, maxRetries);

  return {
    handleError,
    withErrorHandling,
    retryOperation,
  };
};
