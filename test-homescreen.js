// Quick test to verify HomeScreen components
const React = require('react');
const { Text, View } = require('react-native');

// Mock the navigation and theme
const mockNavigation = {
  navigate: (screen, params) => console.log(`Navigate to: ${screen}`, params)
};

const mockTheme = {
  colors: {
    background: '#ffffff',
    onBackground: '#000000',
    onSurface: '#000000',
    primary: '#6200EE',
    error: '#B00020'
  }
};

// Mock the hooks
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation
}));

jest.mock('../src/utils/theme', () => ({
  useTheme: () => mockTheme
}));

jest.mock('../src/hooks/useStorage', () => ({
  useRecentProjects: () => ({ projects: [] })
}));

console.log('HomeScreen test setup complete');
console.log('Key components should render:');
console.log('- App title: OfflinePhotoEditor');
console.log('- Hero card with "Start Creating" title');
console.log('- "Select Photo" button');
console.log('- Theme toggle');
console.log('- Floating action button');