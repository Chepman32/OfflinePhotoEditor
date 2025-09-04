/**
 * OfflinePhotoEditor - Premium Photo Editing App
 * Built with React Native
 */

import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider } from './src/utils/theme';
import { RootNavigator } from './src/navigation';
import { ErrorBoundary } from './src/components/common';
import { store, persistor } from './src/store';

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <SafeAreaProvider>
              <StatusBar translucent backgroundColor="transparent" />
              <RootNavigator />
            </SafeAreaProvider>
          </PersistGate>
        </Provider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
