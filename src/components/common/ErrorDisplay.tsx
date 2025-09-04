import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Snackbar } from './Snackbar';
import { useTheme } from '../../utils/theme';
import { AppError } from '../../store/slices/errorSlice';

interface ErrorDisplayProps {
  style?: any;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ style }) => {
  const { colors } = useTheme();
  const currentError = useSelector((state: RootState) => state.error.currentError);
  const isLoading = useSelector((state: RootState) => state.error.isLoading);

  const [visibleError, setVisibleError] = React.useState<AppError | null>(null);
  const [snackbarVisible, setSnackbarVisible] = React.useState(false);

  useEffect(() => {
    if (currentError) {
      setVisibleError(currentError);
      setSnackbarVisible(true);
    }
  }, [currentError]);

  const handleSnackbarDismiss = () => {
    setSnackbarVisible(false);
    setVisibleError(null);
  };

  const getErrorType = (severity: string): 'success' | 'error' | 'info' => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'error';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  };

  if (!visibleError || !snackbarVisible) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Snackbar
        visible={snackbarVisible}
        message={visibleError.message}
        type={getErrorType(visibleError.severity)}
        duration={visibleError.severity === 'critical' || visibleError.severity === 'high' ? 6000 : 4000}
        onDismiss={handleSnackbarDismiss}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});
