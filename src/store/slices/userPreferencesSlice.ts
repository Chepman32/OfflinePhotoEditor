import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ColorScheme } from '../../constants/colors';

export interface UserPreferences {
  theme: ColorScheme;
  lastUsedTools: string[];
  qualityPreference: number; // 50-100
  formatPreference: 'jpeg' | 'png';
  hapticFeedback: boolean;
  soundEffects: boolean;
}

const initialState: UserPreferences = {
  theme: 'light',
  lastUsedTools: [],
  qualityPreference: 90,
  formatPreference: 'jpeg',
  hapticFeedback: true,
  soundEffects: false,
};

const userPreferencesSlice = createSlice({
  name: 'userPreferences',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ColorScheme>) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setQualityPreference: (state, action: PayloadAction<number>) => {
      state.qualityPreference = Math.max(50, Math.min(100, action.payload));
    },
    setFormatPreference: (state, action: PayloadAction<'jpeg' | 'png'>) => {
      state.formatPreference = action.payload;
    },
    addLastUsedTool: (state, action: PayloadAction<string>) => {
      const tool = action.payload;
      // Remove if already exists, then add to front
      state.lastUsedTools = state.lastUsedTools.filter(t => t !== tool);
      state.lastUsedTools.unshift(tool);
      // Keep only last 5 tools
      state.lastUsedTools = state.lastUsedTools.slice(0, 5);
    },
    setHapticFeedback: (state, action: PayloadAction<boolean>) => {
      state.hapticFeedback = action.payload;
    },
    setSoundEffects: (state, action: PayloadAction<boolean>) => {
      state.soundEffects = action.payload;
    },
    resetPreferences: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  setQualityPreference,
  setFormatPreference,
  addLastUsedTool,
  setHapticFeedback,
  setSoundEffects,
  resetPreferences,
} = userPreferencesSlice.actions;

export default userPreferencesSlice.reducer;
