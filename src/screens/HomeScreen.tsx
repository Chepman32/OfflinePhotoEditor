import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
// Reanimated imports removed to fix rendering issues
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../utils/theme';
// Animation hooks temporarily disabled
import { useRecentProjects } from '../hooks/useStorage';
import { ElevatedButton } from '../components/common/ElevatedButton';
import { IconButton } from '../components/common/IconButton';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { Card } from '../components/common/Card';
import { Toolbar } from '../components/common/Toolbar';
import { TYPOGRAPHY } from '../constants/typography';
import { SPACING } from '../constants/spacing';

// const { width } = Dimensions.get('window'); // Temporarily unused
const HERO_CARD_HEIGHT = 200;
const RECENT_EDIT_CARD_SIZE = 120;

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { colors } = useTheme();
  const { projects: recentProjects } = useRecentProjects();

  // Animations temporarily disabled to fix rendering issues

  // Temporarily disabled animations due to Reanimated worklet issues
  // Animation values
  // const headerTranslateY = useSharedValue(-100);
  // const heroCardOpacity = useSharedValue(0);
  // const heroCardTranslateY = useSharedValue(50);
  // const fabScale = useSharedValue(0);
  // const recentEditsOpacity = useSharedValue(0);
  // const recentEditsTranslateY = useSharedValue(30);

  useEffect(() => {
    // Temporarily disabled animations due to Reanimated worklet issues
    // startAnimations();
  }, [recentProjects.length]);

  // const startAnimations = () => {
  //   // Header animation
  //   headerTranslateY.value = withSpring(0, {
  //     damping: 15,
  //     stiffness: 100,
  //   });

  //   // Hero card animation
  //   setTimeout(() => {
  //     heroCardOpacity.value = withTiming(1, { duration: 600 });
  //     heroCardTranslateY.value = withSpring(0, {
  //       damping: 20,
  //       stiffness: 100,
  //     });
  //   }, 200);

  //   // FAB animation
  //   setTimeout(() => {
  //     fabScale.value = withSpring(1, {
  //       damping: 12,
  //       stiffness: 150,
  //       mass: 1,
  //     });
  //   }, 400);

  //   // Recent edits animation
  //   setTimeout(() => {
  //     recentEditsOpacity.value = withTiming(1, { duration: 500 });
  //     recentEditsTranslateY.value = withSpring(0, {
  //       damping: 20,
  //       stiffness: 100,
  //     });
  //   }, 600);

  //   // Hero fade in
  //   setTimeout(() => {
  //     heroFadeIn();
  //   }, 300);
  // };

  // const headerAnimatedStyle = useAnimatedStyle(() => ({
  //   transform: [{ translateY: headerTranslateY.value }],
  // }));

  // const heroCardAnimatedStyle = useAnimatedStyle(() => ({
  //   opacity: heroCardOpacity.value,
  //   transform: [{ translateY: heroCardTranslateY.value }],
  // }));

  // const fabAnimatedStyle = useAnimatedStyle(() => ({
  //   transform: [{ scale: fabScale.value }],
  // }));

  // const recentEditsAnimatedStyle = useAnimatedStyle(() => ({
  //   opacity: recentEditsOpacity.value,
  //   transform: [{ translateY: recentEditsTranslateY.value }],
  // }));

  const handleStartEditing = () => {
    navigation.navigate('PhotoSelection', { source: 'gallery' });
  };

  const handleRecentProjectPress = (projectId: string) => {
    navigation.navigate('Editor', {
      imageUri: '', // This would come from the project data
      projectId,
    });
  };

  // Long press handler temporarily removed due to Card component limitations

  const renderRecentProject = ({ item, index }: { item: any; index: number }) => {
    return (
      <View style={[{ marginRight: SPACING.md }]}>
        <Card
          style={styles.recentEditCard}
          onPress={() => handleRecentProjectPress(item.id)}
        >
          <View style={styles.recentEditImage}>
            <Text style={styles.recentEditPlaceholder}>📷</Text>
          </View>
          <View style={styles.recentEditInfo}>
            <Text
              style={[styles.recentEditTitle, { color: colors.onSurface }]}
              numberOfLines={1}
            >
              {item.name || `Project ${index + 1}`}
            </Text>
            <Text
              style={[styles.recentEditDate, { color: colors.onSurface }]}
            >
              {new Date(item.lastModified).toLocaleDateString()}
            </Text>
          </View>
        </Card>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
        <Toolbar style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.appTitle, { color: colors.onBackground }]}>
              OfflinePhotoEditor
            </Text>
          </View>
          <View style={styles.headerRight}>
            <ThemeToggle />
          </View>
        </Toolbar>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Card */}
        <View style={styles.heroSection}>
          <Card style={styles.heroCard}>
            <View style={styles.heroContent}>
              <Text style={[styles.heroTitle, { color: colors.onSurface }]}>
                Start Creating
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.onSurface }]}>
                Transform your photos with professional editing tools
              </Text>
              <View style={styles.heroButton}>
                <ElevatedButton
                  title="Select Photo"
                  onPress={handleStartEditing}
                />
              </View>
            </View>
            <View style={styles.heroIllustration}>
              <Text style={styles.heroIllustrationText}>🎨✨</Text>
            </View>
          </Card>
        </View>

        {/* Recent Edits */}
        {recentProjects.length > 0 && (
          <View style={styles.recentEditsSection}>
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
              Recent Edits
            </Text>
            <FlatList
              data={recentProjects.slice(0, 10)}
              renderItem={renderRecentProject}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentEditsList}
            />
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <IconButton
          icon={<Text style={{ fontSize: 24 }}>📷</Text>}
          onPress={() => {
            navigation.navigate('PhotoSelection', { source: 'camera' });
          }}
          size={56}
          style={styles.fab}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 0,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
  },
  appTitle: {
    ...TYPOGRAPHY.headline2,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  heroSection: {
    marginBottom: SPACING.xl,
  },
  heroCard: {
    height: HERO_CARD_HEIGHT,
    padding: SPACING.lg,
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
  },
  heroTitle: {
    ...TYPOGRAPHY.headline1,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    ...TYPOGRAPHY.body1,
    marginBottom: SPACING.lg,
    opacity: 0.8,
  },
  heroButton: {
    alignSelf: 'flex-start',
  },
  heroIllustration: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    opacity: 0.1,
  },
  heroIllustrationText: {
    fontSize: 60,
  },
  recentEditsSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.headline2,
    marginBottom: SPACING.lg,
  },
  recentEditsList: {
    paddingRight: SPACING.lg,
  },
  recentEditCard: {
    width: RECENT_EDIT_CARD_SIZE,
    height: RECENT_EDIT_CARD_SIZE * 1.3,
    padding: SPACING.sm,
  },
  recentEditImage: {
    flex: 3,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  recentEditPlaceholder: {
    fontSize: 32,
  },
  recentEditInfo: {
    flex: 1,
  },
  recentEditTitle: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
    marginBottom: 2,
  },
  recentEditDate: {
    ...TYPOGRAPHY.caption,
    opacity: 0.7,
  },
  fabContainer: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
  },
  fab: {
    backgroundColor: '#6200EE',
    elevation: 6,
    shadowColor: '#6200EE',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
