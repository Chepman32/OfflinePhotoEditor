import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { SplashScreen } from '../screens/SplashScreen';
import { PhotoSelectionScreen } from '../screens/PhotoSelectionScreen';
import { EditorScreen } from '../screens/EditorScreen';
import { SaveExportScreen } from '../screens/SaveExportScreen';
import { PremiumScreen } from '../screens/PremiumScreen';
import { MainNavigator } from './MainNavigator';
import { ErrorDisplay } from '../components/common';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="Main"
          component={MainNavigator}
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="PhotoSelection"
          component={PhotoSelectionScreen}
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="Editor"
          component={EditorScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="SaveExport"
          component={SaveExportScreen}
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="Premium"
          component={PremiumScreen}
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
      </Stack.Navigator>
      <ErrorDisplay />
    </NavigationContainer>
  );
};
