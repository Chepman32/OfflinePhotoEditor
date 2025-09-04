import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../utils/theme';
import { SPACING } from '../../constants/spacing';

interface ToolbarProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: number;
}

const TOOLBAR_HEIGHT = 56;

export const Toolbar: React.FC<ToolbarProps> = ({
  children,
  style,
  elevation = 4,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          elevation,
          shadowColor: colors.onSurface,
          shadowOffset: { width: 0, height: elevation / 2 },
          shadowOpacity: elevation / 20,
          shadowRadius: elevation / 2,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: TOOLBAR_HEIGHT,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-between',
  },
});
