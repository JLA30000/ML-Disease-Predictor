import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { MedicalTheme } from '../constants/medicalTheme';
import DisclaimerFooter from '../components/DisclaimerFooter';
import { fetchSymptoms, predictSymptoms } from '../lib/api';
import { RootStackParamList } from '../types/navigation';

export default function SymptomsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Symptoms'>>();
  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);

  const loadSymptoms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const symptoms = await fetchSymptoms();
      setAllSymptoms(symptoms);
    } catch (err) {
      setError('Unable to load symptoms. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSymptoms();
  }, [loadSymptoms]);

  const filteredSymptoms = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return allSymptoms;
    }
    return allSymptoms.filter((symptom) => symptom.toLowerCase().includes(query));
  }, [allSymptoms, searchText]);

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

  const handlePredict = async () => {
    if (selected.size === 0 || predicting) {
      return;
    }
    setPredicting(true);
    setPredictError(null);
    try {
      const response = await predictSymptoms(Array.from(selected));
      navigation.navigate('Results', {
        mode: 'multi',
        predictions: response.predictions,
        selectedSymptoms: Array.from(selected),
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

  return (
    <View style={styles.root}>
      <View style={styles.contentWrap}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Select Symptoms</Text>
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>{selected.size} selected</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Choose all symptoms that apply.</Text>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search symptoms..."
            placeholderTextColor={MedicalTheme.colors.muted}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        {/* Symptom list */}
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
                <Text style={styles.stateText}>No symptoms match your search.</Text>
              </View>
            }
          />
        )}

        {predictError ? <Text style={styles.errorText}>{predictError}</Text> : null}

        <Pressable
          style={[styles.predictButton, (selected.size === 0 || predicting) && styles.buttonDisabled]}
          onPress={handlePredict}
          disabled={selected.size === 0 || predicting}
        >
          <Text style={styles.predictText}>
            {predicting ? 'Running Analysis...' : 'Generate Predictions'}
          </Text>
        </Pressable>
      </View>
      <DisclaimerFooter style={styles.footer} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: MedicalTheme.colors.background,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: MedicalTheme.spacing.lg,
    paddingTop: MedicalTheme.spacing.md,
  },
  header: {
    marginBottom: MedicalTheme.spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
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
    fontSize: 11,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: MedicalTheme.colors.textSecondary,
    lineHeight: 19,
  },
  searchWrap: {
    backgroundColor: MedicalTheme.colors.surface,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    borderRadius: MedicalTheme.radius.md,
    paddingHorizontal: MedicalTheme.spacing.md,
    marginBottom: MedicalTheme.spacing.sm,
  },
  searchInput: {
    paddingVertical: 10,
    fontSize: 14,
    color: MedicalTheme.colors.text,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: MedicalTheme.spacing.sm,
    flexGrow: 1,
    minWidth: '100%',
  },
  symptomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
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
    marginBottom: MedicalTheme.spacing.xs,
  },
  retryButton: {
    marginTop: MedicalTheme.spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: 6,
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
  predictButton: {
    marginTop: MedicalTheme.spacing.sm,
    marginBottom: MedicalTheme.spacing.sm,
    backgroundColor: MedicalTheme.colors.primary,
    paddingVertical: 14,
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
  footer: {
    paddingHorizontal: MedicalTheme.spacing.lg,
    paddingBottom: MedicalTheme.spacing.lg,
  },
});
