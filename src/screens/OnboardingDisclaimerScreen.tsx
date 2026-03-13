import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { MedicalTheme } from '../constants/medicalTheme';
import { setHasAcceptedDisclaimer } from '../lib/storage';
import { RootStackParamList } from '../types/navigation';
import DisclaimerFooter from '../components/DisclaimerFooter';

const DISCLAIMER_TEXT =
  'ML Disease Predictor is a research tool designed to further disease classification ML research. It is not intended for clinical diagnosis or treatment. This app does not provide medical advice. If you have a medical emergency, call your local emergency number immediately.';

export default function OnboardingDisclaimerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'OnboardingDisclaimer'>>();

  const handleAccept = async () => {
    await setHasAcceptedDisclaimer(true);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Landing' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Medical header badge */}
        <View style={styles.headerBadge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>MEDICAL DISCLAIMER</Text>
        </View>

        <View style={styles.card}>
          {/* Top accent bar */}
          <View style={styles.cardAccentBar} />

          <Text style={styles.kicker}>Before you begin</Text>
          <Text style={styles.title}>Important Notice</Text>

          <View style={styles.divider} />

          <Text style={styles.body}>{DISCLAIMER_TEXT}</Text>

          <View style={styles.noticeBlock}>
            <View style={styles.noticeDot} />
            <Text style={styles.noticeText}>
              This is a research tool — all outputs are for ML research and educational purposes only.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={handleAccept}
          >
            <Text style={styles.buttonText}>I Understand — Continue</Text>
          </Pressable>
        </View>
      </View>
      <DisclaimerFooter style={styles.footer} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MedicalTheme.colors.background,
  },
  container: {
    flex: 1,
    padding: MedicalTheme.spacing.xl,
    justifyContent: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: MedicalTheme.spacing.lg,
    alignSelf: 'center',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MedicalTheme.colors.alertRed,
  },
  badgeText: {
    color: MedicalTheme.colors.alertRed,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    ...MedicalTheme.shadow.lg,
  },
  cardAccentBar: {
    height: 3,
    backgroundColor: MedicalTheme.colors.primary,
    width: '100%',
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: MedicalTheme.colors.muted,
    marginTop: MedicalTheme.spacing.lg,
    marginHorizontal: MedicalTheme.spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    marginTop: 6,
    marginHorizontal: MedicalTheme.spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: MedicalTheme.colors.border,
    marginHorizontal: MedicalTheme.spacing.lg,
    marginTop: MedicalTheme.spacing.md,
    marginBottom: MedicalTheme.spacing.md,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: MedicalTheme.colors.textSecondary,
    marginHorizontal: MedicalTheme.spacing.lg,
    marginBottom: MedicalTheme.spacing.md,
  },
  noticeBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: MedicalTheme.spacing.lg,
    marginBottom: MedicalTheme.spacing.lg,
    backgroundColor: MedicalTheme.colors.alertRedBg,
    borderRadius: MedicalTheme.radius.md,
    padding: MedicalTheme.spacing.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.alertRed + '20',
  },
  noticeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MedicalTheme.colors.alertRed,
    marginTop: 7,
    flexShrink: 0,
  },
  noticeText: {
    flex: 1,
    color: MedicalTheme.colors.alertRed,
    fontSize: 13,
    lineHeight: 19,
  },
  button: {
    backgroundColor: MedicalTheme.colors.primary,
    marginHorizontal: MedicalTheme.spacing.lg,
    marginBottom: MedicalTheme.spacing.lg,
    paddingVertical: 15,
    borderRadius: MedicalTheme.radius.lg,
    alignItems: 'center',
    ...MedicalTheme.shadow.sm,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  footer: {
    paddingHorizontal: MedicalTheme.spacing.xl,
    marginBottom: MedicalTheme.spacing.lg,
  },
});
