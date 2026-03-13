import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { MedicalTheme } from '../constants/medicalTheme';

type DisclaimerFooterProps = {
  style?: StyleProp<ViewStyle>;
};

export default function DisclaimerFooter({ style }: DisclaimerFooterProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.dotRow}>
        <View style={styles.dot} />
        <Text style={styles.text}>
          Research tool only — not for clinical use or a substitute for professional medical advice.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: MedicalTheme.colors.border,
    paddingTop: MedicalTheme.spacing.sm,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: MedicalTheme.colors.alertRed,
    marginTop: 6,
    flexShrink: 0,
  },
  text: {
    flex: 1,
    color: MedicalTheme.colors.muted,
    fontSize: 11,
    lineHeight: 17,
  },
});
