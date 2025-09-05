import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
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
import { triggerHapticFeedback } from '../utils/accessibility';
import { IconButton } from '../components/common/IconButton';
import { Toolbar } from '../components/common/Toolbar';
import {
  TextTool,
  BlurTool,
  FilterTool,
  CropTool,
  RotateTool,
} from '../components/editor';
import { TYPOGRAPHY } from '../constants/typography';
import { SPACING } from '../constants/spacing';

const { width, height } = Dimensions.get('window');

type EditorScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Editor'
>;
type EditorScreenRouteProp = RouteProp<RootStackParamList, 'Editor'>;

interface EditingTool {
  id: string;
  name: string;
  icon: string;
  isPremium?: boolean;
}

const EDITING_TOOLS: EditingTool[] = [
  { id: 'text', name: 'Text', icon: '📝' },
  { id: 'blur', name: 'Blur', icon: '🌫️' },
  { id: 'filters', name: 'Filters', icon: '🎨' },
  { id: 'crop', name: 'Crop', icon: '✂️' },
  { id: 'rotate', name: 'Rotate', icon: '🔄' },
  { id: 'brightness', name: 'Adjust', icon: '☀️' },
  { id: 'sticker', name: 'Stickers', icon: '🎯', isPremium: true },
  { id: 'effects', name: 'Effects', icon: '✨', isPremium: true },
];

export const EditorScreen: React.FC = () => {
  const navigation = useNavigation<EditorScreenNavigationProp>();
  const route = useRoute<EditorScreenRouteProp>();
  const { colors } = useTheme();

  const { imageUri, projectId } = route.params;
  // Keep current image URI to reflect edits (e.g., cropping)
  const [currentImageUri, setCurrentImageUri] = useState<string>(imageUri);

  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showToolOptions, setShowToolOptions] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(false);

  // Tool-specific states
  const [textElements, setTextElements] = useState<any[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<any[]>([]);
  const [blurAreas, setBlurAreas] = useState<any[]>([]);
  const [editHistory, setEditHistory] = useState<any[]>([]);
  const [currentEditIndex, setCurrentEditIndex] = useState(-1);
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);

  // Animation values
  const toolbarTranslateY = useSharedValue(0);
  const canvasScale = useSharedValue(1);
  const canvasTranslateX = useSharedValue(0);
  const canvasTranslateY = useSharedValue(0);
  const toolCategoriesTranslateY = useSharedValue(0);
  const toolOptionsTranslateY = useSharedValue(120);
  const gridOpacity = useSharedValue(0);

  useEffect(() => {
    startAnimations();
  }, []);

  useEffect(() => {
    if (selectedTool) {
      setShowToolOptions(true);
      toolOptionsTranslateY.value = withSpring(0, {
        damping: 20,
        stiffness: 100,
      });
    } else {
      toolOptionsTranslateY.value = withSpring(120, {
        damping: 20,
        stiffness: 100,
      });
      setTimeout(() => setShowToolOptions(false), 300);
    }
  }, [selectedTool]);

  const startAnimations = () => {
    // Initial animations
    toolbarTranslateY.value = withSpring(0, {
      damping: 15,
      stiffness: 100,
    });

    toolCategoriesTranslateY.value = withSpring(0, {
      damping: 20,
      stiffness: 100,
    });
  };

  const toolbarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toolbarTranslateY.value }],
  }));

  const canvasAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: canvasScale.value },
      { translateX: canvasTranslateX.value },
      { translateY: canvasTranslateY.value },
    ],
  }));

  const toolCategoriesAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toolCategoriesTranslateY.value }],
  }));

  const toolOptionsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toolOptionsTranslateY.value }],
  }));

  const gridAnimatedStyle = useAnimatedStyle(() => ({
    opacity: gridOpacity.value,
  }));

  const handleBack = () => {
    Alert.alert(
      'Exit Editor',
      'Are you sure you want to exit? Any unsaved changes will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  };

  const addToHistory = (action: any) => {
    const newHistory = editHistory.slice(0, currentEditIndex + 1);
    newHistory.push(action);
    setEditHistory(newHistory);
    setCurrentEditIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (currentEditIndex >= 0) {
      const action = editHistory[currentEditIndex];

      // Reverse the action based on type
      switch (action.type) {
        case 'ADD_TEXT':
          setTextElements(prev => prev.filter(el => el.id !== action.data.id));
          break;
        case 'ADD_FILTER':
          setAppliedFilters(prev => prev.filter(f => f.id !== action.data.id));
          break;
        case 'ADD_BLUR':
          setBlurAreas(prev => prev.filter(b => b.id !== action.data.id));
          break;
      }

      setCurrentEditIndex(currentEditIndex - 1);
      triggerHapticFeedback('medium');
    }
  };

  const handleRedo = () => {
    if (currentEditIndex < editHistory.length - 1) {
      const nextIndex = currentEditIndex + 1;
      const action = editHistory[nextIndex];

      // Reapply the action
      switch (action.type) {
        case 'ADD_TEXT':
          setTextElements(prev => [...prev, action.data]);
          break;
        case 'ADD_FILTER':
          setAppliedFilters(prev => [...prev, action.data]);
          break;
        case 'ADD_BLUR':
          setBlurAreas(prev => [...prev, action.data]);
          break;
      }

      setCurrentEditIndex(nextIndex);
      triggerHapticFeedback('medium');
    }
  };

  const handleSave = () => {
    const editData = {
      textElements,
      appliedFilters,
      blurAreas,
      zoom,
      pan,
    };

    navigation.navigate('SaveExport', {
      editedImageUri: currentImageUri,
      originalUri: imageUri,
      editData,
      hasEdits:
        textElements.length > 0 ||
        appliedFilters.length > 0 ||
        blurAreas.length > 0,
    });

    triggerHapticFeedback('heavy');
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share');
  };

  const getImageDimensions = async (uri: string): Promise<{width: number, height: number}> => {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => {
          resolve({ width, height });
        },
        error => {
          console.error('Failed to get image dimensions:', error);
          reject(error);
        },
      );
    });
  };

  const handleToolSelect = async (toolId: string) => {
    if (selectedTool === toolId) {
      setSelectedTool(null);
    } else {
      setSelectedTool(toolId);
      
      // If crop tool is selected, get image dimensions
      if ((toolId === 'crop' || toolId === 'rotate') && currentImageUri && !imageDimensions) {
        try {
          const dimensions = await getImageDimensions(currentImageUri);
          setImageDimensions(dimensions);
          console.log('Image dimensions loaded:', dimensions);
        } catch (error) {
          console.error('Failed to load image dimensions:', error);
        }
      }
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 3);
    setZoom(newZoom);
    canvasScale.value = withSpring(newZoom, {
      damping: 15,
      stiffness: 100,
    });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.5);
    setZoom(newZoom);
    canvasScale.value = withSpring(newZoom, {
      damping: 15,
      stiffness: 100,
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    canvasScale.value = withSpring(1, {
      damping: 20,
      stiffness: 100,
    });
    canvasTranslateX.value = withSpring(0, {
      damping: 20,
      stiffness: 100,
    });
    canvasTranslateY.value = withSpring(0, {
      damping: 20,
      stiffness: 100,
    });
  };

  const toggleGrid = () => {
    const newGridState = !showGrid;
    setShowGrid(newGridState);
    gridOpacity.value = withTiming(newGridState ? 0.3 : 0, { duration: 300 });
  };

  const renderToolButton = (tool: EditingTool) => {
    const isSelected = selectedTool === tool.id;
    const scale = useSharedValue(isSelected ? 1.2 : 1);

    const toolAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <TouchableOpacity
        key={tool.id}
        style={[
          styles.toolButton,
          isSelected && [
            styles.toolButtonActive,
            { backgroundColor: colors.primary + '20' },
          ],
        ]}
        onPress={() => handleToolSelect(tool.id)}
        activeOpacity={0.8}
      >
        <Animated.Text
          style={[
            styles.toolIcon,
            toolAnimatedStyle,
            isSelected && { color: colors.primary },
          ]}
        >
          {tool.icon}
        </Animated.Text>
        {tool.isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>⭐</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderToolOptions = () => {
    if (!selectedTool) return null;

    const tool = EDITING_TOOLS.find(t => t.id === selectedTool);
    if (!tool) return null;

    const renderToolComponent = () => {
      switch (selectedTool) {
        case 'text':
          return (
            <TextTool
              onTextChange={text => {
                // Update current text element being edited
              }}
              onFontSizeChange={size => {
                // Update font size of current text element
              }}
              onColorChange={color => {
                // Update color of current text element
              }}
              onAlignmentChange={alignment => {
                // Update alignment of current text element
              }}
              onEffectChange={effect => {
                // Update effect of current text element
              }}
              onApply={() => {
                const newTextElement = {
                  id: Date.now().toString(),
                  text: 'Sample Text',
                  fontSize: 24,
                  color: '#000000',
                  x: 50,
                  y: 50,
                  alignment: 'center',
                  effect: 'none',
                };

                setTextElements(prev => [...prev, newTextElement]);
                addToHistory({ type: 'ADD_TEXT', data: newTextElement });
                setSelectedTool(null);
                triggerHapticFeedback('heavy');
              }}
              onCancel={() => setSelectedTool(null)}
            />
          );

        case 'blur':
          return (
            <BlurTool
              onBrushSizeChange={size => {
                // Update current brush size
              }}
              onIntensityChange={intensity => {
                // Update blur intensity
              }}
              onUndo={() => {
                // Remove last blur stroke
                if (blurAreas.length > 0) {
                  setBlurAreas(prev => prev.slice(0, -1));
                }
              }}
              onApply={() => {
                const newBlurArea = {
                  id: Date.now().toString(),
                  brushSize: 25,
                  intensity: 50,
                  strokes: [],
                };

                setBlurAreas(prev => [...prev, newBlurArea]);
                addToHistory({ type: 'ADD_BLUR', data: newBlurArea });
                setSelectedTool(null);
                triggerHapticFeedback('heavy');
              }}
              onCancel={() => setSelectedTool(null)}
            />
          );

        case 'filters':
          return (
            <FilterTool
              onFilterSelect={(filterId, intensity) => {
                // Apply filter preview
              }}
              onIntensityChange={intensity => {
                // Update filter intensity
              }}
              onApply={() => {
                const newFilter = {
                  id: Date.now().toString(),
                  filterId: 'sepia',
                  intensity: 50,
                };

                setAppliedFilters(prev => [...prev, newFilter]);
                addToHistory({ type: 'ADD_FILTER', data: newFilter });
                setSelectedTool(null);
                triggerHapticFeedback('heavy');
              }}
              onCancel={() => setSelectedTool(null)}
            />
          );

        case 'crop':
          return (
            <CropTool
              imageUri={currentImageUri}
              imageWidth={width * 0.8}
              imageHeight={height * 0.6}
              actualImageWidth={imageDimensions?.width}
              actualImageHeight={imageDimensions?.height}
              onCropChange={cropData => {
                // Handle crop preview changes
                console.log('Crop changed:', cropData);
              }}
              onApply={async cropData => {
                try {
                  console.log('🔄 Applying crop with data:', cropData);
                  console.log('📷 Image URI:', currentImageUri);

                  // Apply crop transformation using image processor
                  const { imageProcessor } = await import(
                    '../services/imageProcessor'
                  );

                  const result = await imageProcessor.processImage(currentImageUri, [
                    {
                      type: 'crop',
                      x: cropData.x,
                      y: cropData.y,
                      width: cropData.width,
                      height: cropData.height,
                    },
                  ]);

                  console.log('✅ Crop applied successfully:', result);

                  // Update the image URI with the cropped result
                  if (result.processedUri && result.processedUri !== currentImageUri) {
                    setCurrentImageUri(result.processedUri);
                    try {
                      const dims = await getImageDimensions(result.processedUri);
                      setImageDimensions(dims);
                    } catch (_e) {}
                    console.log('📸 New cropped image URI:', result.processedUri);
                  }

                  addToHistory({ type: 'CROP', data: cropData });
                  setSelectedTool(null);
                  triggerHapticFeedback('heavy');

                  Alert.alert('Success', 'Image cropped successfully!');
                } catch (error) {
                  console.error('❌ Failed to apply crop:', error);
                  Alert.alert(
                    'Crop Error',
                    `Failed to crop image: ${error.message}\n\nPlease try again or select a different crop area.`,
                  );
                }
              }}
              onCancel={() => setSelectedTool(null)}
            />
          );

        case 'rotate':
          return (
            <RotateTool
              imageUri={currentImageUri}
              onRotate={async (processedUri, finalize) => {
                try {
                  // Update canvas to show the rotated image
                  setCurrentImageUri(processedUri);
                  try {
                    const dims = await getImageDimensions(processedUri);
                    setImageDimensions(dims);
                  } catch (_e) {}

                  addToHistory({
                    type: 'ROTATE',
                    data: { uri: processedUri },
                  });

                  if (finalize) {
                    setSelectedTool(null);
                    triggerHapticFeedback('heavy');
                  }
                } catch (error) {
                  console.error('Failed to apply rotation:', error);
                  Alert.alert('Error', 'Failed to apply rotation');
                }
              }}
              outputWidth={imageDimensions?.width}
              outputHeight={imageDimensions?.height}
              onCancel={() => setSelectedTool(null)}
            />
          );

        case 'brightness':
          return (
            <View style={styles.adjustTool}>
              <Text style={[styles.toolTitle, { color: colors.onBackground }]}>
                Adjust Image
              </Text>
              <Text style={[styles.toolSubtitle, { color: colors.onSurface }]}>
                Fine-tune brightness, contrast, and saturation
              </Text>
              <View style={styles.toolActions}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    { backgroundColor: colors.surface },
                  ]}
                  onPress={() => setSelectedTool(null)}
                >
                  <Text
                    style={[styles.cancelText, { color: colors.onBackground }]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.applyButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => {
                    setSelectedTool(null);
                    triggerHapticFeedback('heavy');
                  }}
                >
                  <Text style={[styles.applyText, { color: colors.onPrimary }]}>
                    Apply
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );

        default:
          return (
            <View style={styles.placeholderTool}>
              <Text
                style={[styles.placeholderText, { color: colors.onBackground }]}
              >
                {tool.name} tool coming soon!
              </Text>
              <TouchableOpacity
                style={[
                  styles.placeholderButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => setSelectedTool(null)}
              >
                <Text
                  style={[
                    styles.placeholderButtonText,
                    { color: colors.onPrimary },
                  ]}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          );
      }
    };

    return (
      <View
        style={[styles.toolOptionsPanel, { backgroundColor: colors.surface }]}
      >
        {renderToolComponent()}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Top Toolbar */}
      <Animated.View style={toolbarAnimatedStyle}>
        <Toolbar
          style={[styles.topToolbar, { backgroundColor: colors.surface }]}
        >
          <View style={styles.toolbarLeft}>
            <IconButton
              icon={<Text style={{ fontSize: 20 }}>←</Text>}
              onPress={handleBack}
            />
          </View>

          <View style={styles.toolbarCenter}>
            <TouchableOpacity onPress={handleUndo} style={styles.toolbarButton}>
              <Text
                style={[
                  styles.toolbarButtonText,
                  { color: colors.onBackground },
                ]}
              >
                ↻
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRedo} style={styles.toolbarButton}>
              <Text
                style={[
                  styles.toolbarButtonText,
                  { color: colors.onBackground },
                ]}
              >
                ↺
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toolbarRight}>
            <TouchableOpacity onPress={handleSave} style={styles.toolbarButton}>
              <Text
                style={[styles.toolbarButtonText, { color: colors.primary }]}
              >
                💾
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              style={styles.toolbarButton}
            >
              <Text
                style={[
                  styles.toolbarButtonText,
                  { color: colors.onBackground },
                ]}
              >
                📤
              </Text>
            </TouchableOpacity>
          </View>
        </Toolbar>
      </Animated.View>

      {/* Canvas Area */}
      <View style={styles.canvasContainer}>
        <Animated.View style={[styles.canvas, canvasAnimatedStyle]}>
          {/* Selected Image */}
          {currentImageUri ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: currentImageUri }}
                style={styles.selectedImage}
                resizeMode="contain"
              />

              {/* Text Elements Overlay */}
              {textElements.map(textElement => (
                <View
                  key={textElement.id}
                  style={[
                    styles.textOverlay,
                    {
                      left: textElement.x,
                      top: textElement.y,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.overlayText,
                      {
                        fontSize: textElement.fontSize,
                        color: textElement.color,
                        textAlign: textElement.alignment,
                      },
                    ]}
                  >
                    {textElement.text}
                  </Text>
                </View>
              ))}

              {/* Filter Indicator */}
              {appliedFilters.length > 0 && (
                <View style={styles.filterIndicator}>
                  <Text
                    style={[styles.indicatorText, { color: colors.onPrimary }]}
                  >
                    {appliedFilters.length} Filter
                    {appliedFilters.length > 1 ? 's' : ''}
                  </Text>
                </View>
              )}

              {/* Blur Areas Indicator */}
              {blurAreas.length > 0 && (
                <View style={[styles.blurIndicator, { top: 40 }]}>
                  <Text
                    style={[styles.indicatorText, { color: colors.onPrimary }]}
                  >
                    Blur Applied
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>🖼️</Text>
              <Text
                style={[
                  styles.imagePlaceholderSubtext,
                  { color: colors.onBackground },
                ]}
              >
                Image Canvas
              </Text>
            </View>
          )}

          {/* Grid overlay */}
          <Animated.View style={[styles.gridOverlay, gridAnimatedStyle]}>
            {Array.from({ length: 9 }, (_, i) => (
              <View key={i} style={styles.gridLine} />
            ))}
          </Animated.View>
        </Animated.View>

        {/* Canvas controls */}
        <View style={styles.canvasControls}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: colors.surface }]}
            onPress={handleZoomOut}
          >
            <Text
              style={[styles.controlButtonText, { color: colors.onBackground }]}
            >
              🔍-
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: colors.surface }]}
            onPress={toggleGrid}
          >
            <Text
              style={[styles.controlButtonText, { color: colors.onBackground }]}
            >
              {showGrid ? '⊞' : '⊟'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: colors.surface }]}
            onPress={handleZoomIn}
          >
            <Text
              style={[styles.controlButtonText, { color: colors.onBackground }]}
            >
              🔍+
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: colors.surface }]}
            onPress={handleResetZoom}
          >
            <Text
              style={[styles.controlButtonText, { color: colors.onBackground }]}
            >
              ⟲
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tool Categories Bar */}
      <Animated.View
        style={[
          styles.toolCategoriesBar,
          toolCategoriesAnimatedStyle,
          { backgroundColor: colors.surface },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolCategoriesScroll}
        >
          {EDITING_TOOLS.map(renderToolButton)}
        </ScrollView>
      </Animated.View>

      {/* Tool Options Panel */}
      {showToolOptions && (
        <Animated.View
          style={[styles.toolOptionsPanel, toolOptionsAnimatedStyle]}
        >
          {renderToolOptions()}
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topToolbar: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  toolbarLeft: {
    flex: 1,
  },
  toolbarCenter: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  toolbarButton: {
    padding: SPACING.sm,
    marginHorizontal: SPACING.xs,
  },
  toolbarButtonText: {
    fontSize: 18,
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
  },
  canvas: {
    flex: 1,
    margin: SPACING.md,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  selectedImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  textOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: SPACING.xs,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#6200EE',
    borderStyle: 'dashed',
  },
  overlayText: {
    ...TYPOGRAPHY.body1,
  },
  filterIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#6200EE',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  blurIndicator: {
    position: 'absolute',
    right: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  indicatorText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  imagePlaceholderSubtext: {
    ...TYPOGRAPHY.body1,
    opacity: 0.7,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridLine: {
    width: '33.333%',
    height: '33.333%',
    borderWidth: 1,
    borderColor: '#ffffff',
    opacity: 0.5,
  },
  canvasControls: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'column',
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  toolCategoriesBar: {
    height: 80,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  toolCategoriesScroll: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  toolButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
    position: 'relative',
  },
  toolButtonActive: {
    borderWidth: 2,
    borderColor: '#6200EE',
  },
  toolIcon: {
    fontSize: 24,
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumText: {
    fontSize: 10,
  },
  toolOptionsPanel: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    height: 120,
  },
  toolOptionsContent: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: SPACING.md,
  },
  toolOptionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  toolOptionsTitle: {
    ...TYPOGRAPHY.headline2,
    fontWeight: '600',
  },
  toolOptionsScroll: {
    paddingRight: SPACING.lg,
  },
  toolOptionItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  toolOptionIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  toolOptionText: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
  },
  placeholderTool: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  placeholderText: {
    ...TYPOGRAPHY.body1,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  placeholderButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  placeholderButtonText: {
    ...TYPOGRAPHY.body1,
    fontWeight: '500',
  },
  // Tool-specific styles
  toolTitle: {
    ...TYPOGRAPHY.headline2,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  toolSubtitle: {
    ...TYPOGRAPHY.body2,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    opacity: 0.8,
  },
  toolActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    ...TYPOGRAPHY.body1,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyText: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
  },

  // Adjust tool styles
  adjustTool: {
    padding: SPACING.lg,
  },
});
