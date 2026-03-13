import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';

import { MedicalTheme } from '../constants/medicalTheme';
import type { TabParamList } from '../types/navigation';

type TabKey = keyof TabParamList;

type AppBottomNavProps = {
  activeTab?: TabKey;
};

const NAV_ITEMS: {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'Home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'Predict', label: 'Predict', icon: 'pulse-outline', activeIcon: 'pulse' },
  { key: 'History', label: 'History', icon: 'time-outline', activeIcon: 'time' },
  { key: 'DiseaseLibrary', label: 'Library', icon: 'library-outline', activeIcon: 'library' },
  { key: 'More', label: 'More', icon: 'ellipsis-horizontal', activeIcon: 'ellipsis-horizontal' },
];

export default function AppBottomNav({ activeTab }: AppBottomNavProps) {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === activeTab;

          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.item,
                isActive && styles.itemActive,
                pressed && styles.itemPressed,
              ]}
              onPress={() =>
                navigation.dispatch(
                  CommonActions.navigate({
                    name: 'MainTabs',
                    params: { screen: item.key },
                  }),
                )
              }
            >
              {isActive && <View style={styles.activeDot} />}
              <Ionicons
                name={isActive ? item.activeIcon : item.icon}
                size={20}
                color={isActive ? MedicalTheme.colors.primary : MedicalTheme.colors.muted}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: MedicalTheme.spacing.lg,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: MedicalTheme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: MedicalTheme.colors.border,
  },
  bar: {
    flexDirection: 'row',
    gap: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 3,
    borderRadius: MedicalTheme.radius.md,
  },
  itemActive: {
    backgroundColor: MedicalTheme.colors.primaryLight,
  },
  itemPressed: {
    opacity: 0.8,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: MedicalTheme.colors.primary,
    position: 'absolute',
    top: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: MedicalTheme.colors.muted,
  },
  labelActive: {
    color: MedicalTheme.colors.primary,
    fontWeight: '700',
  },
});
