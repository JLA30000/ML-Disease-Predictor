import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { MedicalTheme } from '../constants/medicalTheme';
import DisclaimerFooter from '../components/DisclaimerFooter';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'FeedbackThankYou'>;

export default function FeedbackThankYouScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <View style={styles.card}>
          {/* Success Icon */}
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={48} color={MedicalTheme.colors.green} />
          </View>

          <Text style={styles.title}>Thanks for contributing.</Text>
          <Text style={styles.subtitle}>
            Your feedback entry has been saved on this device.
          </Text>

          {/* What Happens Next */}
          <View style={styles.nextSection}>
            <Text style={styles.nextLabel}>What happens next</Text>
            <View style={styles.nextSteps}>
              {[
                { icon: 'document-text-outline' as const, text: 'The saved entry remains available in local app storage on this device' },
                { icon: 'analytics-outline' as const, text: 'The app does not automatically retrain models from saved feedback entries' },
                { icon: 'shield-checkmark-outline' as const, text: 'No automatic submission to a research team occurs from this screen' },
              ].map((step, i) => (
                <View key={i} style={styles.nextStep}>
                  <View style={styles.nextStepIcon}>
                    <Ionicons name={step.icon} size={16} color={MedicalTheme.colors.teal} />
                  </View>
                  <Text style={styles.nextStepText}>{step.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Contribution Impact */}
          <View style={styles.impactBanner}>
            <Ionicons name="heart-outline" size={16} color={MedicalTheme.colors.creamText} />
            <Text style={styles.impactText}>
              Use feedback entries as structured notes for your own research workflow and case
              tracking.
            </Text>
          </View>

          <View style={styles.buttonGroup}>
            <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('MainTabs')}>
              <Ionicons name="home-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryText}>Go to Home</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Feedback', { reset: true })}
            >
              <Ionicons name="add-circle-outline" size={18} color={MedicalTheme.colors.green} />
              <Text style={styles.secondaryText}>Submit Another Response</Text>
            </Pressable>
          </View>
        </View>
      </View>
      <DisclaimerFooter style={styles.footer} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: MedicalTheme.colors.background,
  },
  content: {
    flex: 1,
    padding: MedicalTheme.spacing.lg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.xl,
    padding: MedicalTheme.spacing.lg,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    ...MedicalTheme.shadow.md,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: MedicalTheme.spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: MedicalTheme.colors.textSecondary,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: MedicalTheme.spacing.lg,
  },

  // What happens next
  nextSection: {
    marginBottom: MedicalTheme.spacing.md,
  },
  nextLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  nextSteps: {
    gap: 10,
  },
  nextStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: MedicalTheme.colors.tealLight,
    borderRadius: MedicalTheme.radius.md,
    padding: MedicalTheme.spacing.sm,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.teal + '20',
  },
  nextStepIcon: {
    marginTop: 1,
    flexShrink: 0,
  },
  nextStepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: MedicalTheme.colors.teal,
  },

  // Impact banner
  impactBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: MedicalTheme.colors.cream,
    borderRadius: MedicalTheme.radius.md,
    padding: MedicalTheme.spacing.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.creamDark,
    marginBottom: MedicalTheme.spacing.lg,
  },
  impactText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: MedicalTheme.colors.creamText,
  },

  buttonGroup: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: MedicalTheme.colors.green,
    paddingVertical: 14,
    borderRadius: MedicalTheme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...MedicalTheme.shadow.sm,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: MedicalTheme.colors.green,
    paddingVertical: 14,
    borderRadius: MedicalTheme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: MedicalTheme.colors.greenLight,
  },
  secondaryText: {
    color: MedicalTheme.colors.green,
    fontWeight: '700',
    fontSize: 15,
  },
  footer: {
    paddingHorizontal: MedicalTheme.spacing.lg,
    paddingBottom: MedicalTheme.spacing.lg,
  },
});
