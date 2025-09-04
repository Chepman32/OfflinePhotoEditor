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
import { IconButton } from '../components/common/IconButton';
import { Toolbar } from '../components/common/Toolbar';
import { TextTool, BlurTool, FilterTool } from '../components/editor';
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

  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showToolOptions, setShowToolOptions] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(false);

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

  const handleUndo = () => {
    // TODO: Implement undo functionality
    console.log('Undo');
  };

  const handleRedo = () => {
    // TODO: Implement redo functionality
    console.log('Redo');
  };

  const handleSave = () => {
    navigation.navigate('SaveExport', {
      editedImageUri: imageUri,
      originalUri: imageUri,
    });
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share');
  };

  const handleToolSelect = (toolId: string) => {
    if (selectedTool === toolId) {
      setSelectedTool(null);
    } else {
      setSelectedTool(toolId);
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
              onTextChange={text => console.log('Text changed:', text)}
              onFontSizeChange={size => console.log('Font size changed:', size)}
              onColorChange={color => console.log('Color changed:', color)}
              onAlignmentChange={alignment =>
                console.log('Alignment changed:', alignment)
              }
              onEffectChange={effect => console.log('Effect changed:', effect)}
              onApply={() => {
                setSelectedTool(null);
                console.log('Text applied');
              }}
              onCancel={() => setSelectedTool(null)}
            />
          );

        case 'blur':
          return (
            <BlurTool
              onBrushSizeChange={size =>
                console.log('Brush size changed:', size)
              }
              onIntensityChange={intensity =>
                console.log('Intensity changed:', intensity)
              }
              onUndo={() => console.log('Undo last stroke')}
              onApply={() => {
                setSelectedTool(null);
                console.log('Blur applied');
              }}
              onCancel={() => setSelectedTool(null)}
            />
          );

        case 'filters':
          return (
            <FilterTool
              onFilterSelect={(filterId, intensity) =>
                console.log('Filter selected:', filterId, intensity)
              }
              onIntensityChange={intensity =>
                console.log('Filter intensity changed:', intensity)
              }
              onApply={() => {
                setSelectedTool(null);
                console.log('Filter applied');
              }}
              onCancel={() => setSelectedTool(null)}
            />
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
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.selectedImage}
              resizeMode="contain"
            />
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
  selectedImage: {
    flex: 1,
    width: '100%',
    height: '100%',
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
});
