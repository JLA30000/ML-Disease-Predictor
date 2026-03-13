import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { MedicalTheme } from '../constants/medicalTheme';
import DisclaimerFooter from '../components/DisclaimerFooter';
import { MODEL_METRICS, type ModelKey } from '../lib/modelMetrics';
import { RootStackParamList } from '../types/navigation';

const MODEL_ORDER: ModelKey[] = [
  'lr_full',
  'ae_clf_full',
  'cw_full',
  'ablation_study',
];

const KEY_METRICS: { key: 'acc' | 'macroF1' | 'top5'; label: string; color: string }[] = [
  { key: 'acc', label: 'Accuracy', color: MedicalTheme.colors.primary },
  { key: 'macroF1', label: 'Macro F1', color: MedicalTheme.colors.green },
  { key: 'top5', label: 'Top-5', color: '#A78BFA' },
];

function formatMetric(value: number) {
  return value.toFixed(4);
}

function getAccuracyColor(acc: number): string {
  if (acc >= 0.85) return MedicalTheme.colors.green;
  if (acc >= 0.70) return MedicalTheme.colors.alertAmber;
  return MedicalTheme.colors.alertRed;
}

export default function ModelsInfoScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'ModelsInfo'>>();

  const cards = useMemo(
    () =>
      MODEL_ORDER.map((key) => {
        const info = MODEL_METRICS[key];
        const tag = key === 'ablation_study' ? 'Study Variant' : 'Main Study';
        const accColor = getAccuracyColor(info.metricsMean.acc);
        const thresholdVariants = key === 'ablation_study' ? info.studyVariants ?? [] : [];
        return (
          <Pressable
            key={key}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => navigation.navigate('ModelDetail', { modelKey: key })}
          >
            <View style={[styles.cardAccent, { backgroundColor: accColor }]} />
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTagRow}>
                  <View style={styles.cardTag}>
                    <Text style={styles.cardTagText}>{tag}</Text>
                  </View>
                </View>
                <Text style={styles.cardTitle}>{info.displayName}</Text>
                <Text style={styles.cardDescription}>{info.description}</Text>
              </View>

              {key === 'ablation_study' ? (
                <View style={styles.thresholdOverview}>
                  {thresholdVariants.map((variant) => (
                    <View key={variant.label} style={styles.thresholdRow}>
                      <View style={styles.thresholdTitleWrap}>
                        <Text style={styles.thresholdName} numberOfLines={1}>
                          {variant.label.replace('Autoencoder MLP Classifier ', '')}
                        </Text>
                      </View>
                      <View style={styles.thresholdMetrics}>
                        <Text style={styles.thresholdMetricText}>
                          Acc {formatMetric(variant.metricsMean.acc)}
                        </Text>
                        <Text style={styles.thresholdMetricText}>
                          F1 {formatMetric(variant.metricsMean.macroF1)}
                        </Text>
                        <Text style={styles.thresholdMetricText}>
                          Top-5 {formatMetric(variant.metricsMean.top5)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.metricRow}>
                  {KEY_METRICS.map((metric) => (
                    <View
                      key={metric.key}
                      style={[
                        styles.metricChip,
                        {
                          borderColor: `${metric.color}25`,
                          backgroundColor: `${metric.color}0A`,
                        },
                      ]}
                    >
                      <Text style={styles.metricLabel}>{metric.label}</Text>
                      <Text style={[styles.metricValue, { color: metric.color }]}>
                        {formatMetric(info.metricsMean[metric.key])}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.cardFooter}>
                <Text style={styles.cardCta}>{'View full details ->'}</Text>
              </View>
            </View>
          </Pressable>
        );
      }),
    [navigation]
  );

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        bounces={false}
        alwaysBounceVertical={false}
        alwaysBounceHorizontal={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Model Library</Text>
          <Text style={styles.subtitle}>
            Review the three main models first, then the supporting AE ablation study.
          </Text>
        </View>

        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: MedicalTheme.colors.green }]} />
          <Text style={styles.legendText}>{'>=85% accuracy'}</Text>
          <View style={[styles.legendDot, { backgroundColor: MedicalTheme.colors.alertAmber }]} />
          <Text style={styles.legendText}>70-84%</Text>
          <View style={[styles.legendDot, { backgroundColor: MedicalTheme.colors.alertRed }]} />
          <Text style={styles.legendText}>&lt;70%</Text>
        </View>

        {cards}
      </ScrollView>
      <DisclaimerFooter style={styles.footer} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: MedicalTheme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: MedicalTheme.spacing.lg,
    paddingBottom: MedicalTheme.spacing.lg,
    flexGrow: 1,
    minWidth: '100%',
  },
  header: {
    marginBottom: MedicalTheme.spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
  },
  subtitle: {
    marginTop: 6,
    color: MedicalTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: MedicalTheme.spacing.md,
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.md,
    padding: MedicalTheme.spacing.sm,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    ...MedicalTheme.shadow.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginRight: 6,
  },
  card: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.xl,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    marginBottom: MedicalTheme.spacing.md,
    flexDirection: 'row',
    overflow: 'hidden',
    ...MedicalTheme.shadow.md,
  },
  cardPressed: {
    opacity: 0.82,
  },
  cardAccent: {
    width: 3,
  },
  cardBody: {
    flex: 1,
    padding: MedicalTheme.spacing.lg,
  },
  cardHeader: {
    marginBottom: MedicalTheme.spacing.md,
  },
  cardTagRow: {
    marginBottom: 8,
  },
  cardTag: {
    alignSelf: 'flex-start',
    backgroundColor: MedicalTheme.colors.greenLight,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.green + '30',
  },
  cardTagText: {
    color: MedicalTheme.colors.green,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: MedicalTheme.colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescription: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: MedicalTheme.spacing.md,
  },
  metricChip: {
    borderRadius: MedicalTheme.radius.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    flex: 1,
    alignItems: 'center',
  },
  thresholdOverview: {
    gap: 8,
    marginBottom: MedicalTheme.spacing.md,
  },
  thresholdRow: {
    borderRadius: MedicalTheme.radius.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    backgroundColor: MedicalTheme.colors.surfaceHigh,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  thresholdTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thresholdName: {
    color: MedicalTheme.colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  thresholdMetrics: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  thresholdMetricText: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  metricLabel: {
    fontSize: 10,
    color: MedicalTheme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: MedicalTheme.colors.border,
    paddingTop: MedicalTheme.spacing.sm,
  },
  cardCta: {
    color: MedicalTheme.colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  footer: {
    paddingHorizontal: MedicalTheme.spacing.lg,
    paddingBottom: MedicalTheme.spacing.lg,
  },
});
