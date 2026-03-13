import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { MedicalTheme } from '../constants/medicalTheme';
import DisclaimerFooter from '../components/DisclaimerFooter';
import ScreenHeader from '../components/ScreenHeader';
import { RootStackParamList } from '../types/navigation';

type FeatureCard = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  accent: string;
  accentLight: string;
  onPress: () => void;
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Staggered fade-in animations
  const anims = useRef(
    Array.from({ length: 8 }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(18),
    })),
  ).current;

  useEffect(() => {
    const animations = anims.map((a, i) =>
      Animated.parallel([
        Animated.timing(a.opacity, {
          toValue: 1,
          duration: 380,
          delay: i * 80,
          useNativeDriver: true,
        }),
        Animated.timing(a.translateY, {
          toValue: 0,
          duration: 380,
          delay: i * 80,
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.stagger(0, animations).start();
  }, [anims]);

  const featureCards: FeatureCard[] = [
    {
      icon: 'analytics-outline',
      title: 'Model Performance',
      description: 'Accuracy metrics, top confusions, and model comparisons.',
      accent: MedicalTheme.colors.primary,
      accentLight: MedicalTheme.colors.primaryLight,
      onPress: () => navigation.navigate('ModelsInfo'),
    },
    {
      icon: 'library-outline',
      title: 'Disease Library',
      description: 'Browse conditions with urgency reference labels and external resources.',
      accent: MedicalTheme.colors.green,
      accentLight: MedicalTheme.colors.greenLight,
      onPress: () => navigation.navigate('MainTabs', { screen: 'DiseaseLibrary' } as any),
    },
    {
      icon: 'chatbox-ellipses-outline',
      title: 'Send Feedback',
      description: 'Help improve ML Disease Predictor with your experience and suggestions.',
      accent: '#F59E0B',
      accentLight: '#FEF9EC',
      onPress: () => navigation.navigate('Feedback'),
    },
  ];

  const animStyle = (index: number) => ({
    opacity: anims[index].opacity,
    transform: [{ translateY: anims[index].translateY }],
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScreenHeader title="Home" />
      <View style={styles.contentWrap}>
        <ScrollView
          contentContainerStyle={styles.content}
          bounces={false}
          alwaysBounceVertical={false}
          alwaysBounceHorizontal={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting */}
          <Animated.View style={animStyle(0)}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.greetingSub}>ML Disease Predictor AI Intelligence Platform</Text>
          </Animated.View>

          {/* Hero CTA Card */}
          <Animated.View style={animStyle(1)}>
            <Pressable
              style={({ pressed }) => [styles.heroCard, pressed && styles.pressed]}
              onPress={() => navigation.navigate('Predict')}
            >
              <View style={styles.heroCardInner}>
                <View style={styles.heroIconWrap}>
                  <Ionicons name="pulse" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.heroTextBlock}>
                  <Text style={styles.heroTitle}>Start Symptom Analysis</Text>
                  <Text style={styles.heroSubtitle}>
                    Select symptoms from the app symptom library and review model-generated
                    classification outputs.
                  </Text>
                </View>
                <View style={styles.heroArrow}>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </View>
              </View>
            </Pressable>
          </Animated.View>

          {/* Stat Pills */}
          <Animated.View style={[styles.statRow, animStyle(2)]}>
            <View style={styles.statPill}>
              <Ionicons name="fitness-outline" size={16} color={MedicalTheme.colors.primary} />
              <Text style={styles.statValue}>677</Text>
              <Text style={styles.statLabel}>Diseases</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statPill}>
              <Ionicons name="git-network-outline" size={16} color={MedicalTheme.colors.purple} />
              <Text style={styles.statValue}>6</Text>
              <Text style={styles.statLabel}>Models</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statPill}>
              <Ionicons name="checkmark-circle-outline" size={16} color={MedicalTheme.colors.green} />
              <Text style={styles.statValue}>377</Text>
              <Text style={styles.statLabel}>Symptoms</Text>
            </View>
          </Animated.View>

          {/* Research Overview Banner */}
          <Animated.View style={animStyle(3)}>
            <View style={styles.clinicalBanner}>
              <View style={styles.clinicalBannerAccent} />
              <View style={styles.clinicalBannerBody}>
                <View style={styles.clinicalBannerHeader}>
                  <Ionicons name="medical-outline" size={18} color={MedicalTheme.colors.creamText} />
                  <Text style={styles.clinicalBannerLabel}>Research Overview</Text>
                </View>
                <Text style={styles.clinicalBannerText}>
                  ML Disease Predictor compares outputs from machine learning models trained on a
                  reference medical dataset. Model scores and urgency labels are shown for
                  exploratory comparison only and should not be treated as medical guidance.
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* How It Works */}
          <Animated.View style={animStyle(4)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>How It Works</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.stepsRow}>
              <View style={styles.stepCard}>
                <View style={[styles.stepNumberWrap, { backgroundColor: MedicalTheme.colors.tealLight }]}>
                  <Text style={[styles.stepNumber, { color: MedicalTheme.colors.teal }]}>1</Text>
                </View>
                <Text style={styles.stepTitle}>Input Symptoms</Text>
                <Text style={styles.stepDesc}>Select from 377 symptom indicators</Text>
              </View>
              <View style={styles.stepCard}>
                <View style={[styles.stepNumberWrap, { backgroundColor: MedicalTheme.colors.primaryLight }]}>
                  <Text style={[styles.stepNumber, { color: MedicalTheme.colors.primary }]}>2</Text>
                </View>
                <Text style={styles.stepTitle}>ML Analysis</Text>
                <Text style={styles.stepDesc}>Multiple models process symptoms through trained neural networks</Text>
              </View>
              <View style={styles.stepCard}>
                <View style={[styles.stepNumberWrap, { backgroundColor: MedicalTheme.colors.greenLight }]}>
                  <Text style={[styles.stepNumber, { color: MedicalTheme.colors.green }]}>3</Text>
                </View>
                <Text style={styles.stepTitle}>Review Results</Text>
                <Text style={styles.stepDesc}>Get ranked model outputs with scores and reference labels</Text>
              </View>
            </View>
          </Animated.View>

          {/* Section Label */}
          <Animated.View style={[styles.sectionHeader, animStyle(5)]}>
            <Text style={styles.sectionLabel}>Explore</Text>
            <View style={styles.sectionLine} />
          </Animated.View>

          {/* Feature Cards Grid */}
          <Animated.View style={[styles.cardGrid, animStyle(6)]}>
            {featureCards.map((card) => (
              <Pressable
                key={card.title}
                style={({ pressed }) => [styles.featureCard, pressed && styles.pressed]}
                onPress={card.onPress}
              >
                <View style={[styles.featureIconWrap, { backgroundColor: card.accentLight }]}>
                  <Ionicons name={card.icon} size={22} color={card.accent} />
                </View>
                <View style={styles.featureTextBlock}>
                  <Text style={styles.featureTitle}>{card.title}</Text>
                  <Text style={styles.featureDesc}>{card.description}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={MedicalTheme.colors.muted}
                  style={styles.featureChevron}
                />
              </Pressable>
            ))}
          </Animated.View>

          {/* Medical Note */}
          <Animated.View style={animStyle(7)}>
            <View style={styles.medicalNote}>
              <Ionicons name="shield-checkmark-outline" size={16} color={MedicalTheme.colors.teal} />
              <Text style={styles.medicalNoteText}>
                All outputs are generated by experimental models on a reference dataset. They are
                not diagnoses and should not be used for treatment or triage decisions.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
        <DisclaimerFooter style={styles.footer} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MedicalTheme.colors.background,
  },
  contentWrap: {
    flex: 1,
  },
  content: {
    padding: MedicalTheme.spacing.lg,
    paddingBottom: MedicalTheme.spacing.md,
  },

  /* Greeting */
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  greetingSub: {
    fontSize: 15,
    color: MedicalTheme.colors.textSecondary,
    marginBottom: MedicalTheme.spacing.lg,
  },

  /* Hero CTA */
  heroCard: {
    backgroundColor: MedicalTheme.colors.primary,
    borderRadius: MedicalTheme.radius.xl,
    marginBottom: MedicalTheme.spacing.lg,
    ...MedicalTheme.shadow.lg,
  },
  heroCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: MedicalTheme.spacing.lg,
    gap: 14,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextBlock: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.82)',
  },
  heroArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Stat Pills */
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    marginBottom: MedicalTheme.spacing.lg,
    ...MedicalTheme.shadow.sm,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: MedicalTheme.colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: MedicalTheme.colors.border,
  },

  /* Clinical Intelligence Banner */
  clinicalBanner: {
    backgroundColor: MedicalTheme.colors.cream,
    borderRadius: MedicalTheme.radius.lg,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.creamDark,
    marginBottom: MedicalTheme.spacing.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    ...MedicalTheme.shadow.sm,
  },
  clinicalBannerAccent: {
    width: 3,
    backgroundColor: MedicalTheme.colors.creamText,
  },
  clinicalBannerBody: {
    flex: 1,
    padding: MedicalTheme.spacing.md,
  },
  clinicalBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  clinicalBannerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: MedicalTheme.colors.creamText,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  clinicalBannerText: {
    fontSize: 13,
    lineHeight: 20,
    color: MedicalTheme.colors.creamText,
  },

  /* How It Works */
  stepsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: MedicalTheme.spacing.lg,
  },
  stepCard: {
    flex: 1,
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.md,
    padding: MedicalTheme.spacing.sm,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    alignItems: 'center',
    ...MedicalTheme.shadow.sm,
  },
  stepNumberWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 15,
    fontWeight: '800',
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 11,
    lineHeight: 15,
    color: MedicalTheme.colors.textSecondary,
    textAlign: 'center',
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: MedicalTheme.spacing.md,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    letterSpacing: 0.3,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: MedicalTheme.colors.border,
  },

  /* Feature Cards */
  cardGrid: {
    gap: 10,
    marginBottom: MedicalTheme.spacing.lg,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.lg,
    padding: MedicalTheme.spacing.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    gap: 14,
    ...MedicalTheme.shadow.sm,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextBlock: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: MedicalTheme.colors.textSecondary,
  },
  featureChevron: {
    marginLeft: 2,
  },

  /* Medical Note */
  medicalNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: MedicalTheme.colors.tealLight,
    borderRadius: MedicalTheme.radius.md,
    padding: MedicalTheme.spacing.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.teal + '25',
    marginBottom: MedicalTheme.spacing.sm,
  },
  medicalNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: MedicalTheme.colors.teal,
  },

  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },

  footer: {
    paddingHorizontal: MedicalTheme.spacing.lg,
    paddingBottom: MedicalTheme.spacing.lg,
  },
});
