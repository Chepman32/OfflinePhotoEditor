import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../../utils/theme';
import {
  triggerHapticFeedback,
  useAccessibility,
} from '../../utils/accessibility';
import { ElevatedButton } from '../common/ElevatedButton';
import { Card } from '../common/Card';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

interface TextToolProps {
  initialText?: string;
  initialFontSize?: number;
  initialColor?: string;
  onTextChange: (text: string) => void;
  onFontSizeChange: (size: number) => void;
  onColorChange: (color: string) => void;
  onAlignmentChange: (alignment: 'left' | 'center' | 'right') => void;
  onEffectChange: (effect: 'none' | 'shadow' | 'outline') => void;
  onApply: () => void;
  onCancel: () => void;
}

const FONTS = [
  'Roboto-Regular',
  'Roboto-Medium',
  'Roboto-Bold',
  'monospace',
  'serif',
];

const COLORS = [
  '#000000', // Black
  '#FFFFFF', // White
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
];

const EFFECTS = [
  { id: 'none', label: 'None', icon: '○' },
  { id: 'shadow', label: 'Shadow', icon: '◐' },
  { id: 'outline', label: 'Outline', icon: '◉' },
] as const;

export const TextTool: React.FC<TextToolProps> = ({
  initialText = '',
  initialFontSize = 24,
  initialColor = '#000000',
  onTextChange,
  onFontSizeChange,
  onColorChange,
  onAlignmentChange,
  onEffectChange,
  onApply,
  onCancel,
}) => {
  const { colors } = useTheme();
  const { reduceMotionEnabled } = useAccessibility();

  const [text, setText] = useState(initialText);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>(
    'center',
  );
  const [selectedEffect, setSelectedEffect] = useState<
    'none' | 'shadow' | 'outline'
  >('none');
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);

  // Animation values
  const colorPickerOpacity = useSharedValue(0);
  const fontPickerOpacity = useSharedValue(0);
  const effectPickerOpacity = useSharedValue(0);
  const previewScale = useSharedValue(1);

  const handleTextChange = (newText: string) => {
    setText(newText);
    onTextChange(newText);

    if (!reduceMotionEnabled) {
      previewScale.value = withSequence(
        withSpring(1.05, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 15, stiffness: 150 }),
      );
    }
  };

  const handleFontSizeChange = (size: number) => {
    const newSize = Math.max(12, Math.min(72, size));
    setFontSize(newSize);
    onFontSizeChange(newSize);
    triggerHapticFeedback('light');
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onColorChange(color);
    triggerHapticFeedback('light');

    if (!reduceMotionEnabled) {
      previewScale.value = withSequence(
        withSpring(1.1, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
    }
  };

  const handleAlignmentChange = (newAlignment: 'left' | 'center' | 'right') => {
    setAlignment(newAlignment);
    onAlignmentChange(newAlignment);
    triggerHapticFeedback('medium');
  };

  const handleEffectChange = (effect: 'none' | 'shadow' | 'outline') => {
    setSelectedEffect(effect);
    onEffectChange(effect);
    triggerHapticFeedback('medium');
  };

  const toggleColorPicker = () => {
    colorPickerOpacity.value =
      colorPickerOpacity.value === 0 ? withTiming(1) : withTiming(0);
  };

  const toggleFontPicker = () => {
    fontPickerOpacity.value =
      fontPickerOpacity.value === 0 ? withTiming(1) : withTiming(0);
  };

  const toggleEffectPicker = () => {
    effectPickerOpacity.value =
      effectPickerOpacity.value === 0 ? withTiming(1) : withTiming(0);
  };

  const colorPickerStyle = useAnimatedStyle(() => ({
    opacity: colorPickerOpacity.value,
    transform: [
      {
        translateY: interpolate(colorPickerOpacity.value, [0, 1], [-20, 0]),
      },
    ],
  }));

  const fontPickerStyle = useAnimatedStyle(() => ({
    opacity: fontPickerOpacity.value,
    transform: [
      {
        translateY: interpolate(fontPickerOpacity.value, [0, 1], [-20, 0]),
      },
    ],
  }));

  const effectPickerStyle = useAnimatedStyle(() => ({
    opacity: effectPickerOpacity.value,
    transform: [
      {
        translateY: interpolate(effectPickerOpacity.value, [0, 1], [-20, 0]),
      },
    ],
  }));

  const previewStyle = useAnimatedStyle(() => ({
    transform: [{ scale: previewScale.value }],
  }));

  const getTextAlignment = () => {
    switch (alignment) {
      case 'left':
        return 'left';
      case 'center':
        return 'center';
      case 'right':
        return 'right';
      default:
        return 'center';
    }
  };

  const getTextShadow = () => {
    if (selectedEffect === 'shadow') {
      return {
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
      };
    }
    return {};
  };

  const getTextOutline = () => {
    if (selectedEffect === 'outline') {
      return {
        textShadowColor: '#000000',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 2,
      };
    }
    return {};
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Text Preview */}
      <Card style={styles.previewCard}>
        <Animated.View style={[styles.previewContainer, previewStyle]}>
          <Text
            style={[
              styles.previewText,
              {
                fontSize: fontSize,
                color: selectedColor,
                textAlign: getTextAlignment(),
                fontFamily: selectedFont,
                ...getTextShadow(),
                ...getTextOutline(),
              },
            ]}
          >
            {text || 'Enter your text here...'}
          </Text>
        </Animated.View>
      </Card>

      {/* Text Input */}
      <Card style={styles.inputCard}>
        <TextInput
          style={[styles.textInput, { color: colors.onBackground }]}
          placeholder="Enter your text..."
          placeholderTextColor={colors.onSurface}
          value={text}
          onChangeText={handleTextChange}
          multiline
          maxLength={200}
        />
        <Text style={[styles.charCount, { color: colors.onSurface }]}>
          {text.length}/200
        </Text>
      </Card>

      {/* Font Size Slider */}
      <Card style={styles.sliderCard}>
        <Text style={[styles.sliderTitle, { color: colors.onBackground }]}>
          Font Size: {fontSize}px
        </Text>
        <View style={styles.sliderContainer}>
          <TouchableOpacity
            style={[styles.sliderTrack, { backgroundColor: colors.surface }]}
            onPress={event => {
              const { locationX } = event.nativeEvent;
              const trackWidth = 280; // Approximate width
              const newSize = Math.round((locationX / trackWidth) * 60 + 12);
              handleFontSizeChange(newSize);
            }}
          >
            <View
              style={[
                styles.sliderFill,
                {
                  width: `${((fontSize - 12) / 60) * 100}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
            <View
              style={[
                styles.sliderThumb,
                {
                  left: `${((fontSize - 12) / 60) * 100}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.sliderLabels}>
          <Text style={[styles.sliderLabel, { color: colors.onSurface }]}>
            12px
          </Text>
          <Text style={[styles.sliderLabel, { color: colors.onSurface }]}>
            72px
          </Text>
        </View>
      </Card>

      {/* Color Picker */}
      <Card style={styles.pickerCard}>
        <TouchableOpacity
          style={[styles.pickerHeader, { backgroundColor: colors.surface }]}
          onPress={toggleColorPicker}
        >
          <Text style={[styles.pickerTitle, { color: colors.onBackground }]}>
            Color
          </Text>
          <View
            style={[styles.colorPreview, { backgroundColor: selectedColor }]}
          />
          <Text style={[styles.pickerArrow, { color: colors.onBackground }]}>
            {colorPickerOpacity.value === 0 ? '▼' : '▲'}
          </Text>
        </TouchableOpacity>

        <Animated.View style={[styles.colorPicker, colorPickerStyle]}>
          <View style={styles.colorGrid}>
            {COLORS.map(color => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => handleColorSelect(color)}
                accessibilityLabel={`Select ${color} color`}
                accessibilityRole="button"
              />
            ))}
          </View>
        </Animated.View>
      </Card>

      {/* Alignment */}
      <Card style={styles.alignmentCard}>
        <Text style={[styles.cardTitle, { color: colors.onBackground }]}>
          Alignment
        </Text>
        <View style={styles.alignmentButtons}>
          {[
            { key: 'left', label: 'Left', icon: '⬅️' },
            { key: 'center', label: 'Center', icon: '⬌' },
            { key: 'right', label: 'Right', icon: '➡️' },
          ].map(option => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.alignmentButton,
                { backgroundColor: colors.surface },
                alignment === option.key && [
                  styles.alignmentButtonActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
              onPress={() => handleAlignmentChange(option.key as any)}
            >
              <Text style={styles.alignmentIcon}>{option.icon}</Text>
              <Text
                style={[
                  styles.alignmentLabel,
                  {
                    color:
                      alignment === option.key
                        ? colors.onPrimary
                        : colors.onBackground,
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Text Effects */}
      <Card style={styles.effectCard}>
        <TouchableOpacity
          style={[styles.pickerHeader, { backgroundColor: colors.surface }]}
          onPress={toggleEffectPicker}
        >
          <Text style={[styles.pickerTitle, { color: colors.onBackground }]}>
            Effect
          </Text>
          <Text style={[styles.effectPreview, { color: colors.onBackground }]}>
            {EFFECTS.find(e => e.id === selectedEffect)?.icon}
          </Text>
          <Text style={[styles.pickerArrow, { color: colors.onBackground }]}>
            {effectPickerOpacity.value === 0 ? '▼' : '▲'}
          </Text>
        </TouchableOpacity>

        <Animated.View style={[styles.effectPicker, effectPickerStyle]}>
          <View style={styles.effectGrid}>
            {EFFECTS.map(effect => (
              <TouchableOpacity
                key={effect.id}
                style={[
                  styles.effectOption,
                  { backgroundColor: colors.surface },
                  selectedEffect === effect.id && [
                    styles.effectOptionSelected,
                    { backgroundColor: colors.primary + '20' },
                  ],
                ]}
                onPress={() => handleEffectChange(effect.id)}
              >
                <Text style={styles.effectIcon}>{effect.icon}</Text>
                <Text
                  style={[
                    styles.effectLabel,
                    {
                      color:
                        selectedEffect === effect.id
                          ? colors.primary
                          : colors.onBackground,
                    },
                  ]}
                >
                  {effect.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.surface }]}
          onPress={onCancel}
        >
          <Text style={[styles.cancelText, { color: colors.onBackground }]}>
            Cancel
          </Text>
        </TouchableOpacity>

        <ElevatedButton
          title="Apply Text"
          onPress={onApply}
          style={styles.applyButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  previewCard: {
    margin: SPACING.md,
  },
  previewContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
    minHeight: 100,
  },
  previewText: {
    textAlign: 'center',
    lineHeight: 1.2,
  },
  inputCard: {
    margin: SPACING.md,
  },
  textInput: {
    ...TYPOGRAPHY.body1,
    minHeight: 60,
    textAlignVertical: 'top',
    padding: SPACING.md,
  },
  charCount: {
    ...TYPOGRAPHY.caption,
    textAlign: 'right',
    padding: SPACING.sm,
  },
  sliderCard: {
    margin: SPACING.md,
  },
  sliderTitle: {
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
  pickerCard: {
    margin: SPACING.md,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: 8,
  },
  pickerTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
  },
  pickerArrow: {
    ...TYPOGRAPHY.body1,
    fontSize: 16,
  },
  colorPicker: {
    marginTop: SPACING.sm,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  colorOptionSelected: {
    borderColor: '#6200EE',
    borderWidth: 3,
  },
  alignmentCard: {
    margin: SPACING.md,
  },
  cardTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  alignmentButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  alignmentButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  alignmentButtonActive: {
    elevation: 2,
  },
  alignmentIcon: {
    fontSize: 20,
    marginBottom: SPACING.xs,
  },
  alignmentLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '500',
  },
  effectCard: {
    margin: SPACING.md,
  },
  effectPreview: {
    ...TYPOGRAPHY.body1,
    fontSize: 20,
  },
  effectPicker: {
    marginTop: SPACING.sm,
  },
  effectGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  effectOption: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  effectOptionSelected: {
    borderWidth: 2,
    borderColor: '#6200EE',
  },
  effectIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  effectLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    margin: SPACING.md,
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
  },
});
