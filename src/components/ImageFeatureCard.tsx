import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { MedicalTheme } from '../constants/medicalTheme';

type ImageFeatureCardProps = {
  source: any;
  eyebrow: string;
  title: string;
  description?: string;
  height?: number;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function ImageFeatureCard({
  source,
  eyebrow,
  title,
  description,
  height = 200,
  compact = false,
  style,
}: ImageFeatureCardProps) {
  return (
    <View style={[styles.card, { height }, compact && styles.cardCompact, style]}>
      <Image source={source} style={styles.image} contentFit="cover" transition={160} />
      <View style={styles.wash} />
      <View style={styles.edgeGlow} />
      <View style={[styles.overlay, compact && styles.overlayCompact]}>
        <View style={styles.eyebrowPill}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={2}>
            {title}
          </Text>
          {description ? (
            <Text
              style={[styles.description, compact && styles.descriptionCompact]}
              numberOfLines={compact ? 2 : 3}
            >
              {description}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: MedicalTheme.radius.xl,
    backgroundColor: MedicalTheme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    ...MedicalTheme.shadow.md,
  },
  cardCompact: {
    borderRadius: MedicalTheme.radius.lg,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.24)',
  },
  edgeGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '62%',
    backgroundColor: 'rgba(15, 23, 42, 0.54)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: MedicalTheme.spacing.md,
  },
  overlayCompact: {
    padding: MedicalTheme.spacing.sm,
  },
  eyebrowPill: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  eyebrow: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  copy: {
    gap: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  titleCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  description: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    lineHeight: 18,
  },
  descriptionCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
});
