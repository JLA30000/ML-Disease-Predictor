import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { MedicalTheme } from '../constants/medicalTheme';
import DisclaimerFooter from '../components/DisclaimerFooter';
import { ModelPrediction } from '../lib/api';
import {
  getPredictionModelBadge,
  getPredictionModelLabel,
  getPredictionModelRank,
  getThresholdModelWarning,
} from '../lib/predictionModels';
import { RootStackParamList } from '../types/navigation';
import severityMap from '../severity/severityMap';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

type SelectedDisease = {
  name: string;
  probability: number;
  category: string;
};

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

function formatProbability(value: number) {
  if (!Number.isFinite(value)) {
    return 'N/A';
  }
  const normalized = value > 1 ? value : value * 100;
  return `${normalized.toFixed(1)}%`;
}

function normalizeProbToPercent(value: number): number {
  const pct = value > 1 ? value : value * 100;
  return Math.min(100, Math.max(0, pct));
}

function getConfidenceColor(pct: number): string {
  if (pct >= 70) return MedicalTheme.colors.green;
  if (pct >= 40) return MedicalTheme.colors.primary;
  return MedicalTheme.colors.muted;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getDiseaseCategory(disease: string) {
  const name = disease.toLowerCase();
  if (name.includes('cancer') || name.includes('carcinoma') || name.includes('tumor')) {
    return 'Oncology';
  }
  if (name.includes('cardio') || name.includes('heart') || name.includes('vascular')) {
    return 'Cardiovascular';
  }
  if (name.includes('neuro') || name.includes('stroke') || name.includes('seizure')) {
    return 'Neurologic';
  }
  if (name.includes('lung') || name.includes('respir') || name.includes('asthma') || name.includes('bronch')) {
    return 'Respiratory';
  }
  if (name.includes('renal') || name.includes('kidney') || name.includes('urinary') || name.includes('bladder')) {
    return 'Urinary';
  }
  if (
    name.includes('stomach') ||
    name.includes('gastro') ||
    name.includes('intestinal') ||
    name.includes('liver')
  ) {
    return 'Digestive';
  }
  if (name.includes('skin') || name.includes('dermat') || name.includes('rash')) {
    return 'Dermatologic';
  }
  if (name.includes('bone') || name.includes('joint') || name.includes('arthritis') || name.includes('muscle')) {
    return 'Musculoskeletal';
  }
  if (name.includes('infection') || name.includes('itis') || name.includes('viral') || name.includes('bacterial')) {
    return 'Infectious / Inflammatory';
  }
  return 'General';
}

function renderList(
  title: string,
  items: ModelPrediction['top5'],
  onPress: (entry: ModelPrediction['top5'][number]) => void,
  resolveSeverity: (disease: string) => SeverityMeta | null,
) {
  const sorted = [...items].sort((a, b) => b.prob - a.prob);
  const [topPick, ...rest] = sorted;
  const topSeverity = topPick ? resolveSeverity(topPick.disease) : null;
  return (
    <View style={listStyles.block}>
      <Text style={listStyles.sectionLabel}>{title}</Text>

      {/* Top pick card */}
      {topPick ? (
        <Pressable
          style={({ pressed }) => [listStyles.topCard, pressed && listStyles.cardPressed]}
          onPress={() => onPress(topPick)}
          accessibilityRole="button"
        >
          {/* Left accent bar */}
          <View style={[listStyles.topCardAccent, { backgroundColor: topSeverity?.color ?? MedicalTheme.colors.primary }]} />
          <View style={listStyles.topCardContent}>
            <View style={listStyles.topCardHeader}>
              <View style={listStyles.rankBadge}>
                <Text style={listStyles.rankBadgeText}>#1</Text>
              </View>
              <Text style={listStyles.topCardMeta}>Highest score</Text>
            </View>
            <Text style={listStyles.topCardTitle}>{topPick.disease}</Text>

            {/* Severity row */}
            {topSeverity ? (
              <View style={listStyles.topCardRow}>
                <View style={[listStyles.severityPill, { backgroundColor: topSeverity.bgColor, borderColor: `${topSeverity.color}40` }]}>
                  <View style={[listStyles.severityDot, { backgroundColor: topSeverity.color }]} />
                  <Text style={[listStyles.severityPillText, { color: topSeverity.textColor }]}>
                    {topSeverity.label}
                  </Text>
                </View>
                <Text style={listStyles.severityCaption}>{topSeverity.description}</Text>
              </View>
            ) : null}

            {/* Confidence bar */}
            {(() => {
              const pct = normalizeProbToPercent(topPick.prob);
              const barColor = getConfidenceColor(pct);
              return (
                <View style={listStyles.confidenceWrap}>
                  <View style={listStyles.confidenceTrack}>
                    <View
                      style={[
                        listStyles.confidenceFill,
                        { width: `${pct}%` as `${number}%`, backgroundColor: barColor },
                      ]}
                    />
                  </View>
                  <Text style={[listStyles.confidenceValue, { color: barColor }]}>
                    {formatProbability(topPick.prob)}
                  </Text>
                </View>
              );
            })()}
          </View>
        </Pressable>
      ) : null}

      {/* Remaining predictions grid */}
      <View style={listStyles.grid}>
        {rest.map((entry, index) => {
          const severity = resolveSeverity(entry.disease);
          return (
            <Pressable
              key={`${entry.disease}-${index}`}
              style={({ pressed }) => [listStyles.gridCard, pressed && listStyles.cardPressed]}
              onPress={() => onPress(entry)}
              accessibilityRole="button"
            >
              <View style={listStyles.gridCardHeader}>
                <Text style={listStyles.gridRank}>#{index + 2}</Text>
                {severity ? (
                  <View style={[listStyles.gridSeverityPill, { backgroundColor: severity.bgColor, borderColor: `${severity.color}40` }]}>
                    <Text style={[listStyles.gridSeverityText, { color: severity.textColor }]}>
                      {severity.label}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={listStyles.gridCardTitle}>{entry.disease}</Text>
              {/* Compact confidence bar */}
              {(() => {
                const pct = normalizeProbToPercent(entry.prob);
                const barColor = getConfidenceColor(pct);
                return (
                  <View style={listStyles.gridConfidenceRow}>
                    <View style={listStyles.gridConfidenceTrack}>
                      <View
                        style={[
                          listStyles.gridConfidenceFill,
                          { width: `${pct}%` as `${number}%`, backgroundColor: barColor },
                        ]}
                      />
                    </View>
                    <Text style={[listStyles.gridCardProb, { color: barColor }]}>
                      {formatProbability(entry.prob)}
                    </Text>
                  </View>
                );
              })()}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const listStyles = StyleSheet.create({
  block: {
    marginBottom: MedicalTheme.spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: MedicalTheme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  topCard: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.lg,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    ...MedicalTheme.shadow.md,
  },
  cardPressed: {
    opacity: 0.82,
  },
  topCardAccent: {
    width: 3,
  },
  topCardContent: {
    flex: 1,
    padding: MedicalTheme.spacing.md,
  },
  topCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rankBadge: {
    backgroundColor: MedicalTheme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  topCardMeta: {
    color: MedicalTheme.colors.muted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  topCardTitle: {
    color: MedicalTheme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    lineHeight: 24,
  },
  topCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  severityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  severityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  severityPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  severityCaption: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
  topCardProb: {
    color: MedicalTheme.colors.green,
    fontSize: 20,
    fontWeight: '800',
  },
  confidenceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  confidenceTrack: {
    flex: 1,
    height: 6,
    backgroundColor: MedicalTheme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceValue: {
    fontSize: 15,
    fontWeight: '800',
    minWidth: 52,
    textAlign: 'right',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCard: {
    width: '48%',
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    padding: MedicalTheme.spacing.md,
    ...MedicalTheme.shadow.sm,
  },
  gridCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  gridRank: {
    color: MedicalTheme.colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  gridSeverityPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  gridSeverityText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  gridCardTitle: {
    color: MedicalTheme.colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 18,
  },
  gridCardProb: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 38,
    textAlign: 'right',
  },
  gridConfidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gridConfidenceTrack: {
    flex: 1,
    height: 4,
    backgroundColor: MedicalTheme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  gridConfidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default function ResultsScreen({ navigation, route }: Props) {
  const [selectedDisease, setSelectedDisease] = useState<SelectedDisease | null>(null);

  if (route.params.mode === 'legacy') {
    return (
      <View style={styles.root}>
        <View style={styles.legacyContent}>
          <Text style={styles.title}>Results</Text>
          <Text style={styles.subtitle}>
            This results flow is no longer supported. Please use the Symptoms screen.
          </Text>
        </View>
        <DisclaimerFooter style={styles.footerStandalone} />
      </View>
    );
  }

  const { predictions, selectedSymptoms } = route.params;
  const summary =
    selectedSymptoms.length > 6
      ? `${selectedSymptoms.slice(0, 6).join(', ')} +${selectedSymptoms.length - 6} more`
      : selectedSymptoms.join(', ');

  const resolveSeverity = (disease: string): SeverityMeta | null => {
    const level = severityMap[disease.toLowerCase()];
    if (!level) {
      return null;
    }
    return SEVERITY_META[level] ?? null;
  };

  const buildModelPdfHtml = (model: ModelPrediction) => {
    const symptomList =
      selectedSymptoms.length > 0
        ? selectedSymptoms.map((symptom) => `<li>${escapeHtml(symptom)}</li>`).join('')
        : '<li>No symptoms selected</li>';
    const sortedTop5 = [...model.top5].sort((a, b) => b.prob - a.prob).slice(0, 5);
    const topRows = sortedTop5
      .map((entry, index) => {
        const severity = resolveSeverity(entry.disease);
        const wiki = `https://en.wikipedia.org/wiki/${encodeURIComponent(
          entry.disease.replace(/\s+/g, '_'),
        )}`;
        const mayo = `https://www.mayoclinic.org/search/search-results?q=${encodeURIComponent(
          entry.disease,
        )}`;
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(entry.disease)}</td>
            <td>${formatProbability(entry.prob)}</td>
            <td>${escapeHtml(severity ? severity.label : 'Unknown')}</td>
            <td>
              <a href="${mayo}">Mayo Clinic</a><br/>
              <a href="${wiki}">Wikipedia</a>
            </td>
          </tr>
        `;
      })
      .join('');
    const severityKeyRows = Object.values(SEVERITY_META)
      .map(
        (entry) => `
          <div class="severity-row">
            <span class="severity-pill" style="background:${entry.color}; color:#fff;">
              ${escapeHtml(entry.label)}
            </span>
            <span class="severity-desc">${escapeHtml(entry.description)}</span>
          </div>
        `,
      )
      .join('');
    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(getPredictionModelLabel(model.model_key))} Summary</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; }
            h2 { font-size: 14px; margin: 16px 0 8px; text-transform: uppercase; letter-spacing: 0.6px; }
            .section { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 14px; }
            ul { margin: 6px 0 0 18px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #f8fafc; font-weight: 700; }
            .model-name { font-weight: 700; font-size: 14px; }
            .severity-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
            .severity-pill { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
            .severity-desc { font-size: 12px; color: #475569; }
          </style>
        </head>
        <body>
          <div class="section">
            <h2>Research Disclaimer</h2>
            <div>This document contains model-generated research outputs only. It is not a diagnosis and should not be used for treatment or triage decisions.</div>
          </div>
          <div class="section">
            <h2>User Symptoms</h2>
            <ul>${symptomList}</ul>
          </div>
          <div class="section">
            <h2>Model Name</h2>
            <div class="model-name">${escapeHtml(getPredictionModelLabel(model.model_key))}</div>
          </div>
          <div class="section">
            <h2>Top 5 Model Outputs</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Diagnosis</th>
                  <th>Confidence</th>
                  <th>Urgency</th>
                  <th>Links</th>
                </tr>
              </thead>
              <tbody>${topRows}</tbody>
            </table>
          </div>
          <div class="section">
            <h2>Urgency Reference</h2>
            ${severityKeyRows}
          </div>
        </body>
      </html>
    `;
  };

  const handleExportPdf = async (model: ModelPrediction) => {
    try {
      const html = buildModelPdfHtml(model);
      if (Platform.OS === 'web') {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.srcdoc = html;
        iframe.onload = () => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } finally {
            setTimeout(() => iframe.remove(), 250);
          }
        };
        document.body.appendChild(iframe);
        return;
      }
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      } else {
        Alert.alert('PDF Ready', `Saved to: ${uri}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create PDF.';
      Alert.alert('Export failed', message);
    }
  };

  const handleSelectDisease = (entry: ModelPrediction['top5'][number]) => {
    setSelectedDisease({
      name: entry.disease,
      probability: entry.prob,
      category: getDiseaseCategory(entry.disease),
    });
  };

  const closeModal = () => setSelectedDisease(null);

  const wikiUrl = selectedDisease
    ? `https://en.wikipedia.org/wiki/${encodeURIComponent(selectedDisease.name.replace(/\s+/g, '_'))}`
    : '';
  const mayoUrl = selectedDisease
    ? `https://www.mayoclinic.org/search/search-results?q=${encodeURIComponent(selectedDisease.name)}`
    : '';
  const selectedSeverity = selectedDisease ? resolveSeverity(selectedDisease.name) : null;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.contentWrap}>
        <FlatList
          data={[...predictions].sort(
            (a, b) => getPredictionModelRank(a.model_key) - getPredictionModelRank(b.model_key),
          )}
          keyExtractor={(item) => item.model_key}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          bounces={false}
          alwaysBounceVertical={false}
          alwaysBounceHorizontal={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>Model Output Summary</Text>

              {/* Symptom summary pill */}
              <View style={styles.symptomSummaryRow}>
                <View style={styles.symptomSummaryPill}>
                  <Text style={styles.symptomSummaryLabel}>Symptoms</Text>
                  <Text style={styles.symptomSummaryText} numberOfLines={2}>
                    {summary || 'None provided'}
                  </Text>
                </View>
              </View>

              {/* Info tabs row */}
              <View style={styles.infoTabsRow}>
                <View style={styles.infoTab}>
                  <Text style={styles.infoTabTitle}>Model Score %</Text>
                  <Text style={styles.infoTabBody}>
                    Reflects how strongly the model matches symptom patterns, not likelihood of disease.
                  </Text>
                </View>
                <View style={styles.infoTabSep} />
                <View style={styles.infoTab}>
                  <Text style={styles.infoTabTitle}>Urgency Reference</Text>
                  <View style={styles.severityLegend}>
                    {Object.values(SEVERITY_META).map((entry) => (
                      <View key={entry.level} style={styles.severityLegendRow}>
                        <View style={[styles.severityLegendDot, { backgroundColor: entry.color }]} />
                        <Text style={[styles.severityLegendLabel, { color: entry.textColor }]}>
                          {entry.label}
                        </Text>
                        <Text style={styles.severityLegendDesc}>{entry.description}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.modelCard}>
              {/* Model card header */}
              <View style={styles.modelCardHeader}>
                <View style={styles.modelCardLeft}>
                  <Text style={styles.modelName}>{getPredictionModelLabel(item.model_key)}</Text>
                  <View style={styles.modelBadges}>
                    <View style={styles.modelTypeBadge}>
                      <Text style={styles.modelTypeBadgeText}>
                        {getPredictionModelBadge(item.model_key, item.model_type)}
                      </Text>
                    </View>
                    <View style={styles.modelClassBadge}>
                      <Text style={styles.modelClassBadgeText}>{item.num_classes} classes</Text>
                    </View>
                  </View>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.exportButton, pressed && styles.exportButtonPressed]}
                  onPress={() => handleExportPdf(item)}
                  accessibilityRole="button"
                >
                  <Text style={styles.exportButtonText}>Export PDF</Text>
                </Pressable>
              </View>

              {(() => {
                const warning = getThresholdModelWarning(item.model_key);
                if (!warning) {
                  return null;
                }
                return (
                  <View style={styles.thresholdWarningCard}>
                    <View style={styles.thresholdWarningIconWrap}>
                      <Text style={styles.thresholdWarningIcon}>!</Text>
                    </View>
                    <View style={styles.thresholdWarningBody}>
                      <Text style={styles.thresholdWarningTitle}>{warning.title}</Text>
                      <Text style={styles.thresholdWarningText}>{warning.message}</Text>
                      <Pressable
                        style={({ pressed }) => [
                          styles.thresholdWarningButton,
                          pressed && styles.thresholdWarningButtonPressed,
                        ]}
                        onPress={() => navigation.navigate('ModelsInfo')}
                      >
                        <Text style={styles.thresholdWarningButtonText}>Learn more</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })()}

              <View style={styles.modelCardDivider} />

              {renderList('Top 5 Model Outputs', item.top5, handleSelectDisease, resolveSeverity)}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.subtitle}>No predictions returned.</Text>
            </View>
          }
        />
        <DisclaimerFooter style={styles.footerList} />
      </View>

      {/* Disease detail modal */}
      <Modal transparent visible={!!selectedDisease} animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.modalBackdrop} onPress={closeModal}>
          <Pressable style={styles.modalCard} onPress={() => null}>
            {selectedDisease && (
              <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* Modal accent bar */}
                <View style={[styles.modalAccentBar, { backgroundColor: selectedSeverity?.color ?? MedicalTheme.colors.primary }]} />

                <Text style={styles.modalTitle}>{selectedDisease.name}</Text>
                <Text style={styles.modalSubtitle}>
                  Model score: {formatProbability(selectedDisease.probability)}
                </Text>

                <View style={styles.modalInfoGrid}>
                  <View style={styles.modalInfoCell}>
                    <Text style={styles.modalInfoLabel}>Urgency</Text>
                    {selectedSeverity ? (
                      <View style={[styles.modalSeverityBadge, { backgroundColor: selectedSeverity.bgColor, borderColor: `${selectedSeverity.color}40` }]}>
                        <View style={[styles.severityDot, { backgroundColor: selectedSeverity.color }]} />
                        <Text style={[styles.modalSeverityText, { color: selectedSeverity.textColor }]}>
                          {selectedSeverity.label}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.modalInfoValue}>Unknown</Text>
                    )}
                  </View>
                  <View style={styles.modalInfoCell}>
                    <Text style={styles.modalInfoLabel}>Category</Text>
                    <Text style={styles.modalInfoValue}>{selectedDisease.category}</Text>
                  </View>
                </View>

                {selectedSeverity ? (
                  <View style={[styles.modalSeverityNote, { backgroundColor: selectedSeverity.bgColor, borderColor: `${selectedSeverity.color}30` }]}>
                    <Text style={[styles.modalSeverityNoteText, { color: selectedSeverity.textColor }]}>
                      {selectedSeverity.description}
                    </Text>
                  </View>
                ) : null}

                <Text style={styles.modalBody}>
                  This is a model-generated research output based on reported symptoms. It is not a
                  diagnosis and should not be used for treatment or triage decisions.
                </Text>

                <View style={styles.modalLinks}>
                  <Pressable
                    style={({ pressed }) => [styles.modalLinkButton, pressed && styles.linkPressed]}
                    onPress={() => Linking.openURL(mayoUrl)}
                  >
                    <Text style={styles.modalLinkButtonText}>Open Mayo Clinic</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.modalLinkButtonAlt, pressed && styles.linkPressed]}
                    onPress={() => Linking.openURL(wikiUrl)}
                  >
                    <Text style={styles.modalLinkButtonAltText}>Open Wikipedia</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.modalCloseButton, pressed && styles.linkPressed]}
                  onPress={closeModal}
                >
                  <Text style={styles.modalCloseText}>Close</Text>
                </Pressable>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: MedicalTheme.colors.background,
    overflow: 'hidden',
  },
  contentWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  list: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    paddingBottom: MedicalTheme.spacing.lg,
    paddingHorizontal: MedicalTheme.spacing.lg,
    flexGrow: 1,
    minWidth: '100%',
  },

  // Header
  header: {
    marginBottom: MedicalTheme.spacing.md,
    paddingTop: MedicalTheme.spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    marginBottom: MedicalTheme.spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: MedicalTheme.colors.textSecondary,
  },
  symptomSummaryRow: {
    marginBottom: MedicalTheme.spacing.md,
  },
  symptomSummaryPill: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.md,
    padding: MedicalTheme.spacing.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    borderLeftWidth: 3,
    borderLeftColor: MedicalTheme.colors.primary,
    ...MedicalTheme.shadow.sm,
  },
  symptomSummaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: MedicalTheme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  symptomSummaryText: {
    color: MedicalTheme.colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  infoTabsRow: {
    flexDirection: 'row',
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.lg,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    overflow: 'hidden',
    marginBottom: MedicalTheme.spacing.xs,
    ...MedicalTheme.shadow.sm,
  },
  infoTab: {
    flex: 1,
    padding: MedicalTheme.spacing.md,
  },
  infoTabSep: {
    width: 1,
    backgroundColor: MedicalTheme.colors.border,
  },
  infoTabTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  infoTabBody: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  severityLegend: {
    gap: 5,
  },
  severityLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  severityLegendDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  severityLegendLabel: {
    fontSize: 10,
    fontWeight: '700',
    minWidth: 52,
  },
  severityLegendDesc: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 10,
    flex: 1,
  },

  // Model card
  modelCard: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.xl,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    padding: MedicalTheme.spacing.lg,
    marginBottom: MedicalTheme.spacing.md,
    ...MedicalTheme.shadow.md,
  },
  modelCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: MedicalTheme.spacing.md,
  },
  modelCardLeft: {
    flex: 1,
  },
  modelName: {
    fontSize: 17,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    marginBottom: 6,
  },
  modelBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  modelTypeBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: MedicalTheme.colors.primaryLight,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.primary + '30',
  },
  modelTypeBadgeText: {
    color: MedicalTheme.colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  modelClassBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
  },
  modelClassBadgeText: {
    color: MedicalTheme.colors.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  exportButton: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: MedicalTheme.colors.background,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
  },
  exportButtonPressed: {
    opacity: 0.75,
  },
  exportButtonText: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  modelCardDivider: {
    height: 1,
    backgroundColor: MedicalTheme.colors.border,
    marginBottom: MedicalTheme.spacing.md,
  },
  thresholdWarningCard: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: MedicalTheme.radius.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.alertAmber + '35',
    backgroundColor: '#FFFBEB',
    padding: MedicalTheme.spacing.sm,
    marginBottom: MedicalTheme.spacing.md,
  },
  thresholdWarningIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: MedicalTheme.colors.alertAmber,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  thresholdWarningIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  thresholdWarningBody: {
    flex: 1,
  },
  thresholdWarningTitle: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },
  thresholdWarningText: {
    color: '#92400E',
    fontSize: 12,
    lineHeight: 18,
  },
  thresholdWarningButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#FDE68A',
  },
  thresholdWarningButtonPressed: {
    opacity: 0.8,
  },
  thresholdWarningButtonText: {
    color: '#78350F',
    fontSize: 12,
    fontWeight: '700',
  },

  // States
  emptyState: {
    padding: MedicalTheme.spacing.lg,
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.lg,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    alignItems: 'center',
    ...MedicalTheme.shadow.sm,
  },
  footerList: {
    paddingHorizontal: MedicalTheme.spacing.lg,
    paddingBottom: MedicalTheme.spacing.md,
  },
  footerStandalone: {
    paddingHorizontal: MedicalTheme.spacing.lg,
    paddingBottom: MedicalTheme.spacing.md,
  },
  legacyContent: {
    flex: 1,
    padding: MedicalTheme.spacing.lg,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: MedicalTheme.spacing.lg,
  },
  modalCard: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.xl,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    maxHeight: '88%',
    overflow: 'hidden',
    ...MedicalTheme.shadow.lg,
  },
  modalContent: {
    padding: MedicalTheme.spacing.lg,
  },
  modalAccentBar: {
    height: 3,
    borderRadius: 2,
    marginBottom: MedicalTheme.spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 13,
    marginBottom: MedicalTheme.spacing.md,
  },
  modalInfoGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: MedicalTheme.spacing.sm,
  },
  modalInfoCell: {
    flex: 1,
  },
  modalInfoLabel: {
    color: MedicalTheme.colors.muted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    fontWeight: '700',
  },
  modalInfoValue: {
    color: MedicalTheme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  modalSeverityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  severityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  modalSeverityText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  modalSeverityNote: {
    borderRadius: MedicalTheme.radius.md,
    padding: MedicalTheme.spacing.md,
    borderWidth: 1,
    marginBottom: MedicalTheme.spacing.md,
    marginTop: MedicalTheme.spacing.xs,
  },
  modalSeverityNoteText: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalBody: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: MedicalTheme.spacing.md,
  },
  modalLinks: {
    gap: 8,
    marginBottom: MedicalTheme.spacing.md,
  },
  modalLinkButton: {
    backgroundColor: MedicalTheme.colors.primary,
    borderRadius: MedicalTheme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  modalLinkButtonAlt: {
    borderRadius: MedicalTheme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    backgroundColor: MedicalTheme.colors.background,
    alignItems: 'center',
  },
  linkPressed: {
    opacity: 0.8,
  },
  modalLinkButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalLinkButtonAltText: {
    color: MedicalTheme.colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  modalCloseButton: {
    alignSelf: 'center',
    paddingVertical: 11,
    paddingHorizontal: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    backgroundColor: MedicalTheme.colors.background,
  },
  modalCloseText: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
