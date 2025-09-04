import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ErrorState {
  currentError: AppError | null;
  errorHistory: AppError[];
  isLoading: boolean;
  retryAction: (() => void) | null;
}

export interface AppError {
  id: string;
  type: ErrorType;
  title: string;
  message: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userAction?: {
    label: string;
    action: () => void;
  }[];
  autoRetry?: boolean;
  retryCount?: number;
  context?: Record<string, any>;
}

export type ErrorType =
  | 'storage_full'
  | 'large_image'
  | 'export_failed'
  | 'import_failed'
  | 'permission_denied'
  | 'network_error'
  | 'iap_failed'
  | 'file_not_found'
  | 'unsupported_format'
  | 'memory_error'
  | 'unknown';

const initialState: ErrorState = {
  currentError: null,
  errorHistory: [],
  isLoading: false,
  retryAction: null,
};

const errorSlice = createSlice({
  name: 'error',
  initialState,
  reducers: {
    setError: (state, action: PayloadAction<AppError>) => {
      state.currentError = action.payload;
      state.errorHistory.unshift(action.payload);

      // Keep only last 50 errors
      if (state.errorHistory.length > 50) {
        state.errorHistory = state.errorHistory.slice(0, 50);
      }
    },
    clearError: (state) => {
      state.currentError = null;
    },
    clearErrorHistory: (state) => {
      state.errorHistory = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setRetryAction: (state, action: PayloadAction<(() => void) | null>) => {
      state.retryAction = action.payload;
    },
    incrementRetryCount: (state) => {
      if (state.currentError) {
        state.currentError.retryCount = (state.currentError.retryCount || 0) + 1;
      }
    },
    dismissError: (state, action: PayloadAction<string>) => {
      state.errorHistory = state.errorHistory.filter(error => error.id !== action.payload);
      if (state.currentError?.id === action.payload) {
        state.currentError = null;
      }
    },
  },
});

export const {
  setError,
  clearError,
  clearErrorHistory,
  setLoading,
  setRetryAction,
  incrementRetryCount,
  dismissError,
} = errorSlice.actions;

export default errorSlice.reducer;
