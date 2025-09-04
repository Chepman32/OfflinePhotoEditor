import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../utils/theme';
import { ElevatedButton } from './ElevatedButton';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReport = () => {
    // In a real app, this would send error report to analytics service
    console.log('Reporting error:', this.state.error, this.state.errorInfo);
    alert('Error report sent. Thank you for helping us improve!');
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback
        error={this.state.error}
        onRetry={this.handleRetry}
        onReport={this.handleReport}
      />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
  onReport?: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onRetry, onReport }) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.errorIcon, { backgroundColor: colors.error + '20' }]}>
          <Text style={[styles.errorIconText, { color: colors.error }]}>⚠️</Text>
        </View>

        <Text style={[styles.title, { color: colors.onBackground }]}>
          Oops! Something went wrong
        </Text>

        <Text style={[styles.message, { color: colors.onSurface }]}>
          We encountered an unexpected error. Don't worry, your work is safe.
        </Text>

        {error && __DEV__ && (
          <View style={[styles.errorDetails, { backgroundColor: colors.surface }]}>
            <Text style={[styles.errorText, { color: colors.onSurface }]}>
              {error.message}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <ElevatedButton
            title="Try Again"
            onPress={onRetry}
            style={styles.primaryButton}
          />

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.surface }]}
            onPress={onReport}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.onBackground }]}>
              Report Issue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  errorIconText: {
    fontSize: 40,
  },
  title: {
    ...TYPOGRAPHY.headline1,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  message: {
    ...TYPOGRAPHY.body1,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  errorDetails: {
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
    width: '100%',
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    fontFamily: 'monospace',
  },
  actions: {
    width: '100%',
    gap: SPACING.md,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    padding: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.body2,
    fontWeight: '500',
  },
});

// Functional component wrapper for hooks support
export const ErrorBoundary: React.FC<ErrorBoundaryProps> = (props) => {
  return <ErrorBoundaryClass {...props} />;
};
