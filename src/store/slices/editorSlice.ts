import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface EditorState {
  currentImage: {
    uri: string;
    width: number;
    height: number;
    originalUri: string;
  } | null;
  currentTool: string | null;
  toolSettings: Record<string, any>;
  undoStack: ImageEditAction[];
  redoStack: ImageEditAction[];
  isProcessing: boolean;
  zoom: number;
  pan: { x: number; y: number };
  canvasSize: { width: number; height: number };
  selectedTextElement: string | null;
  textElements: TextElement[];
  filters: AppliedFilter[];
}

export interface ImageEditAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  rotation: number;
  opacity: number;
}

export interface AppliedFilter {
  id: string;
  name: string;
  intensity: number;
  parameters: Record<string, any>;
}

const initialState: EditorState = {
  currentImage: null,
  currentTool: null,
  toolSettings: {},
  undoStack: [],
  redoStack: [],
  isProcessing: false,
  zoom: 1,
  pan: { x: 0, y: 0 },
  canvasSize: { width: 0, height: 0 },
  selectedTextElement: null,
  textElements: [],
  filters: [],
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setCurrentImage: (state, action: PayloadAction<{
      uri: string;
      width: number;
      height: number;
      originalUri: string;
    }>) => {
      state.currentImage = action.payload;
      // Reset editor state for new image
      state.undoStack = [];
      state.redoStack = [];
      state.zoom = 1;
      state.pan = { x: 0, y: 0 };
      state.selectedTextElement = null;
      state.textElements = [];
      state.filters = [];
    },
    setCurrentTool: (state, action: PayloadAction<string | null>) => {
      state.currentTool = action.payload;
    },
    updateToolSettings: (state, action: PayloadAction<Record<string, any>>) => {
      state.toolSettings = { ...state.toolSettings, ...action.payload };
    },
    addEditAction: (state, action: PayloadAction<ImageEditAction>) => {
      state.undoStack.push(action.payload);
      state.redoStack = []; // Clear redo stack when new action is added
    },
    undo: (state) => {
      if (state.undoStack.length > 0) {
        const action = state.undoStack.pop()!;
        state.redoStack.push(action);
        // Apply undo logic based on action type
        applyUndoAction(state, action);
      }
    },
    redo: (state) => {
      if (state.redoStack.length > 0) {
        const action = state.redoStack.pop()!;
        state.undoStack.push(action);
        // Apply redo logic based on action type
        applyRedoAction(state, action);
      }
    },
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = Math.max(0.1, Math.min(5, action.payload));
    },
    setPan: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.pan = action.payload;
    },
    setCanvasSize: (state, action: PayloadAction<{ width: number; height: number }>) => {
      state.canvasSize = action.payload;
    },
    addTextElement: (state, action: PayloadAction<TextElement>) => {
      state.textElements.push(action.payload);
      state.selectedTextElement = action.payload.id;
    },
    updateTextElement: (state, action: PayloadAction<{
      id: string;
      updates: Partial<TextElement>;
    }>) => {
      const element = state.textElements.find(el => el.id === action.payload.id);
      if (element) {
        Object.assign(element, action.payload.updates);
      }
    },
    removeTextElement: (state, action: PayloadAction<string>) => {
      state.textElements = state.textElements.filter(el => el.id !== action.payload);
      if (state.selectedTextElement === action.payload) {
        state.selectedTextElement = null;
      }
    },
    setSelectedTextElement: (state, action: PayloadAction<string | null>) => {
      state.selectedTextElement = action.payload;
    },
    addFilter: (state, action: PayloadAction<AppliedFilter>) => {
      // Remove existing filter with same name if it exists
      state.filters = state.filters.filter(f => f.name !== action.payload.name);
      state.filters.push(action.payload);
    },
    updateFilter: (state, action: PayloadAction<{
      id: string;
      updates: Partial<AppliedFilter>;
    }>) => {
      const filter = state.filters.find(f => f.id === action.payload.id);
      if (filter) {
        Object.assign(filter, action.payload.updates);
      }
    },
    removeFilter: (state, action: PayloadAction<string>) => {
      state.filters = state.filters.filter(f => f.id !== action.payload);
    },
    resetEditor: (state) => {
      Object.assign(state, initialState);
    },
  },
});

// Helper functions for undo/redo logic
function applyUndoAction(state: EditorState, action: ImageEditAction) {
  switch (action.type) {
    case 'ADD_TEXT':
      state.textElements = state.textElements.filter(el => el.id !== action.data.id);
      break;
    case 'UPDATE_TEXT':
      // Restore previous state (this would need more complex implementation)
      break;
    case 'ADD_FILTER':
      state.filters = state.filters.filter(f => f.id !== action.data.id);
      break;
    // Add more undo cases as needed
  }
}

function applyRedoAction(state: EditorState, action: ImageEditAction) {
  switch (action.type) {
    case 'ADD_TEXT':
      state.textElements.push(action.data);
      break;
    case 'ADD_FILTER':
      state.filters.push(action.data);
      break;
    // Add more redo cases as needed
  }
}

export const {
  setCurrentImage,
  setCurrentTool,
  updateToolSettings,
  addEditAction,
  undo,
  redo,
  setProcessing,
  setZoom,
  setPan,
  setCanvasSize,
  addTextElement,
  updateTextElement,
  removeTextElement,
  setSelectedTextElement,
  addFilter,
  updateFilter,
  removeFilter,
  resetEditor,
} = editorSlice.actions;

export default editorSlice.reducer;
