import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UiState {
  isLoading: boolean;
  loadingMessage: string;
  activeModal: string | null;
  modalData: any;
  snackbar: {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  };
  bottomSheet: {
    visible: boolean;
    content: string | null; // Component name or identifier
    data: any;
  };
  keyboardVisible: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

const initialState: UiState = {
  isLoading: false,
  loadingMessage: '',
  activeModal: null,
  modalData: null,
  snackbar: {
    visible: false,
    message: '',
    type: 'info',
  },
  bottomSheet: {
    visible: false,
    content: null,
    data: null,
  },
  keyboardVisible: false,
  safeAreaInsets: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<{
      isLoading: boolean;
      message?: string;
    }>) => {
      state.isLoading = action.payload.isLoading;
      state.loadingMessage = action.payload.message || '';
    },
    showModal: (state, action: PayloadAction<{
      modal: string;
      data?: any;
    }>) => {
      state.activeModal = action.payload.modal;
      state.modalData = action.payload.data || null;
    },
    hideModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },
    showSnackbar: (state, action: PayloadAction<{
      message: string;
      type?: 'success' | 'error' | 'info';
    }>) => {
      state.snackbar = {
        visible: true,
        message: action.payload.message,
        type: action.payload.type || 'info',
      };
    },
    hideSnackbar: (state) => {
      state.snackbar.visible = false;
    },
    showBottomSheet: (state, action: PayloadAction<{
      content: string;
      data?: any;
    }>) => {
      state.bottomSheet = {
        visible: true,
        content: action.payload.content,
        data: action.payload.data || null,
      };
    },
    hideBottomSheet: (state) => {
      state.bottomSheet = {
        visible: false,
        content: null,
        data: null,
      };
    },
    setKeyboardVisible: (state, action: PayloadAction<boolean>) => {
      state.keyboardVisible = action.payload;
    },
    setSafeAreaInsets: (state, action: PayloadAction<{
      top: number;
      bottom: number;
      left: number;
      right: number;
    }>) => {
      state.safeAreaInsets = action.payload;
    },
    resetUiState: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setLoading,
  showModal,
  hideModal,
  showSnackbar,
  hideSnackbar,
  showBottomSheet,
  hideBottomSheet,
  setKeyboardVisible,
  setSafeAreaInsets,
  resetUiState,
} = uiSlice.actions;

export default uiSlice.reducer;
