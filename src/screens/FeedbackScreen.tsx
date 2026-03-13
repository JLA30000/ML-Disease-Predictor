import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { MedicalTheme } from '../constants/medicalTheme';
import DisclaimerFooter from '../components/DisclaimerFooter';
import { useAuth } from '../contexts/AuthContext';
import { fetchSymptoms } from '../lib/api';
import { addFeedbackSubmission } from '../lib/storage';
import { RootStackParamList } from '../types/navigation';

const ROLE_OPTIONS = ['Researcher', 'User'] as const;
type Props = NativeStackScreenProps<RootStackParamList, 'Feedback'>;

export default function FeedbackScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]>('User');
  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);
  const [symptomSearch, setSymptomSearch] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set());
  const [addCustomSymptom, setAddCustomSymptom] = useState(false);
  const [customSymptom, setCustomSymptom] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingSymptoms, setLoadingSymptoms] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSymptoms = useCallback(async () => {
    setLoadingSymptoms(true);
    setLoadError(null);
    try {
      const symptoms = await fetchSymptoms();
      setAllSymptoms(symptoms);
    } catch {
      setLoadError('Unable to load symptoms. Please try again.');
    } finally {
      setLoadingSymptoms(false);
    }
  }, []);

  useEffect(() => {
    loadSymptoms();
  }, [loadSymptoms]);

  const filteredSymptoms = useMemo(() => {
    const query = symptomSearch.trim().toLowerCase();
    if (!query) {
      return allSymptoms;
    }
    return allSymptoms.filter((item) => item.toLowerCase().includes(query));
  }, [allSymptoms, symptomSearch]);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) => {
      const next = new Set(prev);
      if (next.has(symptom)) {
        next.delete(symptom);
      } else {
        next.add(symptom);
      }
      return next;
    });
  };

  const selectedCount = selectedSymptoms.size + (customSymptom.trim() ? 1 : 0);
  const canSubmit = Boolean(user) && selectedCount > 0 && diagnosis.trim().length > 0;

  const resetForm = useCallback(() => {
    setRole('User');
    setSymptomSearch('');
    setSelectedSymptoms(new Set());
    setAddCustomSymptom(false);
    setCustomSymptom('');
    setDiagnosis('');
    setNotes('');
  }, []);

  useEffect(() => {
    if (route.params?.reset) {
      resetForm();
      navigation.setParams({ reset: false });
    }
  }, [navigation, resetForm, route.params?.reset]);

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) {
      return;
    }

    if (!user) {
      return;
    }

    setIsSubmitting(true);
    const finalSymptoms = Array.from(selectedSymptoms);
    if (customSymptom.trim()) {
      finalSymptoms.push(customSymptom.trim());
    }
    await addFeedbackSubmission({
      submittedByProvider: user.provider,
      submittedByEmail: user.email ?? undefined,
      role,
      symptoms: finalSymptoms,
      diagnosis: diagnosis.trim(),
      notes: notes.trim() ? notes.trim() : undefined,
    });
    resetForm();
    setIsSubmitting(false);
    navigation.navigate('FeedbackThankYou');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.contentWrap}>
        <ScrollView
          contentContainerStyle={styles.content}
          bounces={false}
          alwaysBounceVertical={false}
          alwaysBounceHorizontal={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Submit Feedback</Text>
            <Text style={styles.subtitle}>
              Save symptom notes and a confirmed diagnosis for your own research records on this
              device.
            </Text>
            <Text style={styles.notice}>
              Feedback entries are stored locally. They are not automatically sent to a research
              team or added to model training.
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Submitting As</Text>
            <Text style={styles.submitterEmail}>
              {user?.provider === 'guest' ? 'Guest session' : user?.email ?? 'No account available'}
            </Text>
            <Text style={styles.helperText}>
              {user?.provider === 'guest'
                ? 'This submission will be tagged as coming from a guest session.'
                : 'This email label will stay attached to the saved feedback entry on this device.'}
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>I am a</Text>
            <View style={styles.roleRow}>
              {ROLE_OPTIONS.map((option) => {
                const isActive = role === option;
                return (
                  <Pressable
                    key={option}
                    style={[styles.roleChip, isActive && styles.roleChipActive]}
                    onPress={() => setRole(option)}
                  >
                    <Text style={[styles.roleText, isActive && styles.roleTextActive]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Symptoms</Text>
            <Text style={styles.helperText}>Select from the list. Selected: {selectedCount}</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search symptoms"
              placeholderTextColor={MedicalTheme.colors.muted}
              value={symptomSearch}
              onChangeText={setSymptomSearch}
            />
            {loadingSymptoms ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateText}>Loading symptoms...</Text>
              </View>
            ) : loadError ? (
              <View style={styles.stateBox}>
                <Text style={styles.errorText}>{loadError}</Text>
                <Pressable style={styles.retryButton} onPress={loadSymptoms}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : (
              <FlatList
                data={filteredSymptoms}
                keyExtractor={(item) => item}
                style={styles.symptomList}
                contentContainerStyle={styles.symptomListContent}
                bounces={false}
                alwaysBounceVertical={false}
                alwaysBounceHorizontal={false}
                overScrollMode="never"
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = selectedSymptoms.has(item);
                  return (
                    <Pressable
                      style={[styles.symptomRow, isSelected && styles.symptomRowSelected]}
                      onPress={() => toggleSymptom(item)}
                    >
                      <Text style={styles.symptomText}>{item}</Text>
                      <Text style={styles.symptomCheck}>{isSelected ? 'Selected' : 'Add'}</Text>
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
            <Pressable
              style={[styles.toggleCustom, addCustomSymptom && styles.toggleCustomActive]}
              onPress={() => setAddCustomSymptom((prev) => !prev)}
            >
              <Text style={[styles.toggleCustomText, addCustomSymptom && styles.toggleCustomTextActive]}>
                Symptom not found
              </Text>
            </Pressable>
            {addCustomSymptom ? (
              <TextInput
                style={styles.customInput}
                placeholder="Enter symptom name"
                placeholderTextColor={MedicalTheme.colors.muted}
                value={customSymptom}
                onChangeText={setCustomSymptom}
              />
            ) : null}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Confirmed Diagnosis</Text>
            <TextInput
              style={styles.singleInput}
              placeholder="Confirmed diagnosis"
              placeholderTextColor={MedicalTheme.colors.muted}
              value={diagnosis}
              onChangeText={setDiagnosis}
            />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.singleInput, styles.notesInput]}
              placeholder="Context, labs, timeline, or related notes"
              placeholderTextColor={MedicalTheme.colors.muted}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </View>

          <Pressable
            style={[styles.submitButton, !canSubmit && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            <Text style={styles.submitText}>
              {isSubmitting ? 'Saving...' : 'Save Feedback'}
            </Text>
          </Pressable>
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
    fontSize: 14,
    lineHeight: 20,
    color: MedicalTheme.colors.textSecondary,
  },
  notice: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: MedicalTheme.colors.green,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.lg,
    padding: MedicalTheme.spacing.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    marginBottom: MedicalTheme.spacing.md,
    ...MedicalTheme.shadow.sm,
  },
  sectionLabel: {
    fontSize: 12,
    color: MedicalTheme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    fontWeight: '700',
  },
  helperText: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  submitterEmail: {
    fontSize: 15,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    backgroundColor: MedicalTheme.colors.surface,
  },
  roleChipActive: {
    backgroundColor: MedicalTheme.colors.green,
    borderColor: MedicalTheme.colors.green,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: MedicalTheme.colors.text,
  },
  roleTextActive: {
    color: '#FFFFFF',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    borderRadius: MedicalTheme.radius.md,
    padding: 12,
    fontSize: 15,
    color: MedicalTheme.colors.text,
    backgroundColor: MedicalTheme.colors.surfaceHigh,
    marginBottom: 10,
  },
  symptomList: {
    maxHeight: 260,
  },
  symptomListContent: {
    paddingBottom: 8,
    minWidth: '100%',
  },
  symptomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: MedicalTheme.radius.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    backgroundColor: MedicalTheme.colors.surface,
    marginBottom: 8,
  },
  symptomRowSelected: {
    borderColor: MedicalTheme.colors.green,
    backgroundColor: MedicalTheme.colors.greenLight,
  },
  symptomText: {
    fontSize: 15,
    color: MedicalTheme.colors.text,
  },
  symptomCheck: {
    color: MedicalTheme.colors.green,
    fontWeight: '700',
    fontSize: 12,
  },
  toggleCustom: {
    marginTop: 4,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: MedicalTheme.radius.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    backgroundColor: MedicalTheme.colors.surface,
  },
  toggleCustomActive: {
    borderColor: MedicalTheme.colors.green,
  },
  toggleCustomText: {
    color: MedicalTheme.colors.muted,
    fontWeight: '600',
  },
  toggleCustomTextActive: {
    color: MedicalTheme.colors.green,
  },
  customInput: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    borderRadius: MedicalTheme.radius.md,
    padding: 12,
    fontSize: 15,
    color: MedicalTheme.colors.text,
    backgroundColor: MedicalTheme.colors.surfaceHigh,
  },
  singleInput: {
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    borderRadius: MedicalTheme.radius.md,
    padding: 12,
    minHeight: 52,
    fontSize: 15,
    color: MedicalTheme.colors.text,
    backgroundColor: MedicalTheme.colors.surfaceHigh,
  },
  notesInput: {
    minHeight: 110,
  },
  stateBox: {
    padding: 12,
    borderRadius: MedicalTheme.radius.md,
    backgroundColor: MedicalTheme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    marginBottom: 10,
  },
  stateText: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 13,
  },
  errorText: {
    color: MedicalTheme.colors.alertRed,
    fontSize: 13,
    marginBottom: 8,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: MedicalTheme.colors.greenLight,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.green + '30',
  },
  retryText: {
    color: MedicalTheme.colors.green,
    fontWeight: '600',
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: MedicalTheme.colors.green,
    paddingVertical: 14,
    borderRadius: MedicalTheme.radius.md,
    alignItems: 'center',
    ...MedicalTheme.shadow.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  contentWrap: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: MedicalTheme.spacing.lg,
    paddingBottom: MedicalTheme.spacing.lg,
  },
});
