import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { MedicalTheme } from '../constants/medicalTheme';
import DisclaimerFooter from '../components/DisclaimerFooter';
import { ModelChoice, RootStackParamList } from '../types/navigation';

const MODEL_OPTIONS: Array<{ id: ModelChoice; title: string; description: string }> = [
  {
    id: 'common',
    title: 'Common conditions',
    description: 'Best for everyday symptoms and typical conditions.',
  },
  {
    id: 'uncommon',
    title: 'Uncommon conditions',
    description: 'Cast a wider net for less typical patterns.',
  },
  {
    id: 'rare',
    title: 'Rare conditions',
    description: 'Explore niche or rare presentations.',
  },
  {
    id: 'broad',
    title: 'Broad coverage',
    description: 'Balanced overview across all conditions.',
  },
];

type Props = NativeStackScreenProps<RootStackParamList, 'ModelSelect'>;

export default function ModelSelectScreen({ navigation, route }: Props) {
  const { symptomText } = route.params;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Choose a model focus</Text>
        <Text style={styles.subtitle}>Pick the analysis depth that fits your situation.</Text>
        <View style={styles.optionsWrapper}>
          {MODEL_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              style={styles.optionCard}
              onPress={() =>
                navigation.navigate('Results', {
                  mode: 'legacy',
                  symptomText,
                  modelChoice: option.id,
                })
              }
            >
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </Pressable>
          ))}
        </View>
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
  container: {
    flex: 1,
    padding: MedicalTheme.spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: MedicalTheme.colors.muted,
    marginBottom: MedicalTheme.spacing.lg,
  },
  optionsWrapper: {
    gap: MedicalTheme.spacing.sm,
  },
  optionCard: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.lg,
    padding: MedicalTheme.spacing.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MedicalTheme.colors.text,
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 14,
    color: MedicalTheme.colors.muted,
  },
  footer: {
    marginTop: 'auto',
  },
});
