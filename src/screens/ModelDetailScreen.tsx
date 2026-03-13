import React, { useMemo, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { MedicalTheme } from '../constants/medicalTheme';
import DisclaimerFooter from '../components/DisclaimerFooter';
import { MODEL_DIAGNOSES, MODEL_DIAGNOSES_LABELS } from '../lib/diseaseLists';
import { MODEL_METRICS, ModelInfo, ModelMetrics } from '../lib/modelMetrics';
import severityMap from '../severity/severityMap';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ModelDetail'>;

const METRIC_LABELS: Record<keyof ModelMetrics, string> = {
  loss: 'Test Loss',
  acc: 'Test Accuracy',
  macroPrecision: 'Macro Precision',
  macroRecall: 'Macro Recall',
  macroF1: 'Macro F1',
  top3: 'Top-3 Accuracy',
  top5: 'Top-5 Accuracy',
};

const METRIC_DESCRIPTIONS: Record<keyof ModelMetrics, string> = {
  loss: 'Average prediction error on the test set. Lower values are better.',
  acc: 'Share of test cases where the top prediction exactly matches the true diagnosis.',
  macroPrecision:
    'Average precision across all diseases, weighting each disease equally regardless of size.',
  macroRecall:
    'Average recall across all diseases, showing how often each disease is correctly found.',
  macroF1:
    'Balanced summary of macro precision and macro recall across all diseases.',
  top3: 'Share of test cases where the true diagnosis appears within the top 3 predictions.',
  top5: 'Share of test cases where the true diagnosis appears within the top 5 predictions.',
};

const KEY_METRICS: (keyof ModelMetrics)[] = ['acc', 'macroF1', 'top5'];

type SeverityMeta = {
  level: number;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  textColor: string;
};

const SEVERITY_META: Record<number, SeverityMeta> = {
  1: {
    level: 1,
    label: 'Low',
    description: 'Lower urgency reference label',
    color: '#16A34A',
    bgColor: '#ECFDF5',
    textColor: '#16A34A',
  },
  2: {
    level: 2,
    label: 'Moderate',
    description: 'Follow-up may be appropriate',
    color: '#D97706',
    bgColor: '#FFFBEB',
    textColor: '#D97706',
  },
  3: {
    level: 3,
    label: 'High',
    description: 'Higher urgency reference label',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    textColor: '#DC2626',
  },
  4: {
    level: 4,
    label: 'Critical',
    description: 'Highest urgency reference label',
    color: '#7C3AED',
    bgColor: '#F3F0FF',
    textColor: '#7C3AED',
  },
};

type ConfusionItem = { trueLabel: string; predLabel: string; count?: number };

function formatMetric(value: number) {
  return value.toFixed(4);
}

function getMetricAccentColor(key: keyof ModelMetrics, value: number): string {
  if (key === 'acc' || key === 'top3' || key === 'top5' || key === 'macroF1') {
    if (value >= 0.85) return MedicalTheme.colors.green;
    if (value >= 0.7) return MedicalTheme.colors.alertAmber;
    return MedicalTheme.colors.alertRed;
  }
  return MedicalTheme.colors.muted;
}

function extractThreshold(label: string): number | null {
  const match = label.match(/threshold\s+(\d+)/i);
  return match ? Number(match[1]) : null;
}

function getThresholdVariantNote(label: string) {
  const threshold = extractThreshold(label);
  if (!threshold) {
    return 'This threshold variant keeps only diseases that meet the minimum sample cutoff, then balances retained diseases to 200 samples each.';
  }
  return `This variant keeps only diseases with at least ${threshold} original samples, then removes excess samples until each retained disease has exactly 200 samples.`;
}

function renderMetrics(
  metricsMean: ModelMetrics,
  metricsStd?: Partial<ModelMetrics>,
  keys?: (keyof ModelMetrics)[],
) {
  const labelKeys = keys ?? (Object.keys(METRIC_LABELS) as (keyof ModelMetrics)[]);
  return (
    <View style={styles.metricsTable}>
      {labelKeys.map((key) => {
        const meanValue = metricsMean[key];
        const stdValue = metricsStd?.[key];
        const accentColor = getMetricAccentColor(key, meanValue);
        return (
          <View key={key} style={styles.metricRow}>
            <View style={styles.metricLabelGroup}>
              <Text style={styles.metricLabel}>{METRIC_LABELS[key]}</Text>
              <Text style={styles.metricDescription}>{METRIC_DESCRIPTIONS[key]}</Text>
            </View>
            <View style={styles.metricValueRow}>
              <View style={[styles.metricDot, { backgroundColor: accentColor }]} />
              <Text style={[styles.metricValue, { color: accentColor }]}>
                {formatMetric(meanValue)}
                {typeof stdValue === 'number' ? ` +/- ${formatMetric(stdValue)}` : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function renderConfusions(items: ConfusionItem[]) {
  if (!items.length) {
    return <Text style={styles.confusionEmpty}>Top confusions not available.</Text>;
  }

  return (
    <View style={styles.confusionList}>
      {items.map((item, index) => (
        <View
          key={`${item.trueLabel}-${item.predLabel}-${item.count ?? index}`}
          style={styles.confusionItem}
        >
          <Text style={styles.confusionRank}>#{index + 1}</Text>
          <View style={styles.confusionBody}>
            <Text style={styles.confusionText}>{item.trueLabel}</Text>
            <Text style={styles.confusionMeta}>Predicted as {item.predLabel}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function ModelDetailScreen({ route }: Props) {
  const { modelKey } = route.params;
  const info: ModelInfo = MODEL_METRICS[modelKey];
  const [showConfusions, setShowConfusions] = useState(false);
  const [showBaselineConfusions, setShowBaselineConfusions] = useState(false);
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const [showDiagnoses, setShowDiagnoses] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string | null>(null);

  const isThresholdStudy = modelKey === 'ablation_study';
  const tag = useMemo(
    () => (isThresholdStudy ? 'Supporting Study' : 'Main Study'),
    [isThresholdStudy],
  );
  const diagnoses = MODEL_DIAGNOSES[modelKey] ?? [];
  const diagnosesLabel = MODEL_DIAGNOSES_LABELS[modelKey] ?? 'Model diagnosis list';
  const selectedSeverity = selectedDiagnosis
    ? SEVERITY_META[severityMap[selectedDiagnosis.toLowerCase()]]
    : null;
  const wikiUrl = selectedDiagnosis
    ? `https://en.wikipedia.org/wiki/${encodeURIComponent(selectedDiagnosis.replace(/\s+/g, '_'))}`
    : '';
  const mayoUrl = selectedDiagnosis
    ? `https://www.mayoclinic.org/search/search-results?q=${encodeURIComponent(selectedDiagnosis)}`
    : '';

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
        <View style={styles.heroCard}>
          <View style={styles.heroAccentBar} />
          <View style={styles.heroCardBody}>
            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            </View>
            <Text style={styles.title}>{info.displayName}</Text>
            <Text style={styles.subtitle}>{info.description}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {isThresholdStudy ? 'Study Setup' : 'Training Data'}
          </Text>
          <Text style={styles.bodyText}>{info.trainingDataDetails}</Text>
          <Pressable
            onPress={() => setShowDiagnoses(true)}
            style={({ pressed }) => [styles.diagnosesButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.diagnosesButtonText}>View possible diagnoses</Text>
          </Pressable>
        </View>

        {isThresholdStudy ? (
          <>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitleNoMargin}>Metric Visibility</Text>
                <Pressable
                  onPress={() => setShowAllMetrics((prev) => !prev)}
                  style={({ pressed }) => [styles.toggleButton, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.toggleButtonText}>
                    {showAllMetrics ? 'Show fewer' : 'All metrics'}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.bodyText}>
                Toggle between the key metrics and the full metric table inside each threshold card.
              </Text>
            </View>

            <View style={[styles.sectionCard, styles.warningCard]}>
              <View style={styles.warningIcon}>
                <Text style={styles.warningIconText}>!</Text>
              </View>
              <View style={styles.warningBody}>
                <Text style={styles.sectionTitle}>Threshold Coverage Warning</Text>
                <Text style={styles.bodyText}>
                  Each thresholded Autoencoder MLP Classifier keeps only diseases whose original
                  sample counts meet the cutoff, then removes samples until every retained disease
                  has exactly 200 samples. This page compares how stricter cutoffs change the
                  diagnosis pool before that balancing step.
                </Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Threshold Variants</Text>
              <Text style={styles.bodyText}>
                Review the three thresholded variants side by side. Higher cutoffs retain fewer
                diseases, but every retained disease is balanced to the same 200-sample size for a
                more controlled comparison.
              </Text>
              <View style={styles.variantStack}>
                {info.studyVariants?.map((variant) => (
                  <View key={variant.label} style={styles.variantCard}>
                    <View style={styles.variantHeader}>
                      <Text style={styles.variantTitle}>
                        {variant.label.replace('Autoencoder MLP Classifier ', '')}
                      </Text>
                      {(() => {
                        const threshold = extractThreshold(variant.label);
                        return threshold ? (
                          <View style={styles.variantBadge}>
                            <Text style={styles.variantBadgeText}>Min {threshold} samples</Text>
                          </View>
                        ) : null;
                      })()}
                    </View>
                    <Text style={styles.variantText}>{getThresholdVariantNote(variant.label)}</Text>
                    {renderMetrics(
                      variant.metricsMean,
                      variant.metricsStd,
                      showAllMetrics ? undefined : KEY_METRICS,
                    )}
                    <Text style={styles.subsectionTitle}>Top Confusions</Text>
                    {renderConfusions(variant.topConfusions ?? [])}
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            {info.extraNotes ? (
              <View style={[styles.sectionCard, styles.noteCard]}>
                <View style={styles.noteIcon}>
                  <View style={styles.noteDot} />
                </View>
                <View style={styles.noteBody}>
                  <Text style={styles.sectionTitle}>Model Note</Text>
                  <Text style={styles.bodyText}>{info.extraNotes}</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitleNoMargin}>Performance Metrics</Text>
                <Pressable
                  onPress={() => setShowAllMetrics((prev) => !prev)}
                  style={({ pressed }) => [styles.toggleButton, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.toggleButtonText}>
                    {showAllMetrics ? 'Show fewer' : 'All metrics'}
                  </Text>
                </Pressable>
              </View>
              {renderMetrics(
                info.metricsMean,
                info.metricsStd,
                showAllMetrics ? undefined : KEY_METRICS,
              )}
            </View>

            {info.baselineComparison ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>{info.baselineComparison.label}</Text>
                {info.baselineComparison.extraNotes ? (
                  <Text style={styles.bodyText}>{info.baselineComparison.extraNotes}</Text>
                ) : null}
                {renderMetrics(
                  info.baselineComparison.metricsMean,
                  info.baselineComparison.metricsStd,
                  showAllMetrics ? undefined : KEY_METRICS,
                )}
              </View>
            ) : null}

            <View style={styles.sectionCard}>
              <Pressable
                onPress={() => setShowConfusions((prev) => !prev)}
                style={({ pressed }) => [styles.toggleButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.toggleButtonText}>
                  {showConfusions ? 'Hide top confusions' : 'Show top confusions'}
                </Text>
              </Pressable>
              {showConfusions ? renderConfusions(info.topConfusions ?? []) : null}
            </View>

            {info.baselineComparison ? (
              <View style={styles.sectionCard}>
                <Pressable
                  onPress={() => setShowBaselineConfusions((prev) => !prev)}
                  style={({ pressed }) => [styles.toggleButton, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.toggleButtonText}>
                    {showBaselineConfusions
                      ? 'Hide baseline confusions'
                      : 'Show baseline confusions'}
                  </Text>
                </Pressable>
                {showBaselineConfusions
                  ? renderConfusions(info.baselineComparison.topConfusions ?? [])
                  : null}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <Modal
        visible={showDiagnoses}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDiagnoses(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Possible Diagnoses</Text>
              <Pressable
                onPress={() => setShowDiagnoses(false)}
                style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.buttonPressed]}
              >
                <Text style={styles.modalCloseBtnText}>Close</Text>
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>{diagnosesLabel}</Text>
            <ScrollView
              style={styles.modalList}
              contentContainerStyle={styles.modalListContent}
              showsVerticalScrollIndicator={false}
            >
              {diagnoses.map((item) => (
                <Pressable
                  key={item}
                  style={({ pressed }) => [
                    styles.modalListItem,
                    pressed && styles.modalListItemPressed,
                  ]}
                  onPress={() => setSelectedDiagnosis(item)}
                  accessibilityRole="button"
                >
                  <Text style={styles.modalListItemText}>{item}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!selectedDiagnosis}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDiagnosis(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedDiagnosis(null)}>
          <Pressable style={styles.diagnosisCard} onPress={() => null}>
            <View
              style={[
                styles.diagnosisAccentBar,
                { backgroundColor: selectedSeverity?.color ?? MedicalTheme.colors.primary },
              ]}
            />
            <View style={styles.diagnosisCardBody}>
              <Text style={styles.diagnosisTitle}>{selectedDiagnosis}</Text>
              <View style={styles.diagnosisRow}>
                <Text style={styles.diagnosisLabel}>Urgency</Text>
                {selectedSeverity ? (
                  <View
                    style={[
                      styles.severityBadge,
                      {
                        backgroundColor: selectedSeverity.bgColor,
                        borderColor: `${selectedSeverity.color}30`,
                      },
                    ]}
                  >
                    <View
                      style={[styles.severityDot, { backgroundColor: selectedSeverity.color }]}
                    />
                    <Text
                      style={[
                        styles.severityBadgeText,
                        { color: selectedSeverity.textColor },
                      ]}
                    >
                      {selectedSeverity.label}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.diagnosisValue}>Unknown</Text>
                )}
              </View>
              <View style={styles.diagnosisLinks}>
                <Pressable
                  style={({ pressed }) => [styles.diagnosisLink, pressed && styles.buttonPressed]}
                  onPress={() => Linking.openURL(mayoUrl)}
                >
                  <Text style={styles.diagnosisLinkText}>Open Mayo Clinic</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.diagnosisLinkAlt,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => Linking.openURL(wikiUrl)}
                >
                  <Text style={styles.diagnosisLinkAltText}>Open Wikipedia</Text>
                </Pressable>
              </View>
              <Pressable
                style={({ pressed }) => [styles.diagnosisClose, pressed && styles.buttonPressed]}
                onPress={() => setSelectedDiagnosis(null)}
              >
                <Text style={styles.diagnosisCloseText}>Close</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
  heroCard: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.xl,
    marginBottom: MedicalTheme.spacing.md,
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
  tagRow: {
    marginBottom: 10,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: MedicalTheme.colors.greenLight,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.green + '30',
  },
  tagText: {
    color: MedicalTheme.colors.green,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    marginBottom: 6,
  },
  subtitle: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  sectionCard: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.lg,
    padding: MedicalTheme.spacing.lg,
    marginBottom: MedicalTheme.spacing.md,
    ...MedicalTheme.shadow.md,
  },
  noteCard: {
    flexDirection: 'row',
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: MedicalTheme.colors.alertAmber,
    backgroundColor: '#FFFBEB',
  },
  warningCard: {
    flexDirection: 'row',
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: MedicalTheme.colors.alertAmber,
    backgroundColor: '#FFFBEB',
  },
  noteIcon: {
    paddingTop: 3,
  },
  noteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MedicalTheme.colors.alertAmber,
  },
  warningIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: MedicalTheme.colors.alertAmber,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  warningIconText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  noteBody: {
    flex: 1,
  },
  warningBody: {
    flex: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: MedicalTheme.spacing.sm,
    gap: 12,
  },
  sectionTitle: {
    color: MedicalTheme.colors.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: MedicalTheme.spacing.sm,
  },
  sectionTitleNoMargin: {
    color: MedicalTheme.colors.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    flex: 1,
  },
  subsectionTitle: {
    color: MedicalTheme.colors.text,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: MedicalTheme.spacing.md,
    marginBottom: MedicalTheme.spacing.sm,
  },
  bodyText: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  toggleButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.primary + '35',
    backgroundColor: MedicalTheme.colors.primaryLight,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  toggleButtonText: {
    color: MedicalTheme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  diagnosesButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: MedicalTheme.colors.greenLight,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.green + '30',
    marginTop: MedicalTheme.spacing.sm,
  },
  diagnosesButtonText: {
    color: MedicalTheme.colors.green,
    fontSize: 13,
    fontWeight: '700',
  },
  variantStack: {
    marginTop: MedicalTheme.spacing.md,
    gap: MedicalTheme.spacing.md,
  },
  variantCard: {
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    borderRadius: MedicalTheme.radius.md,
    padding: MedicalTheme.spacing.md,
    backgroundColor: MedicalTheme.colors.background,
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  variantTitle: {
    flex: 1,
    color: MedicalTheme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  variantBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: MedicalTheme.colors.primaryLight,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.primary + '30',
  },
  variantBadgeText: {
    color: MedicalTheme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  variantText: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  metricsTable: {
    marginTop: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: MedicalTheme.colors.border,
    gap: 12,
  },
  metricLabelGroup: {
    flex: 1,
  },
  metricLabel: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  metricDescription: {
    color: MedicalTheme.colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 1,
  },
  metricDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  confusionList: {
    gap: 6,
  },
  confusionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: MedicalTheme.radius.sm,
    backgroundColor: MedicalTheme.colors.surface,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
  },
  confusionRank: {
    color: MedicalTheme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
    minWidth: 24,
  },
  confusionBody: {
    flex: 1,
  },
  confusionText: {
    color: MedicalTheme.colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  confusionMeta: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  confusionEmpty: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 13,
    marginTop: MedicalTheme.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: MedicalTheme.spacing.lg,
  },
  modalCard: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.xl,
    padding: MedicalTheme.spacing.lg,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 520,
    ...MedicalTheme.shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
  },
  modalCloseBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    backgroundColor: MedicalTheme.colors.background,
  },
  modalCloseBtnText: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 12,
    marginBottom: MedicalTheme.spacing.sm,
  },
  modalList: {
    marginTop: 4,
  },
  modalListContent: {
    paddingBottom: MedicalTheme.spacing.md,
  },
  modalListItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: MedicalTheme.radius.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    marginBottom: 6,
    backgroundColor: MedicalTheme.colors.background,
  },
  modalListItemPressed: {
    opacity: 0.75,
  },
  modalListItemText: {
    color: MedicalTheme.colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  diagnosisCard: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.xl,
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
    ...MedicalTheme.shadow.lg,
  },
  diagnosisAccentBar: {
    height: 3,
  },
  diagnosisCardBody: {
    padding: MedicalTheme.spacing.lg,
  },
  diagnosisTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    marginBottom: MedicalTheme.spacing.md,
  },
  diagnosisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: MedicalTheme.spacing.md,
  },
  diagnosisLabel: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  diagnosisValue: {
    color: MedicalTheme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  severityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  severityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  diagnosisLinks: {
    gap: 8,
    marginBottom: MedicalTheme.spacing.md,
  },
  diagnosisLink: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: MedicalTheme.radius.md,
    backgroundColor: MedicalTheme.colors.primary,
    alignItems: 'center',
  },
  diagnosisLinkText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  diagnosisLinkAlt: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: MedicalTheme.radius.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    backgroundColor: MedicalTheme.colors.background,
    alignItems: 'center',
  },
  diagnosisLinkAltText: {
    color: MedicalTheme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  diagnosisClose: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    backgroundColor: MedicalTheme.colors.background,
  },
  diagnosisCloseText: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: MedicalTheme.spacing.lg,
    paddingBottom: MedicalTheme.spacing.lg,
  },
});
