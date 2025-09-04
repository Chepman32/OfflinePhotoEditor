import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import slices
import {
  userPreferencesReducer,
  subscriptionReducer,
  recentProjectsReducer,
  editorReducer,
  uiReducer,
  errorReducer,
} from './slices';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['userPreferences', 'subscription', 'recentProjects'], // Only persist these slices
};

const rootReducer = combineReducers({
  userPreferences: userPreferencesReducer,
  subscription: subscriptionReducer,
  recentProjects: recentProjectsReducer,
  editor: editorReducer,
  ui: uiReducer,
  error: errorReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
