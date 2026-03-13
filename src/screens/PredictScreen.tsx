import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { MedicalTheme } from '../constants/medicalTheme';
import DisclaimerFooter from '../components/DisclaimerFooter';
import ScreenHeader from '../components/ScreenHeader';
import { fetchSymptoms, predictSymptoms } from '../lib/api';
import {
  getPredictionModelRank,
  getThresholdModelWarning,
  matchesPredictionModelChoice,
  PREDICTION_MODEL_CHOICES,
  type PredictionModelChoice,
} from '../lib/predictionModels';
import { addPredictionSession } from '../lib/storage';
import { RootStackParamList } from '../types/navigation';

type CategoryKey =
  | 'all'
  | 'general'
  | 'respiratory'
  | 'digestive'
  | 'neuro'
  | 'skin'
  | 'muscle'
  | 'cardio'
  | 'urinary'
  | 'ent'
  | 'repro'
  | 'other';

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  all: 'All',
  general: 'General',
  respiratory: 'Respiratory',
  digestive: 'Digestive',
  neuro: 'Neuro',
  skin: 'Skin',
  muscle: 'Muscle & Joint',
  cardio: 'Cardio',
  urinary: 'Urinary',
  ent: 'ENT & Eyes',
  repro: 'Repro',
  other: 'Other',
};

const CATEGORY_MATCHERS: { key: CategoryKey; keywords: string[] }[] = [
  { key: 'general', keywords: ['fever', 'fatigue', 'chill', 'malaise', 'sweat', 'weight', 'weak'] },
  {
    key: 'respiratory',
    keywords: ['cough', 'breath', 'wheez', 'dyspnea', 'chest', 'sputum', 'asthma'],
  },
  {
    key: 'digestive',
    keywords: ['abdomen', 'abdominal', 'stomach', 'nausea', 'vomit', 'diarrhea', 'constipation'],
  },
  {
    key: 'neuro',
    keywords: ['headache', 'dizz', 'vertigo', 'seizure', 'confus', 'memory', 'numb', 'tingl'],
  },
  {
    key: 'skin',
    keywords: ['rash', 'skin', 'itch', 'lesion', 'acne', 'pimple', 'blister', 'bruise'],
  },
  {
    key: 'muscle',
    keywords: ['joint', 'muscle', 'ache', 'pain', 'stiff', 'cramp', 'back', 'neck', 'knee'],
  },
  { key: 'cardio', keywords: ['heart', 'palpit', 'blood pressure', 'chest pain'] },
  { key: 'urinary', keywords: ['urine', 'urinary', 'bladder', 'kidney', 'burning'] },
  { key: 'ent', keywords: ['ear', 'hearing', 'eye', 'vision', 'throat', 'sinus', 'nose', 'nasal'] },
  {
    key: 'repro',
    keywords: ['menstrual', 'period', 'pregnan', 'vaginal', 'penis', 'testicle', 'erection'],
  },
];

type ModelChoice = PredictionModelChoice;

const MODEL_CHOICES = PREDICTION_MODEL_CHOICES.filter(
  (choice) => choice.key !== 'ablation_study',
);

function resolveCategory(symptom: string): CategoryKey {
  const lower = symptom.toLowerCase();
  for (const matcher of CATEGORY_MATCHERS) {
    if (matcher.keywords.some((keyword) => lower.includes(keyword))) {
      return matcher.key;
    }
  }
  return 'other';
}

export default function PredictScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Predict'>>();
  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [selectedModel, setSelectedModel] = useState<ModelChoice | null>(null);
  const [isModelSheetOpen, setIsModelSheetOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadSymptoms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const symptoms = await fetchSymptoms();
      setAllSymptoms(symptoms);
    } catch {
      setError('Unable to load symptoms. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSymptoms();
  }, [loadSymptoms]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 360,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const categoryMap = useMemo(() => {
    const counts: Record<CategoryKey, number> = {
      all: allSymptoms.length,
      general: 0,
      respiratory: 0,
      digestive: 0,
      neuro: 0,
      skin: 0,
      muscle: 0,
      cardio: 0,
      urinary: 0,
      ent: 0,
      repro: 0,
      other: 0,
    };
    for (const symptom of allSymptoms) {
      counts[resolveCategory(symptom)] += 1;
    }
    return counts;
  }, [allSymptoms]);

  const filteredSymptoms = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return allSymptoms.filter((symptom) => {
      if (activeCategory !== 'all' && resolveCategory(symptom) !== activeCategory) {
        return false;
      }
      if (!query) {
        return true;
      }
      return symptom.toLowerCase().includes(query);
    });
  }, [allSymptoms, searchText, activeCategory]);

  const toggleSymptom = (symptom: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(symptom)) {
        next.delete(symptom);
      } else {
        next.add(symptom);
      }
      return next;
    });
  };

  const handlePredict = async (choice?: ModelChoice) => {
    if (selected.size === 0 || predicting) {
      return;
    }
    const modelChoice = choice ?? selectedModel;
    if (!modelChoice) {
      setPredictError('Please choose a model option before predicting.');
      return;
    }
    setPredicting(true);
    setPredictError(null);
    try {
      const response = await predictSymptoms(Array.from(selected));
      const predictions =
        modelChoice === 'all'
          ? [...response.predictions].sort(
              (a, b) => getPredictionModelRank(a.model_key) - getPredictionModelRank(b.model_key),
            )
          : response.predictions
              .filter((item) => matchesPredictionModelChoice(item.model_key, modelChoice))
              .sort(
                (a, b) =>
                  getPredictionModelRank(a.model_key) - getPredictionModelRank(b.model_key),
              );
      const symptomList = Array.from(selected);
      addPredictionSession({ selectedSymptoms: symptomList, predictions });
      navigation.navigate('Results', {
        mode: 'multi',
        predictions,
        selectedSymptoms: symptomList,
      });
    } catch (err) {
      console.log('Prediction failed:', err);
      if (err instanceof Error && err.message) {
        setPredictError(err.message);
      } else {
        setPredictError('Prediction failed. Please try again in a moment.');
      }
    } finally {
      setPredicting(false);
    }
  };

  const categoryOrder: CategoryKey[] = [
    'all',
    'general',
    'respiratory',
    'digestive',
    'neuro',
    'skin',
    'muscle',
    'cardio',
    'urinary',
    'ent',
    'repro',
    'other',
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScreenHeader title="Predict" />
      <View style={styles.contentWrap}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.title}>Select Symptoms</Text>
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>{selected.size} selected</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Choose from 377 symptom indicators. Filter by category, search
              within it, then select all symptoms that apply to the patient presentation.
            </Text>
          </View>

          <View style={styles.searchPanel}>
            <View style={styles.searchInputRow}>
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search symptoms..."
                placeholderTextColor={MedicalTheme.colors.muted}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {selected.size > 0 && (
                <Pressable style={styles.clearButton} onPress={() => setSelected(new Set())}>
                  <Text style={styles.clearButtonText}>Clear all</Text>
                </Pressable>
              )}
            </View>
          </View>

          <FlatList
            data={categoryOrder}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            alwaysBounceHorizontal={false}
            alwaysBounceVertical={false}
            overScrollMode="never"
            style={styles.categoryList}
            contentContainerStyle={styles.categoryContent}
            ItemSeparatorComponent={() => <View style={styles.categorySeparator} />}
            renderItem={({ item }) => {
              const isActive = item === activeCategory;
              return (
                <Pressable
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                  onPress={() => setActiveCategory(item)}
                >
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                    {CATEGORY_LABELS[item]}
                    {categoryMap[item] ? ` | ${categoryMap[item]}` : ''}
                  </Text>
                </Pressable>
              );
            }}
          />

          {loading ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateText}>Loading symptom library...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={loadSymptoms}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={filteredSymptoms}
              keyExtractor={(item) => item}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              bounces={false}
              alwaysBounceVertical={false}
              alwaysBounceHorizontal={false}
              overScrollMode="never"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selected.has(item);
                return (
                  <Pressable
                    style={[styles.symptomRow, isSelected && styles.symptomRowSelected]}
                    onPress={() => toggleSymptom(item)}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <View style={styles.checkboxInner} />}
                    </View>
                    <Text style={[styles.symptomText, isSelected && styles.symptomTextSelected]}>
                      {item}
                    </Text>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={styles.stateBox}>
                  <Text style={styles.stateText}>No symptoms match this filter.</Text>
                </View>
              }
            />
          )}

          <View style={styles.actionBar}>
            {predictError ? <Text style={styles.errorText}>{predictError}</Text> : null}
            <Pressable
              style={[
                styles.predictButton,
                (selected.size === 0 || predicting) && styles.buttonDisabled,
              ]}
              onPress={() => setIsModelSheetOpen(true)}
              disabled={selected.size === 0 || predicting}
            >
              <Text style={styles.predictText}>
                {predicting ? 'Running Analysis...' : 'Generate Predictions'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        <DisclaimerFooter style={styles.disclaimerFooter} />
      </View>

      <Modal
        visible={isModelSheetOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModelSheetOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsModelSheetOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => undefined}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select Prediction Model</Text>
            <Text style={styles.sheetSubtitle}>Choose which AI model to run predictions on.</Text>
            <View style={styles.sheetDivider} />
            {MODEL_CHOICES.map((choice, index) => {
              const warning = getThresholdModelWarning(choice.key);
              return (
                <View
                  key={choice.key}
                  style={[
                    styles.sheetOptionGroup,
                    index === MODEL_CHOICES.length - 1 && styles.sheetOptionGroupLast,
                  ]}
                >
                  <Pressable
                    style={({ pressed }) => [styles.sheetOption, pressed && styles.sheetOptionPressed]}
                    onPress={async () => {
                      setSelectedModel(choice.key);
                      setIsModelSheetOpen(false);
                      await handlePredict(choice.key);
                    }}
                  >
                    <View style={styles.sheetOptionContent}>
                      <Text style={styles.sheetOptionLabel}>{choice.label}</Text>
                      <Text style={styles.sheetOptionDesc}>{choice.description}</Text>
                    </View>
                    <Text style={styles.sheetOptionArrow}>{'>'}</Text>
                  </Pressable>
                  {warning ? (
                    <View style={styles.sheetWarningCard}>
                      <View style={styles.sheetWarningIconWrap}>
                        <Text style={styles.sheetWarningIcon}>!</Text>
                      </View>
                      <View style={styles.sheetWarningBody}>
                        <Text style={styles.sheetWarningTitle}>{warning.title}</Text>
                        <Text style={styles.sheetWarningText}>{warning.message}</Text>
                        <Pressable
                          style={({ pressed }) => [
                            styles.sheetWarningLink,
                            pressed && styles.sheetWarningLinkPressed,
                          ]}
                          onPress={() => {
                            setIsModelSheetOpen(false);
                            navigation.navigate('ModelsInfo');
                          }}
                        >
                          <Text style={styles.sheetWarningLinkText}>Learn more</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })}
            <Pressable
              style={({ pressed }) => [styles.sheetCancel, pressed && styles.sheetCancelPressed]}
              onPress={() => setIsModelSheetOpen(false)}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    paddingHorizontal: MedicalTheme.spacing.lg,
    paddingTop: MedicalTheme.spacing.md,
    gap: 8,
  },
  header: {
    marginBottom: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
  },
  selectedBadge: {
    backgroundColor: MedicalTheme.colors.primaryLight,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.primary + '30',
  },
  selectedBadgeText: {
    color: MedicalTheme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: MedicalTheme.colors.textSecondary,
    lineHeight: 19,
  },
  searchPanel: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.lg,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    paddingHorizontal: MedicalTheme.spacing.md,
    paddingVertical: 4,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: MedicalTheme.colors.text,
    fontSize: 15,
    paddingVertical: 10,
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.alertRed + '35',
    backgroundColor: MedicalTheme.colors.alertRedBg,
  },
  clearButtonText: {
    color: MedicalTheme.colors.alertRed,
    fontWeight: '700',
    fontSize: 12,
  },
  categoryList: {
    flexGrow: 0,
    marginBottom: 2,
  },
  categoryContent: {
    paddingVertical: 2,
  },
  categorySeparator: {
    width: 6,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    backgroundColor: MedicalTheme.colors.surface,
  },
  categoryChipActive: {
    backgroundColor: MedicalTheme.colors.primary,
    borderColor: MedicalTheme.colors.primary,
  },
  categoryText: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 2,
    paddingBottom: 4,
    flexGrow: 1,
    minWidth: '100%',
  },
  symptomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: MedicalTheme.radius.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    backgroundColor: MedicalTheme.colors.surface,
    marginBottom: 6,
  },
  symptomRowSelected: {
    borderColor: MedicalTheme.colors.primary + '50',
    backgroundColor: MedicalTheme.colors.primaryLight,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: MedicalTheme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    borderColor: MedicalTheme.colors.primary,
    backgroundColor: MedicalTheme.colors.primary,
  },
  checkboxInner: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  symptomText: {
    flex: 1,
    color: MedicalTheme.colors.text,
    fontSize: 14,
  },
  symptomTextSelected: {
    color: MedicalTheme.colors.text,
    fontWeight: '500',
  },
  stateBox: {
    padding: MedicalTheme.spacing.md,
    borderRadius: MedicalTheme.radius.md,
    backgroundColor: MedicalTheme.colors.surface,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    alignItems: 'center',
  },
  stateText: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 14,
  },
  errorText: {
    color: MedicalTheme.colors.alertRed,
    fontSize: 13,
    marginBottom: 8,
  },
  retryButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: MedicalTheme.colors.greenLight,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.green + '30',
  },
  retryText: {
    color: MedicalTheme.colors.green,
    fontWeight: '600',
    fontSize: 13,
  },
  actionBar: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  predictButton: {
    backgroundColor: MedicalTheme.colors.primary,
    paddingVertical: 15,
    borderRadius: MedicalTheme.radius.lg,
    alignItems: 'center',
    ...MedicalTheme.shadow.md,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  predictText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  disclaimerFooter: {
    paddingHorizontal: MedicalTheme.spacing.lg,
    paddingBottom: MedicalTheme.spacing.lg,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: MedicalTheme.colors.surface,
    paddingHorizontal: MedicalTheme.spacing.lg,
    paddingBottom: MedicalTheme.spacing.xl,
    paddingTop: MedicalTheme.spacing.md,
    borderTopLeftRadius: MedicalTheme.radius.xxl,
    borderTopRightRadius: MedicalTheme.radius.xxl,
    ...MedicalTheme.shadow.lg,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: MedicalTheme.colors.borderStrong,
    alignSelf: 'center',
    marginBottom: MedicalTheme.spacing.md,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    marginBottom: 4,
  },
  sheetSubtitle: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 13,
    marginBottom: MedicalTheme.spacing.md,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: MedicalTheme.colors.border,
    marginBottom: MedicalTheme.spacing.sm,
  },
  sheetOptionGroup: {
    borderBottomWidth: 1,
    borderBottomColor: MedicalTheme.colors.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  sheetOptionGroupLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  sheetOption: {
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetOptionPressed: {
    opacity: 0.7,
  },
  sheetOptionContent: {
    flex: 1,
  },
  sheetOptionLabel: {
    color: MedicalTheme.colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  sheetOptionDesc: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 12,
  },
  sheetOptionArrow: {
    color: MedicalTheme.colors.muted,
    fontSize: 22,
    fontWeight: '300',
    marginLeft: 10,
  },
  sheetWarningCard: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    borderRadius: MedicalTheme.radius.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.alertAmber + '35',
    backgroundColor: '#FFFBEB',
    padding: MedicalTheme.spacing.sm,
  },
  sheetWarningIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: MedicalTheme.colors.alertAmber,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  sheetWarningIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  sheetWarningBody: {
    flex: 1,
  },
  sheetWarningTitle: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },
  sheetWarningText: {
    color: '#92400E',
    fontSize: 12,
    lineHeight: 18,
  },
  sheetWarningLink: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#FDE68A',
  },
  sheetWarningLinkPressed: {
    opacity: 0.8,
  },
  sheetWarningLinkText: {
    color: '#78350F',
    fontSize: 12,
    fontWeight: '700',
  },
  sheetCancel: {
    marginTop: MedicalTheme.spacing.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: MedicalTheme.radius.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    backgroundColor: MedicalTheme.colors.surfaceHigh,
  },
  sheetCancelPressed: {
    opacity: 0.8,
  },
  sheetCancelText: {
    color: MedicalTheme.colors.textSecondary,
    fontWeight: '700',
    fontSize: 15,
  },
});
