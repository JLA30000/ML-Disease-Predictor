import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MedicalTheme } from '../constants/medicalTheme';
import DisclaimerFooter from '../components/DisclaimerFooter';
import ScreenHeader from '../components/ScreenHeader';
import severityMap from '../severity/severityMap';

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

const SEVERITY_FILTERS: { label: string; value: number | null; color?: string }[] = [
  { label: 'All', value: null },
  { label: 'Low', value: 1, color: '#16A34A' },
  { label: 'Moderate', value: 2, color: '#D97706' },
  { label: 'High', value: 3, color: '#DC2626' },
  { label: 'Critical', value: 4, color: '#7C3AED' },
];

type DiseaseEntry = {
  name: string;
  severity: SeverityMeta;
};

const ALL_DISEASES: DiseaseEntry[] = Object.entries(severityMap)
  .map(([name, level]) => ({
    name,
    severity: SEVERITY_META[level] ?? SEVERITY_META[2],
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export default function DiseaseLibraryScreen() {
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return ALL_DISEASES.filter((entry) => {
      if (severityFilter && entry.severity.level !== severityFilter) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return entry.name.includes(normalizedQuery);
    });
  }, [query, severityFilter]);

  const handleOpen = (url: string) => {
    Linking.openURL(url);
  };

  const renderItem = ({ item }: { item: DiseaseEntry }) => {
    const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(
      item.name.replace(/\s+/g, '_'),
    )}`;
    const mayoUrl = `https://www.mayoclinic.org/search/search-results?q=${encodeURIComponent(
      item.name,
    )}`;

    return (
      <View style={[styles.card, MedicalTheme.shadow.sm as any]}>
        <View style={[styles.cardAccent, { backgroundColor: item.severity.color }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <View
              style={[
                styles.severityBadge,
                {
                  backgroundColor: item.severity.bgColor,
                  borderColor: `${item.severity.color}40`,
                },
              ]}
            >
              <View style={[styles.severityDot, { backgroundColor: item.severity.color }]} />
              <Text style={[styles.severityBadgeText, { color: item.severity.textColor }]}>
                {item.severity.label}
              </Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>{item.severity.description}</Text>
          <View style={styles.linkRow}>
            <Pressable
              style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
              onPress={() => handleOpen(mayoUrl)}
            >
              <Text style={styles.linkButtonText}>Mayo Clinic</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.linkButtonAlt, pressed && styles.linkButtonPressed]}
              onPress={() => handleOpen(wikiUrl)}
            >
              <Text style={styles.linkButtonAltText}>Wikipedia</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenHeader title="Disease Library" />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.name}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        bounces={false}
        alwaysBounceVertical={false}
        alwaysBounceHorizontal={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Disease Library</Text>
            <Text style={styles.subtitle}>
              Browse all conditions in the ML Disease Predictor label library. Each entry includes
              an internal urgency reference and links to external medical references.
            </Text>

            <View style={styles.severityGuide}>
              <View style={styles.severityGuideAccent} />
              <View style={styles.severityGuideBody}>
                <View style={styles.severityGuideHeader}>
                  <Ionicons
                    name="medical-outline"
                    size={14}
                    color={MedicalTheme.colors.creamText}
                  />
                  <Text style={styles.severityGuideLabel}>Urgency Reference</Text>
                </View>
                <Text style={styles.severityGuideText}>
                  These labels are coarse internal reference tags used in the app interface. They
                  are not medical triage instructions. Use the filter chips below to browse by
                  label category.
                </Text>
              </View>
            </View>

            <View style={[styles.searchWrap, MedicalTheme.shadow.sm as any]}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search conditions..."
                placeholderTextColor={MedicalTheme.colors.muted}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>

            <View style={styles.filterRow}>
              {SEVERITY_FILTERS.map((filter) => {
                const isActive = severityFilter === filter.value;
                const activeColor = filter.color ?? MedicalTheme.colors.primary;
                return (
                  <Pressable
                    key={filter.label}
                    onPress={() => setSeverityFilter(filter.value)}
                    style={[
                      styles.filterChip,
                      isActive && {
                        backgroundColor: `${activeColor}12`,
                        borderColor: `${activeColor}40`,
                      },
                    ]}
                  >
                    {filter.color ? (
                      <View style={[styles.filterDot, { backgroundColor: filter.color }]} />
                    ) : null}
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && {
                          color: filter.color ?? MedicalTheme.colors.primary,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.countText}>
              {filtered.length} condition{filtered.length !== 1 ? 's' : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, MedicalTheme.shadow.sm as any]}>
            <Text style={styles.emptyText}>No conditions match that search.</Text>
          </View>
        }
      />
      <DisclaimerFooter style={styles.footer} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: MedicalTheme.colors.background,
  },
  listContent: {
    padding: MedicalTheme.spacing.lg,
    paddingBottom: MedicalTheme.spacing.xl,
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
    color: MedicalTheme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: MedicalTheme.spacing.md,
  },
  severityGuide: {
    backgroundColor: MedicalTheme.colors.cream,
    borderRadius: MedicalTheme.radius.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.creamDark,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: MedicalTheme.spacing.md,
  },
  severityGuideAccent: {
    width: 3,
    backgroundColor: MedicalTheme.colors.creamText,
  },
  severityGuideBody: {
    flex: 1,
    padding: MedicalTheme.spacing.sm,
  },
  severityGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  severityGuideLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: MedicalTheme.colors.creamText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  severityGuideText: {
    fontSize: 12,
    lineHeight: 18,
    color: MedicalTheme.colors.creamText,
  },
  searchWrap: {
    borderRadius: MedicalTheme.radius.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    backgroundColor: MedicalTheme.colors.surface,
    paddingHorizontal: MedicalTheme.spacing.md,
    marginBottom: MedicalTheme.spacing.sm,
  },
  searchInput: {
    height: 44,
    color: MedicalTheme.colors.text,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: MedicalTheme.spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    backgroundColor: MedicalTheme.colors.surface,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterChipText: {
    fontSize: 12,
    color: MedicalTheme.colors.textSecondary,
    fontWeight: '600',
  },
  countText: {
    fontSize: 11,
    color: MedicalTheme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  card: {
    borderRadius: MedicalTheme.radius.lg,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    marginBottom: 10,
    backgroundColor: MedicalTheme.colors.surface,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardAccent: {
    width: 3,
  },
  cardBody: {
    flex: 1,
    padding: MedicalTheme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    color: MedicalTheme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  severityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  severityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  cardSubtitle: {
    marginBottom: 10,
    color: MedicalTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 8,
  },
  linkButton: {
    backgroundColor: MedicalTheme.colors.green,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  linkButtonAlt: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    backgroundColor: MedicalTheme.colors.surfaceHigh,
  },
  linkButtonPressed: {
    opacity: 0.75,
  },
  linkButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  linkButtonAltText: {
    color: MedicalTheme.colors.text,
    fontWeight: '700',
    fontSize: 11,
  },
  emptyState: {
    padding: MedicalTheme.spacing.lg,
    borderRadius: MedicalTheme.radius.lg,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    backgroundColor: MedicalTheme.colors.surface,
    alignItems: 'center',
  },
  emptyText: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: MedicalTheme.spacing.lg,
    paddingBottom: MedicalTheme.spacing.lg,
  },
});
