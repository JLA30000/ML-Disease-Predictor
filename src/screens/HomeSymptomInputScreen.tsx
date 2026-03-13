import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { MedicalTheme } from '../constants/medicalTheme';
import { RootStackParamList } from '../types/navigation';
import DisclaimerFooter from '../components/DisclaimerFooter';

export default function HomeSymptomInputScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const [symptomText, setSymptomText] = useState('');

  const canContinue = symptomText.trim().length > 0;

  const handleContinue = () => {
    if (!canContinue) {
      return;
    }
    navigation.navigate('ModelSelect', { symptomText: symptomText.trim() });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Describe your symptoms</Text>
        <Text style={styles.subtitle}>
          Share what you are experiencing. Be as specific as you can.
        </Text>
        <TextInput
          style={styles.input}
          value={symptomText}
          onChangeText={setSymptomText}
          placeholder="e.g., Fever for 2 days, sore throat, fatigue"
          placeholderTextColor="rgba(199, 208, 219, 0.5)"
          multiline
          textAlignVertical="top"
        />
        <Pressable
          style={[styles.button, !canContinue && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
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
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: MedicalTheme.colors.muted,
    marginBottom: 16,
  },
  input: {
    minHeight: 160,
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: MedicalTheme.colors.text,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    marginBottom: 20,
  },
  button: {
    backgroundColor: MedicalTheme.colors.crimson,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: MedicalTheme.colors.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    marginTop: 'auto',
  },
});
