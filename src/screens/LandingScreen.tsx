import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';

export default function LandingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Landing'>>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(ctaFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, ctaFade]);

  function handlePrimaryAction() {
    if (user) {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      return;
    }

    navigation.navigate('Auth');
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full-bleed background image */}
      <Image
        source={require('../pictures/landingPage.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={300}
      />

      {/* Dark overlay */}
      <View style={styles.overlay} />
      <View style={styles.overlayBottom} />

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
        {/* Top badge */}
        <Animated.View style={[styles.topSection, { opacity: fadeAnim }]}>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Research Tool</Text>
          </View>
        </Animated.View>

        {/* Center brand */}
        <Animated.View
          style={[
            styles.brandSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.heroEyebrow}>Disease modeling, framed for faster interpretation</Text>
          <Text style={styles.brandName}>ML Disease Predictor</Text>
          <Text style={styles.heroTitle}>Research-grade disease intelligence</Text>
          <Text style={styles.description}>
            Explore symptom-driven predictions across curated machine learning models, compare outputs with less friction, and keep the workflow readable from first launch.
          </Text>
          <View style={styles.highlightCard}>
            <Text style={styles.highlightTitle}>Built for research teams and student investigators</Text>
            <Text style={styles.highlightText}>
              Review model behavior, track saved history, and move from onboarding to prediction without losing context.
            </Text>
          </View>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>677</Text>
              <Text style={styles.statLabel}>Conditions mapped</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>6</Text>
              <Text style={styles.statLabel}>Models available</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>377</Text>
              <Text style={styles.statLabel}>Symptoms indexed</Text>
            </View>
          </View>
        </Animated.View>

        {/* Bottom CTA + Disclaimer */}
        <Animated.View style={[styles.ctaSection, { opacity: ctaFade }]}>
          <Text style={styles.ctaLead}>
            {user
              ? 'Resume your workspace instantly.'
              : 'Start with secure sign-in or continue as a guest on the next screen.'}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
            onPress={handlePrimaryAction}
          >
            <Text style={styles.ctaText}>
              {user ? 'Continue to Workspace' : 'Enter Platform'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>
          <View style={styles.disclaimerCard}>
            <View style={styles.disclaimerDot} />
            <Text style={styles.disclaimerText}>
              This platform is intended for research and educational use. It does not provide clinical guidance or replace professional medical judgment.
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
  },
  overlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },

  /* Top */
  topSection: {
    alignItems: 'flex-start',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4F6BF6',
  },
  badgeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  /* Brand */
  brandSection: {
    alignItems: 'flex-start',
  },
  heroEyebrow: {
    color: 'rgba(191, 219, 254, 0.95)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  brandName: {
    fontSize: 44,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1.4,
    marginBottom: 12,
    lineHeight: 46,
  },
  heroTitle: {
    fontSize: 27,
    lineHeight: 33,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.9,
    marginBottom: 14,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(226,232,240,0.92)',
    marginBottom: 20,
    maxWidth: 540,
  },
  highlightCard: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.22)',
    marginBottom: 20,
  },
  highlightTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  highlightText: {
    color: 'rgba(226,232,240,0.78)',
    fontSize: 13,
    lineHeight: 19,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignSelf: 'stretch',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(226,232,240,0.78)',
    fontWeight: '600',
    textAlign: 'center',
  },
  statSep: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },

  /* CTA */
  ctaSection: {
    gap: 14,
  },
  ctaLead: {
    color: 'rgba(226,232,240,0.84)',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  ctaButton: {
    backgroundColor: '#4F6BF6',
    paddingVertical: 17,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#4F6BF6',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
  },
  ctaPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  disclaimerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginTop: 5,
    flexShrink: 0,
  },
  disclaimerText: {
    flex: 1,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    lineHeight: 17,
  },
});
