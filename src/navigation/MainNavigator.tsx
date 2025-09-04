import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { useTheme } from '../utils/theme';
import { HomeScreen } from '../screens/HomeScreen';
import { PremiumScreen } from '../screens/PremiumScreen';

// Placeholder screens - will be implemented later
const EditorScreen = () => <></>;
const SettingsScreen = () => <></>;

interface TabBarIconProps {
  icon: string;
  focused: boolean;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ icon, focused }) => (
  <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
    {icon}
  </Text>
);

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 20,
    opacity: 0.7,
  },
  tabIconFocused: {
    opacity: 1,
  },
});

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.onSurface,
          borderTopWidth: 0.5,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurface,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon icon="🏠" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="EditorTab"
        component={EditorScreen}
        options={{
          title: 'Editor',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon icon="🎨" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="PremiumTab"
        component={PremiumScreen}
        options={{
          title: 'Premium',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon icon="⭐" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon icon="⚙️" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
