import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../utils/theme';
import { useImageProcessing } from '../hooks/useImageProcessing';
import { useUserPreferences } from '../hooks/useStorage';
import { ImageOperation } from '../services/imageProcessor';
import { IconButton } from '../components/common/IconButton';
import { ElevatedButton } from '../components/common/ElevatedButton';
import { Toolbar } from '../components/common/Toolbar';
import { Card } from '../components/common/Card';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import { TYPOGRAPHY } from '../constants/typography';
import { SPACING } from '../constants/spacing';

const { width } = Dimensions.get('window');

type SaveExportScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SaveExport'>;
type SaveExportScreenRouteProp = RouteProp<RootStackParamList, 'SaveExport'>;

export const SaveExportScreen: React.FC = () => {
  const navigation = useNavigation<SaveExportScreenNavigationProp>();
  const route = useRoute<SaveExportScreenRouteProp>();
  const { colors } = useTheme();
  const { processImage, isProcessing, progress, currentOperation } = useImageProcessing();
  const { preferences, updatePreferences } = useUserPreferences();

  const { editedImageUri, originalUri } = route.params;

  const [quality, setQuality] = useState(preferences.qualityPreference || 90);
  const [format, setFormat] = useState<'jpeg' | 'png'>(preferences.formatPreference || 'jpeg');
  const [resolution, setResolution] = useState<'original' | 'hd' | '4k'>('original');
  const [saveLocation, setSaveLocation] = useState<'gallery' | 'app'>('gallery');
  const [isSuccess, setIsSuccess] = useState(false);

  // Animation values
  const headerTranslateY = useSharedValue(-100);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);
  const progressWidth = useSharedValue(0);
  const successScale = useSharedValue(0);
  const successOpacity = useSharedValue(0);
  const shareSheetTranslateY = useSharedValue(200);

  useEffect(() => {
    startAnimations();
  }, []);

  useEffect(() => {
    if (isSuccess) {
      showSuccessAnimation();
    }
  }, [isSuccess]);

  const startAnimations = () => {
    // Header animation
    headerTranslateY.value = withSpring(0, {
      damping: 15,
      stiffness: 100,
    });

    // Content animation
    setTimeout(() => {
      contentOpacity.value = withTiming(1, { duration: 600 });
      contentTranslateY.value = withSpring(0, {
        damping: 20,
        stiffness: 100,
      });
    }, 200);
  };

  const showSuccessAnimation = () => {
    successOpacity.value = withTiming(1, { duration: 300 });
    successScale.value = withSpring(1, {
      damping: 12,
      stiffness: 150,
      mass: 1,
    });

    setTimeout(() => {
      navigation.goBack();
    }, 2000);
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: interpolate(progressWidth.value, [0, 100], [0, width - SPACING.xl * 2]),
  }));

  const successAnimatedStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
    transform: [{ scale: successScale.value }],
  }));

  const shareSheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: shareSheetTranslateY.value }],
  }));

  const handleBack = () => {
    navigation.goBack();
  };

  const handleExport = async () => {
    try {
      // Save user preferences
      await updatePreferences({
        qualityPreference: quality,
        formatPreference: format,
      });

      // Prepare operations based on user selections
      const operations: ImageOperation[] = [];

      // Add resolution operation if not original
      if (resolution !== 'original') {
        const dimensions = resolution === 'hd' ? { width: 1920, height: 1080 } : { width: 3840, height: 2160 };
        operations.push({ type: 'resize', width: dimensions.width, height: dimensions.height });
      }

      // Process the image
      const result = await processImage(editedImageUri, operations, {
        quality,
        format,
        generateThumbnail: true,
      });

      if (result) {
        console.log('Image processed successfully:', result);
        setIsSuccess(true);
      } else {
        Alert.alert('Export Failed', 'Unable to process the image. Please try again.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'An error occurred while exporting your image.');
    }
  };

  const handleShare = () => {
    shareSheetTranslateY.value = withSpring(0, {
      damping: 20,
      stiffness: 100,
    });

    setTimeout(() => {
      shareSheetTranslateY.value = withSpring(200, {
        damping: 20,
        stiffness: 100,
      });
    }, 2000);
  };

  const renderQualitySlider = () => (
    <Card style={styles.optionCard}>
      <Text style={[styles.optionTitle, { color: colors.onBackground }]}>
        Quality: {quality}%
      </Text>
      <View style={styles.sliderContainer}>
        <TouchableOpacity
          style={[styles.sliderTrack, { backgroundColor: colors.surface }]}
          onPress={(event) => {
            const { locationX } = event.nativeEvent;
            const trackWidth = width - SPACING.xl * 4;
            const newQuality = Math.round((locationX / trackWidth) * 50 + 50);
            setQuality(Math.max(50, Math.min(100, newQuality)));
          }}
        >
          <View
            style={[
              styles.sliderFill,
              {
                width: `${((quality - 50) / 50) * 100}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
          <View
            style={[
              styles.sliderThumb,
              {
                left: `${((quality - 50) / 50) * 100}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.sliderLabels}>
        <Text style={[styles.sliderLabel, { color: colors.onSurface }]}>50%</Text>
        <Text style={[styles.sliderLabel, { color: colors.onSurface }]}>100%</Text>
      </View>
    </Card>
  );

  const renderFormatSelector = () => (
    <Card style={styles.optionCard}>
      <Text style={[styles.optionTitle, { color: colors.onBackground }]}>
        Format
      </Text>
      <View style={styles.formatButtons}>
        <TouchableOpacity
          style={[
            styles.formatButton,
            format === 'jpeg' && [styles.formatButtonActive, { backgroundColor: colors.primary }],
            { backgroundColor: format === 'jpeg' ? colors.primary : colors.surface },
          ]}
          onPress={() => setFormat('jpeg')}
        >
          <Text
            style={[
              styles.formatButtonText,
              { color: format === 'jpeg' ? colors.onPrimary : colors.onBackground },
            ]}
          >
            JPEG
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.formatButton,
            format === 'png' && [styles.formatButtonActive, { backgroundColor: colors.primary }],
            { backgroundColor: format === 'png' ? colors.primary : colors.surface },
          ]}
          onPress={() => setFormat('png')}
        >
          <Text
            style={[
              styles.formatButtonText,
              { color: format === 'png' ? colors.onPrimary : colors.onBackground },
            ]}
          >
            PNG
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderResolutionSelector = () => (
    <Card style={styles.optionCard}>
      <Text style={[styles.optionTitle, { color: colors.onBackground }]}>
        Resolution
      </Text>
      <View style={styles.resolutionButtons}>
        {[
          { key: 'original', label: 'Original', desc: 'Keep original size' },
          { key: 'hd', label: 'HD (1920x1080)', desc: 'High definition' },
          { key: '4k', label: '4K (3840x2160)', desc: 'Ultra high definition' },
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.resolutionButton,
              resolution === option.key && [styles.resolutionButtonActive, { borderColor: colors.primary }],
              { backgroundColor: colors.surface },
            ]}
            onPress={() => setResolution(option.key as any)}
          >
            <Text
              style={[
                styles.resolutionButtonTitle,
                { color: colors.onBackground },
              ]}
            >
              {option.label}
            </Text>
            <Text
              style={[
                styles.resolutionButtonDesc,
                { color: colors.onSurface },
              ]}
            >
              {option.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );

  const renderSaveLocation = () => (
    <Card style={styles.optionCard}>
      <Text style={[styles.optionTitle, { color: colors.onBackground }]}>
        Save Location
      </Text>
      <View style={styles.locationButtons}>
        <TouchableOpacity
          style={[
            styles.locationButton,
            saveLocation === 'gallery' && [styles.locationButtonActive, { backgroundColor: colors.primary }],
            { backgroundColor: saveLocation === 'gallery' ? colors.primary : colors.surface },
          ]}
          onPress={() => setSaveLocation('gallery')}
        >
          <Text style={styles.locationIcon}>🖼️</Text>
          <Text
            style={[
              styles.locationButtonText,
              { color: saveLocation === 'gallery' ? colors.onPrimary : colors.onBackground },
            ]}
          >
            Gallery
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.locationButton,
            saveLocation === 'app' && [styles.locationButtonActive, { backgroundColor: colors.primary }],
            { backgroundColor: saveLocation === 'app' ? colors.primary : colors.surface },
          ]}
          onPress={() => setSaveLocation('app')}
        >
          <Text style={styles.locationIcon}>📱</Text>
          <Text
            style={[
              styles.locationButtonText,
              { color: saveLocation === 'app' ? colors.onPrimary : colors.onBackground },
            ]}
          >
            App Folder
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (isSuccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Animated.View style={[styles.successContainer, successAnimatedStyle]}>
          <View style={[styles.successCircle, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.successCheckmark}>✓</Text>
          </View>
          <Text style={[styles.successTitle, { color: colors.onBackground }]}>
            Export Complete!
          </Text>
          <Text style={[styles.successSubtitle, { color: colors.onSurface }]}>
            Your image has been saved successfully
          </Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View style={headerAnimatedStyle}>
        <Toolbar style={styles.header}>
          <View style={styles.headerLeft}>
            <IconButton
              icon={<Text style={{ fontSize: 20 }}>←</Text>}
              onPress={handleBack}
            />
          </View>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.onBackground }]}>
              Save & Export
            </Text>
          </View>
          <View style={styles.headerRight}>
            <IconButton
              icon={<Text style={{ fontSize: 20 }}>📤</Text>}
              onPress={handleShare}
            />
          </View>
        </Toolbar>
      </Animated.View>

      {/* Content */}
      <Animated.View style={[styles.content, contentAnimatedStyle]}>
        {/* Preview */}
        <Card style={styles.previewCard}>
          <View style={styles.previewImage}>
            <Text style={styles.previewPlaceholder}>🖼️</Text>
          </View>
          <Text style={[styles.previewText, { color: colors.onBackground }]}>
            Preview
          </Text>
        </Card>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {renderQualitySlider()}
          {renderFormatSelector()}
          {renderResolutionSelector()}
          {renderSaveLocation()}
        </View>

        {/* Export Progress */}
        {isProcessing && (
          <Card style={styles.progressCard}>
            <Text style={[styles.progressTitle, { color: colors.onBackground }]}>
              {currentOperation || 'Processing...'} {Math.round(progress)}%
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  progressAnimatedStyle,
                  { backgroundColor: colors.primary },
                ]}
              />
            </View>
          </Card>
        )}
      </Animated.View>

      {/* Action Button */}
      <View style={[styles.actionContainer, { backgroundColor: colors.surface }]}>
        <ElevatedButton
          title={isProcessing ? 'Processing...' : 'Export Image'}
          onPress={handleExport}
          disabled={isProcessing}
          style={styles.exportButton}
        />
      </View>

      {/* Share Sheet */}
      <Animated.View style={[styles.shareSheet, shareSheetAnimatedStyle]}>
        <View style={[styles.shareSheetContent, { backgroundColor: colors.surface }]}>
          <Text style={[styles.shareSheetTitle, { color: colors.onBackground }]}>
            Share Image
          </Text>
          <View style={styles.shareOptions}>
            <TouchableOpacity style={[styles.shareOption, { backgroundColor: colors.background }]}>
              <Text style={styles.shareOptionIcon}>📱</Text>
              <Text style={[styles.shareOptionText, { color: colors.onBackground }]}>Messages</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareOption, { backgroundColor: colors.background }]}>
              <Text style={styles.shareOptionIcon}>📧</Text>
              <Text style={[styles.shareOptionText, { color: colors.onBackground }]}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareOption, { backgroundColor: colors.background }]}>
              <Text style={styles.shareOptionIcon}>📘</Text>
              <Text style={[styles.shareOptionText, { color: colors.onBackground }]}>Facebook</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  previewCard: {
    alignItems: 'center',
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  previewImage: {
    width: 120,
    height: 120,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  previewPlaceholder: {
    fontSize: 40,
  },
  previewText: {
    ...TYPOGRAPHY.body2,
  },
  optionsContainer: {
    flex: 1,
  },
  optionCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  optionTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  sliderContainer: {
    marginBottom: SPACING.sm,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    ...TYPOGRAPHY.caption,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  formatButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  formatButtonActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formatButtonText: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
  },
  resolutionButtons: {
    gap: SPACING.sm,
  },
  resolutionButton: {
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  resolutionButtonActive: {
    borderWidth: 2,
  },
  resolutionButtonTitle: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
    marginBottom: 2,
  },
  resolutionButtonDesc: {
    ...TYPOGRAPHY.caption,
  },
  locationButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  locationButton: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  locationButtonActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  locationButtonText: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
  },
  progressCard: {
    padding: SPACING.lg,
    marginTop: SPACING.lg,
  },
  progressTitle: {
    ...TYPOGRAPHY.body2,
    marginBottom: SPACING.md,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  actionContainer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  exportButton: {
    width: '100%',
  },
  shareSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  shareSheetContent: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: SPACING.lg,
  },
  shareSheetTitle: {
    ...TYPOGRAPHY.headline2,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  shareOption: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareOptionIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  shareOptionText: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  successCheckmark: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  successTitle: {
    ...TYPOGRAPHY.headline1,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  successSubtitle: {
    ...TYPOGRAPHY.body1,
    textAlign: 'center',
    opacity: 0.8,
  },
});
