import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { storageService, UserPreferences, RecentProject, CachedAsset } from '../services/storageService';
import {
  setTheme,
  setQualityPreference,
  setFormatPreference,
  addLastUsedTool,
  setHapticFeedback,
  setSoundEffects,
  resetPreferences,
} from '../store/slices/userPreferencesSlice';
import {
  addProject,
  updateProject,
  removeProject,
  clearAllProjects,
} from '../store/slices/recentProjectsSlice';
import { handleStorageError } from '../utils/errorHandler';

export const useStorage = () => {
  const dispatch = useDispatch();

  // Sync user preferences from Redux to local storage
  const syncUserPreferences = useCallback(async (preferences: UserPreferences) => {
    try {
      await storageService.setUserPreferences(preferences);
    } catch (error) {
      console.error('Failed to sync user preferences:', error);
    }
  }, []);

  // Sync recent projects from Redux to local storage
  const syncRecentProjects = useCallback(async (projects: RecentProject[]) => {
    try {
      // This would be handled by Redux persist, but we can add additional logic here
      console.log('Recent projects updated:', projects.length);
    } catch (error) {
      console.error('Failed to sync recent projects:', error);
    }
  }, []);

  return {
    syncUserPreferences,
    syncRecentProjects,
  };
};

export const useUserPreferences = () => {
  const dispatch = useDispatch();
  const preferences = useSelector((state: RootState) => state.userPreferences);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    try {
      // Update Redux state
      if (updates.theme !== undefined) {
        dispatch(setTheme(updates.theme));
      }
      if (updates.qualityPreference !== undefined) {
        dispatch(setQualityPreference(updates.qualityPreference));
      }
      if (updates.formatPreference !== undefined) {
        dispatch(setFormatPreference(updates.formatPreference));
      }
      if (updates.hapticFeedback !== undefined) {
        dispatch(setHapticFeedback(updates.hapticFeedback));
      }
      if (updates.soundEffects !== undefined) {
        dispatch(setSoundEffects(updates.soundEffects));
      }

      // Sync to local storage
      const currentPrefs = await storageService.getUserPreferences();
      if (currentPrefs) {
        await storageService.updateUserPreferences(updates);
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      handleStorageError({ context: { operation: 'updatePreferences' } });
    }
  }, [dispatch]);

  const resetAllPreferences = useCallback(async () => {
    try {
      dispatch(resetPreferences());
      await storageService.setUserPreferences({
        theme: 'light',
        lastUsedTools: [],
        qualityPreference: 90,
        formatPreference: 'jpeg',
        hapticFeedback: true,
        soundEffects: false,
        autoSave: true,
        highContrastMode: false,
        reduceMotion: false,
      });
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      handleStorageError({ context: { operation: 'resetPreferences' } });
    }
  }, [dispatch]);

  return {
    preferences,
    updatePreferences,
    resetAllPreferences,
  };
};

export const useRecentProjects = () => {
  const dispatch = useDispatch();
  const projects = useSelector((state: RootState) => state.recentProjects);

  const saveProject = useCallback(async (projectData: Omit<RecentProject, 'id' | 'createdAt' | 'lastModified'>) => {
    try {
      const project: RecentProject = {
        ...projectData,
        id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        lastModified: Date.now(),
      };

      await storageService.addRecentProject(project);
      dispatch(addProject(project));

      return project.id;
    } catch (error) {
      console.error('Failed to save project:', error);
      handleStorageError({ context: { operation: 'saveProject' } });
      return null;
    }
  }, [dispatch]);

  const updateProjectData = useCallback(async (projectId: string, updates: Partial<RecentProject>) => {
    try {
      await storageService.updateRecentProject(projectId, updates);
      dispatch(updateProject({ id: projectId, updates }));
    } catch (error) {
      console.error('Failed to update project:', error);
      handleStorageError({ context: { operation: 'updateProject' } });
    }
  }, [dispatch]);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await storageService.removeRecentProject(projectId);
      dispatch(removeProject(projectId));
    } catch (error) {
      console.error('Failed to delete project:', error);
      handleStorageError({ context: { operation: 'deleteProject' } });
    }
  }, [dispatch]);

  const clearAllProjectsData = useCallback(async () => {
    try {
      await storageService.clearRecentProjects();
      dispatch(clearAllProjects());
    } catch (error) {
      console.error('Failed to clear all projects:', error);
      handleStorageError({ context: { operation: 'clearAllProjects' } });
    }
  }, [dispatch]);

  return {
    projects,
    saveProject,
    updateProjectData,
    deleteProject,
    clearAllProjectsData,
  };
};

export const useCachedAssets = () => {
  const [assets, setAssets] = useState<CachedAsset[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      const cachedAssets = await storageService.getCachedAssets();
      setAssets(cachedAssets);
    } catch (error) {
      console.error('Failed to load cached assets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAsset = useCallback(async (asset: CachedAsset) => {
    try {
      await storageService.addCachedAsset(asset);
      await loadAssets(); // Refresh the list
    } catch (error) {
      console.error('Failed to add cached asset:', error);
      handleStorageError({ context: { operation: 'addAsset' } });
    }
  }, [loadAssets]);

  const removeAsset = useCallback(async (assetId: string) => {
    try {
      await storageService.removeCachedAsset(assetId);
      await loadAssets(); // Refresh the list
    } catch (error) {
      console.error('Failed to remove cached asset:', error);
      handleStorageError({ context: { operation: 'removeAsset' } });
    }
  }, [loadAssets]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  return {
    assets,
    loading,
    loadAssets,
    addAsset,
    removeAsset,
  };
};

export const useAppSettings = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const appSettings = await storageService.getAppSettings();
      setSettings(appSettings);
    } catch (error) {
      console.error('Failed to load app settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetting = useCallback(async (key: string, value: any) => {
    try {
      await storageService.setAppSetting(key as any, value);
      await loadSettings(); // Refresh the settings
    } catch (error) {
      console.error('Failed to update app setting:', error);
    }
  }, [loadSettings]);

  const incrementStat = useCallback(async (stat: 'totalEdits' | 'totalExports') => {
    try {
      await storageService.incrementAppStat(stat);
      await loadSettings(); // Refresh the settings
    } catch (error) {
      console.error('Failed to increment stat:', error);
    }
  }, [loadSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    loadSettings,
    updateSetting,
    incrementStat,
  };
};

export const useStorageCleanup = () => {
  const performCleanup = useCallback(async () => {
    try {
      await storageService.performCleanup();
    } catch (error) {
      console.error('Failed to perform storage cleanup:', error);
    }
  }, []);

  const calculateStorageUsage = useCallback(async () => {
    try {
      return await storageService.calculateStorageUsage();
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
      return 0;
    }
  }, []);

  return {
    performCleanup,
    calculateStorageUsage,
  };
};

export const useDataExport = () => {
  const [exporting, setExporting] = useState(false);

  const exportData = useCallback(async () => {
    try {
      setExporting(true);
      const data = await storageService.exportData();
      return data;
    } catch (error) {
      console.error('Failed to export data:', error);
      handleStorageError({ context: { operation: 'exportData' } });
      return null;
    } finally {
      setExporting(false);
    }
  }, []);

  const importData = useCallback(async (jsonData: string) => {
    try {
      setExporting(true);
      await storageService.importData(jsonData);
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      handleStorageError({ context: { operation: 'importData' } });
      return false;
    } finally {
      setExporting(false);
    }
  }, []);

  return {
    exporting,
    exportData,
    importData,
  };
};
