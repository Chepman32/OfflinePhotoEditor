import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RecentProject {
  id: string;
  name: string;
  thumbnail: string; // base64 or file path
  originalUri: string;
  createdAt: number;
  lastModified: number;
  edits: EditHistory[];
  isSaved: boolean;
}

export interface EditHistory {
  id: string;
  tool: string;
  timestamp: number;
  data: any; // Tool-specific data
}

const initialState: RecentProject[] = [];

const recentProjectsSlice = createSlice({
  name: 'recentProjects',
  initialState,
  reducers: {
    addProject: (state, action: PayloadAction<RecentProject>) => {
      // Add to beginning of array
      state.unshift(action.payload);
      // Keep only last 10 projects
      if (state.length > 10) {
        state.splice(10);
      }
    },
    updateProject: (state, action: PayloadAction<{
      id: string;
      updates: Partial<RecentProject>;
    }>) => {
      const project = state.find(p => p.id === action.payload.id);
      if (project) {
        Object.assign(project, action.payload.updates);
        project.lastModified = Date.now();
      }
    },
    removeProject: (state, action: PayloadAction<string>) => {
      return state.filter(p => p.id !== action.payload);
    },
    addEditToProject: (state, action: PayloadAction<{
      projectId: string;
      edit: EditHistory;
    }>) => {
      const project = state.find(p => p.id === action.payload.projectId);
      if (project) {
        project.edits.push(action.payload.edit);
        project.lastModified = Date.now();
        project.isSaved = false;
      }
    },
    markProjectAsSaved: (state, action: PayloadAction<string>) => {
      const project = state.find(p => p.id === action.payload);
      if (project) {
        project.isSaved = true;
        project.lastModified = Date.now();
      }
    },
    clearAllProjects: (state) => {
      return [];
    },
    updateProjectThumbnail: (state, action: PayloadAction<{
      id: string;
      thumbnail: string;
    }>) => {
      const project = state.find(p => p.id === action.payload.id);
      if (project) {
        project.thumbnail = action.payload.thumbnail;
        project.lastModified = Date.now();
      }
    },
  },
});

export const {
  addProject,
  updateProject,
  removeProject,
  addEditToProject,
  markProjectAsSaved,
  clearAllProjects,
  updateProjectThumbnail,
} = recentProjectsSlice.actions;

export default recentProjectsSlice.reducer;
