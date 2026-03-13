import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { MedicalTheme } from '../constants/medicalTheme';
import DisclaimerFooter from '../components/DisclaimerFooter';

const DISCLAIMER_TEXT =
  'ML Disease Predictor is a research tool for exploring symptom-classification models. It is not a medical device and should not be used as a substitute for professional medical advice, diagnosis, or treatment.';

export default function AboutPrivacyScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          bounces={false}
          alwaysBounceHorizontal={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {/* Hero card */}
          <View style={styles.heroCard}>
            <View style={styles.heroAccentBar} />
            <View style={styles.heroCardBody}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>Medical Research Platform</Text>
              </View>
              <Text style={styles.title}>ML Disease Predictor</Text>
              <Text style={styles.subtitle}>{DISCLAIMER_TEXT}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <View style={styles.metaDot} />
                  <Text style={styles.metaText}>Dataset: Mendeley Data</Text>
                </View>
                <View style={styles.metaPill}>
                  <View style={[styles.metaDot, { backgroundColor: MedicalTheme.colors.alertAmber }]} />
                  <Text style={styles.metaText}>Status: Prototype</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Sections */}
          <View style={styles.sectionGrid}>
            {/* How It Works */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="flask-outline" size={16} color={MedicalTheme.colors.primary} />
                <Text style={styles.sectionTitle}>How ML Disease Predictor Works</Text>
              </View>
              <Text style={styles.body}>
                ML Disease Predictor sends selected symptoms to a hosted prediction service and
                compares outputs from multiple machine learning models trained on a reference
                medical dataset. The returned scores are model outputs for research comparison,
                not medical conclusions.
              </Text>
              <View style={styles.methodSteps}>
                {[
                  { num: '1', text: 'Symptoms are encoded as binary feature vectors matching the training dataset schema' },
                  { num: '2', text: 'Multiple ML models (logistic regression, autoencoders, classwise networks) analyze the symptom vector independently' },
                  { num: '3', text: 'Each model returns a ranked list of label matches with relative model scores' },
                  { num: '4', text: 'Results may include an internal urgency reference label shown for context only' },
                ].map((step) => (
                  <View key={step.num} style={styles.methodStep}>
                    <View style={styles.methodStepNum}>
                      <Text style={styles.methodStepNumText}>{step.num}</Text>
                    </View>
                    <Text style={styles.methodStepText}>{step.text}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Interpretation Guidance */}
            <View style={styles.creamCard}>
              <View style={styles.creamCardAccent} />
              <View style={styles.creamCardBody}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="information-circle-outline" size={16} color={MedicalTheme.colors.creamText} />
                  <Text style={[styles.sectionTitle, { color: MedicalTheme.colors.creamText }]}>Interpretation Guidance</Text>
                </View>
                <Text style={[styles.body, { color: MedicalTheme.colors.creamText, marginBottom: 12 }]}>
                  Understanding prediction results requires awareness of the following limitations and best practices:
                </Text>
                {[
                  { icon: 'trending-up-outline' as const, title: 'Model Scores', desc: 'Higher scores indicate a stronger model match to the selected symptom pattern within that model. They are not probabilities of disease and do not guarantee accuracy.' },
                  { icon: 'layers-outline' as const, title: 'Multiple Models', desc: 'Comparing outputs across models can help you inspect how sensitive results are to different modeling choices. Agreement does not confirm a diagnosis.' },
                  { icon: 'alert-circle-outline' as const, title: 'Urgency Labels', desc: 'Low, Moderate, High, and Critical are coarse reference labels from an internal mapping. They are not clinical triage instructions.' },
                ].map((item) => (
                  <View key={item.title} style={styles.guidanceItem}>
                    <Ionicons name={item.icon} size={16} color={MedicalTheme.colors.creamText} style={{ marginTop: 2 }} />
                    <View style={styles.guidanceContent}>
                      <Text style={styles.guidanceTitle}>{item.title}</Text>
                      <Text style={styles.guidanceDesc}>{item.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Privacy Policy */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="lock-closed-outline" size={16} color={MedicalTheme.colors.primary} />
                <Text style={styles.sectionTitle}>Privacy Policy</Text>
              </View>
              <Text style={styles.body}>
                ML Disease Predictor uses both local device storage and hosted services. The app
                sends selected symptoms to a remote prediction API when you run an analysis, and
                email sign-in uses Supabase authentication.
              </Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Data handling</Text>
                <View style={styles.infoList}>
                  {[
                    'Selected symptoms are sent to the prediction service when you request model outputs',
                    'Email authentication is handled through Supabase when you sign in with email',
                    'Guest sessions, saved history, and feedback entries are stored locally on your device',
                    'Prediction results can be saved locally in session history on your device',
                    'No third-party analytics SDK is included in the app',
                  ].map((item, i) => (
                    <View key={i} style={styles.infoListItem}>
                      <View style={[styles.infoListDot, { backgroundColor: MedicalTheme.colors.green }]} />
                      <Text style={styles.infoText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.noticeRow}>
                <View style={styles.noticeDot} />
                <Text style={styles.noticeText}>
                  Outputs are informational and not a substitute for qualified medical judgment. Always consult a licensed healthcare provider for diagnosis and treatment decisions.
                </Text>
              </View>
            </View>
          </View>
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
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flexGrow: 1,
    padding: MedicalTheme.spacing.lg,
    paddingBottom: MedicalTheme.spacing.lg,
    minWidth: '100%',
  },

  // Hero
  heroCard: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.xl,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    marginBottom: MedicalTheme.spacing.lg,
    overflow: 'hidden',
    ...MedicalTheme.shadow.md,
  },
  heroAccentBar: {
    height: 3,
    backgroundColor: MedicalTheme.colors.primary,
  },
  heroCardBody: {
    padding: MedicalTheme.spacing.lg,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: MedicalTheme.colors.primaryLight,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.primary + '30',
    marginBottom: 10,
  },
  heroBadgeText: {
    color: MedicalTheme.colors.primary,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: MedicalTheme.colors.textSecondary,
    marginBottom: MedicalTheme.spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    backgroundColor: MedicalTheme.colors.background,
  },
  metaDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: MedicalTheme.colors.primary,
  },
  metaText: {
    color: MedicalTheme.colors.text,
    fontSize: 12,
    fontWeight: '600',
  },

  // Sections
  sectionGrid: {
    gap: MedicalTheme.spacing.md,
  },
  sectionCard: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.lg,
    padding: MedicalTheme.spacing.lg,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    ...MedicalTheme.shadow.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: MedicalTheme.colors.textSecondary,
    marginBottom: MedicalTheme.spacing.md,
  },

  // Method Steps
  methodSteps: {
    gap: 10,
  },
  methodStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  methodStepNum: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: MedicalTheme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  methodStepNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: MedicalTheme.colors.primary,
  },
  methodStepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: MedicalTheme.colors.textSecondary,
  },

  // Cream Card (Interpretation Guidance)
  creamCard: {
    backgroundColor: MedicalTheme.colors.cream,
    borderRadius: MedicalTheme.radius.lg,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.creamDark,
    overflow: 'hidden',
    flexDirection: 'row',
    ...MedicalTheme.shadow.sm,
  },
  creamCardAccent: {
    width: 3,
    backgroundColor: MedicalTheme.colors.creamText,
  },
  creamCardBody: {
    flex: 1,
    padding: MedicalTheme.spacing.lg,
  },
  guidanceItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  guidanceContent: {
    flex: 1,
  },
  guidanceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: MedicalTheme.colors.creamText,
    marginBottom: 2,
  },
  guidanceDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: MedicalTheme.colors.creamText,
    opacity: 0.85,
  },

  // Info card
  infoCard: {
    padding: MedicalTheme.spacing.md,
    borderRadius: MedicalTheme.radius.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    backgroundColor: MedicalTheme.colors.background,
  },
  infoTitle: {
    color: MedicalTheme.colors.text,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  infoList: {
    gap: 6,
  },
  infoListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoListDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: MedicalTheme.colors.primary,
    flexShrink: 0,
  },
  infoText: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },

  // Notice
  noticeRow: {
    marginTop: MedicalTheme.spacing.md,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
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
    marginTop: 6,
    flexShrink: 0,
  },
  noticeText: {
    flex: 1,
    color: MedicalTheme.colors.alertRed,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    paddingHorizontal: MedicalTheme.spacing.lg,
    paddingBottom: MedicalTheme.spacing.lg,
  },
});
