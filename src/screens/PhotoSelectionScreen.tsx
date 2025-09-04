import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Alert,
  Image,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../utils/theme';
import { IconButton } from '../components/common/IconButton';
import { ElevatedButton } from '../components/common/ElevatedButton';
import { Toolbar } from '../components/common/Toolbar';
import { TYPOGRAPHY } from '../constants/typography';
import { SPACING } from '../constants/spacing';

const { width } = Dimensions.get('window');
const GRID_COLUMNS = 3;
const GRID_SPACING = SPACING.sm;
const PHOTO_SIZE = (width - (GRID_COLUMNS + 1) * GRID_SPACING) / GRID_COLUMNS;

type PhotoSelectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'PhotoSelection'
>;
type PhotoSelectionScreenRouteProp = RouteProp<
  RootStackParamList,
  'PhotoSelection'
>;

interface PhotoItem {
  id: string;
  uri: string;
  timestamp: number;
  isSelected: boolean;
}

export const PhotoSelectionScreen: React.FC = () => {
  const navigation = useNavigation<PhotoSelectionScreenNavigationProp>();
  const route = useRoute<PhotoSelectionScreenRouteProp>();
  const { colors } = useTheme();

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selectedSource, setSelectedSource] = useState<'gallery' | 'camera'>(
    route.params?.source || 'gallery',
  );
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const segmentedControlTranslateX = useSharedValue(0);
  const gridOpacity = useSharedValue(0);
  const fabScale = useSharedValue(0);

  useEffect(() => {
    loadPhotos();
    startAnimations();
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Photo Library Permission',
            message:
              'This app needs access to your photo library to select images for editing.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS permissions are handled automatically
  };

  const loadPhotos = async () => {
    try {
      // Temporary fallback with sample images while native module is being set up
      const samplePhotos: PhotoItem[] = [
        {
          id: '1',
          uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop',
          timestamp: Date.now() - 1000 * 60 * 60 * 24,
          isSelected: false,
        },
        {
          id: '2',
          uri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop',
          timestamp: Date.now() - 1000 * 60 * 60 * 48,
          isSelected: false,
        },
        {
          id: '3',
          uri: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&h=300&fit=crop',
          timestamp: Date.now() - 1000 * 60 * 60 * 72,
          isSelected: false,
        },
        {
          id: '4',
          uri: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=300&h=300&fit=crop',
          timestamp: Date.now() - 1000 * 60 * 60 * 96,
          isSelected: false,
        },
        {
          id: '5',
          uri: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=300&h=300&fit=crop',
          timestamp: Date.now() - 1000 * 60 * 60 * 120,
          isSelected: false,
        },
        {
          id: '6',
          uri: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=300&h=300&fit=crop',
          timestamp: Date.now() - 1000 * 60 * 60 * 144,
          isSelected: false,
        },
        {
          id: '7',
          uri: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&h=300&fit=crop',
          timestamp: Date.now() - 1000 * 60 * 60 * 168,
          isSelected: false,
        },
        {
          id: '8',
          uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=300&h=300&fit=crop',
          timestamp: Date.now() - 1000 * 60 * 60 * 192,
          isSelected: false,
        },
        {
          id: '9',
          uri: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=300&h=300&fit=crop',
          timestamp: Date.now() - 1000 * 60 * 60 * 216,
          isSelected: false,
        },
        {
          id: '10',
          uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop&q=80',
          timestamp: Date.now() - 1000 * 60 * 60 * 240,
          isSelected: false,
        },
        {
          id: '11',
          uri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop&q=80',
          timestamp: Date.now() - 1000 * 60 * 60 * 264,
          isSelected: false,
        },
        {
          id: '12',
          uri: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&h=300&fit=crop&q=80',
          timestamp: Date.now() - 1000 * 60 * 60 * 288,
          isSelected: false,
        },
      ];

      // Try to load real photos from camera roll first
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to select images.',
          [{ text: 'OK' }],
        );
        // Fall back to sample photos if permission denied
        setPhotos(samplePhotos);
        setIsLoading(false);
        return;
      }

      const result = await CameraRoll.getPhotos({
        first: 50,
        assetType: 'Photos',
        include: ['filename', 'imageSize', 'playableDuration'],
      });

      const photoItems: PhotoItem[] = result.edges.map((edge, index) => ({
        id: edge.node.image.uri,
        uri: edge.node.image.uri,
        timestamp: edge.node.timestamp,
        isSelected: false,
      }));

      setPhotos(photoItems);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert(
        'Gallery Access Failed',
        'Could not access your photo gallery. Using sample images instead.',
        [{ text: 'OK' }],
      );
      // Fall back to sample photos if camera roll fails
      setPhotos(samplePhotos);
      setIsLoading(false);
    }
  };

  const startAnimations = () => {
    // Segmented control animation
    segmentedControlTranslateX.value = withSpring(0, {
      damping: 20,
      stiffness: 100,
    });

    // Grid animation
    setTimeout(() => {
      gridOpacity.value = withTiming(1, { duration: 600 });
    }, 200);

    // FAB animation
    setTimeout(() => {
      fabScale.value = withSpring(1, {
        damping: 12,
        stiffness: 150,
        mass: 1,
      });
    }, 400);
  };

  const segmentedControlAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: segmentedControlTranslateX.value }],
  }));

  const gridAnimatedStyle = useAnimatedStyle(() => ({
    opacity: gridOpacity.value,
  }));

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const handleSourceChange = (source: 'gallery' | 'camera') => {
    setSelectedSource(source);
    // In a real app, this would reload photos from different sources
  };

  const handlePhotoPress = (photoId: string) => {
    if (selectedPhotos.includes(photoId)) {
      setSelectedPhotos(prev => prev.filter(id => id !== photoId));
    } else {
      if (selectedPhotos.length >= 5) {
        Alert.alert(
          'Selection Limit',
          'You can select up to 5 photos at once.',
          [{ text: 'OK' }],
        );
        return;
      }
      setSelectedPhotos(prev => [...prev, photoId]);
    }
  };

  const handleContinue = () => {
    if (selectedPhotos.length === 0) {
      Alert.alert(
        'No Photos Selected',
        'Please select at least one photo to continue.',
        [{ text: 'OK' }],
      );
      return;
    }

    const selectedPhotoData = photos.find(
      photo => photo.id === selectedPhotos[0],
    );
    if (selectedPhotoData) {
      navigation.navigate('Editor', {
        imageUri: selectedPhotoData.uri,
        projectId: undefined,
      });
    }
  };

  const handleCameraPress = () => {
    // In a real app, this would open the camera
    Alert.alert(
      'Camera',
      'Camera functionality would be implemented here using react-native-image-picker',
      [{ text: 'OK' }],
    );
  };

  const renderPhotoItem = ({
    item,
    index,
  }: {
    item: PhotoItem;
    index: number;
  }) => {
    const isSelected = selectedPhotos.includes(item.id);
    const delay = (index % 9) * 50; // Stagger animation for 3x3 grid

    return (
      <Animated.View
        style={[
          styles.photoItemContainer,
          { width: PHOTO_SIZE, height: PHOTO_SIZE },
          { opacity: 1, transform: [{ scale: 1 }] },
        ]}
      >
        <TouchableOpacity
          style={styles.photoTouchable}
          onPress={() => handlePhotoPress(item.id)}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: item.uri }}
            style={styles.photoImage}
            resizeMode="cover"
          />

          {isSelected && (
            <View
              style={[
                styles.selectionOverlay,
                { backgroundColor: colors.primary + '80' },
              ]}
            >
              <View
                style={[styles.checkmark, { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[styles.checkmarkText, { color: colors.onPrimary }]}
                >
                  ✓
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <Toolbar style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon={<Text style={{ fontSize: 20 }}>←</Text>}
            onPress={() => navigation.goBack()}
          />
        </View>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.onBackground }]}>
            Select Photo
          </Text>
        </View>
        <View style={styles.headerRight}>
          {selectedPhotos.length > 0 && (
            <Text style={[styles.selectionCount, { color: colors.primary }]}>
              {selectedPhotos.length}/5
            </Text>
          )}
        </View>
      </Toolbar>

      {/* Source Selection */}
      <Animated.View
        style={[styles.sourceSelector, segmentedControlAnimatedStyle]}
      >
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedSource === 'gallery' && [
                styles.segmentButtonActive,
                { backgroundColor: colors.primary },
              ],
            ]}
            onPress={() => handleSourceChange('gallery')}
          >
            <Text
              style={[
                styles.segmentText,
                selectedSource === 'gallery'
                  ? { color: colors.onPrimary }
                  : { color: colors.onBackground },
              ]}
            >
              📁 Gallery
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedSource === 'camera' && [
                styles.segmentButtonActive,
                { backgroundColor: colors.primary },
              ],
            ]}
            onPress={() => handleSourceChange('camera')}
          >
            <Text
              style={[
                styles.segmentText,
                selectedSource === 'camera'
                  ? { color: colors.onPrimary }
                  : { color: colors.onBackground },
              ]}
            >
              📷 Camera
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Photo Grid */}
      <Animated.View style={[styles.gridContainer, gridAnimatedStyle]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.onBackground }]}>
              Loading photos...
            </Text>
          </View>
        ) : photos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.onBackground }]}>
              No photos found in your gallery
            </Text>
          </View>
        ) : (
          <FlatList
            data={photos}
            renderItem={renderPhotoItem}
            keyExtractor={item => item.id}
            numColumns={GRID_COLUMNS}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>

      {/* Bottom Actions */}
      {selectedPhotos.length > 0 && (
        <View
          style={[styles.bottomActions, { backgroundColor: colors.surface }]}
        >
          <ElevatedButton
            title={`Edit ${selectedPhotos.length} Photo${
              selectedPhotos.length > 1 ? 's' : ''
            }`}
            onPress={handleContinue}
            style={styles.continueButton}
          />
        </View>
      )}

      {/* Floating Camera Button */}
      <Animated.View style={[styles.fabContainer, fabAnimatedStyle]}>
        <IconButton
          icon={<Text style={{ fontSize: 24 }}>📷</Text>}
          onPress={handleCameraPress}
          size={56}
          style={[styles.fab, { backgroundColor: colors.primary }]}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.headline2,
    fontWeight: '600',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  selectionCount: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
  },
  sourceSelector: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 2,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 6,
    alignItems: 'center',
  },
  segmentButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    ...TYPOGRAPHY.body2,
    fontWeight: '500',
  },
  gridContainer: {
    flex: 1,
  },
  gridContent: {
    padding: GRID_SPACING,
  },
  photoItemContainer: {
    margin: GRID_SPACING / 2,
  },
  photoTouchable: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    flex: 1,
    borderRadius: 8,
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomActions: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  continueButton: {
    width: '100%',
  },
  fabContainer: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
  },
  fab: {
    elevation: 6,
    shadowColor: '#6200EE',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body1,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    ...TYPOGRAPHY.body1,
    textAlign: 'center',
    opacity: 0.6,
  },
});
