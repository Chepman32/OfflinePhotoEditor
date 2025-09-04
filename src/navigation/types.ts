export type RootStackParamList = {
  Splash: undefined;
  Main: undefined;
  Home: undefined;
  PhotoSelection: {
    source?: 'camera' | 'gallery';
  };
  Editor: {
    imageUri: string;
    projectId?: string;
  };
  SaveExport: {
    editedImageUri: string;
    originalUri: string;
  };
  Premium: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  EditorTab: undefined;
  PremiumTab: undefined;
  SettingsTab: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
