import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { MedicalTheme } from '../constants/medicalTheme';
import DisclaimerFooter from '../components/DisclaimerFooter';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
  accent: string;
};

export default function MoreScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, signOut } = useAuth();

  async function performSignOut() {
    try {
      await signOut();
      navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
    } catch (err: any) {
      Alert.alert('Sign Out Failed', err?.message || 'Unable to sign out right now.');
    }
  }

  function handleSignOut() {
    if (Platform.OS === 'web') {
      void performSignOut();
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          void performSignOut();
        },
      },
    ]);
  }

  const menuItems: MenuItem[] = [
    {
      icon: 'analytics-outline',
      title: 'Model Performance',
      description: 'Review accuracy metrics, training data details, and per-model evaluation results.',
      accent: MedicalTheme.colors.primary,
      onPress: () => navigation.navigate('ModelsInfo'),
    },
    {
      icon: 'chatbox-ellipses-outline',
      title: 'Submit Feedback',
      description: 'Save case notes and feedback entries on this device for research tracking.',
      accent: MedicalTheme.colors.green,
      onPress: () => navigation.navigate('Feedback'),
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'About & Privacy',
      description: 'Methodology, data flow, interpretation guidance, and privacy details.',
      accent: MedicalTheme.colors.purple,
      onPress: () => navigation.navigate('AboutPrivacy'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScreenHeader title="More" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {user && (
          <View style={styles.accountCard}>
            <View style={styles.accountHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName} numberOfLines={1}>{user.name}</Text>
                <Text style={styles.accountEmail} numberOfLines={1}>
                  {user.email ?? 'Guest session'}
                </Text>
              </View>
            </View>
            <View style={styles.accountProviderRow}>
              <View style={styles.providerBadge}>
                <Text style={styles.providerText}>
                  {user.provider === 'guest' ? 'Guest Access' : 'Email Account'}
                </Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutPressed]}
              onPress={handleSignOut}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.mainSection}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlowLarge} />
            <View style={styles.heroGlowSmall} />
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Resource Hub</Text>
            </View>
            <Text style={styles.heroTitle}>Research tools and platform resources.</Text>
            <Text style={styles.heroSubtitle}>
              Access model evaluation data, save structured feedback notes, and review platform
              methodology and privacy details.
            </Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatValue}>6</Text>
                <Text style={styles.heroStatLabel}>ML Models</Text>
              </View>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatValue}>v1.0</Text>
                <Text style={styles.heroStatLabel}>Current Build</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            {menuItems.map((item, index) => (
              <Pressable
                key={item.title}
                style={({ pressed }) => [
                  styles.menuItem,
                  {
                    backgroundColor: item.accent + '08',
                  },
                  index < menuItems.length - 1 && styles.menuItemBorder,
                  pressed && styles.menuItemPressed,
                ]}
                onPress={item.onPress}
              >
                <View style={[styles.iconCircle, { backgroundColor: item.accent + '15' }]}>
                  <Ionicons name={item.icon} size={20} color={item.accent} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemDesc}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={MedicalTheme.colors.muted} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Clinical Disclaimer Card */}
        <View style={styles.disclaimerCard}>
          <View style={styles.disclaimerCardAccent} />
          <View style={styles.disclaimerCardBody}>
            <View style={styles.disclaimerCardHeader}>
              <Ionicons name="medical-outline" size={15} color={MedicalTheme.colors.creamText} />
              <Text style={styles.disclaimerCardLabel}>Medical Disclaimer</Text>
            </View>
            <Text style={styles.disclaimerCardText}>
              ML Disease Predictor is a research and educational tool. Its outputs should not be
              used for diagnosis, treatment, or triage decisions.
            </Text>
          </View>
        </View>

        <View style={styles.versionBlock}>
          <Text style={styles.versionText}>ML Disease Predictor v1.0</Text>
          <Text style={styles.versionSubtext}>Research & Education Build</Text>
        </View>
      </ScrollView>
      <DisclaimerFooter style={styles.footer} />
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
    paddingTop: MedicalTheme.spacing.md,
    paddingBottom: MedicalTheme.spacing.xl,
    flexGrow: 1,
    justifyContent: 'flex-start',
    gap: MedicalTheme.spacing.lg,
  },
  mainSection: {
    gap: MedicalTheme.spacing.md,
  },
  heroCard: {
    backgroundColor: MedicalTheme.colors.primaryDark,
    borderRadius: MedicalTheme.radius.xl,
    padding: MedicalTheme.spacing.lg,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.primaryDark,
    overflow: 'hidden',
    ...MedicalTheme.shadow.md,
  },
  heroGlowLarge: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -60,
    right: -30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroGlowSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -20,
    left: -10,
    backgroundColor: 'rgba(139, 92, 246, 0.20)',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: MedicalTheme.spacing.sm,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255, 255, 255, 0.82)',
  },
  heroStats: {
    flexDirection: 'row',
    gap: MedicalTheme.spacing.sm,
    marginTop: MedicalTheme.spacing.md,
  },
  heroStatCard: {
    flex: 1,
    borderRadius: MedicalTheme.radius.lg,
    padding: MedicalTheme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.72)',
  },
  card: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.xl,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.primary + '12',
    ...MedicalTheme.shadow.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: MedicalTheme.spacing.md,
    gap: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: MedicalTheme.colors.border,
  },
  menuItemPressed: {
    opacity: 0.9,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MedicalTheme.colors.text,
    marginBottom: 2,
  },
  menuItemDesc: {
    fontSize: 13,
    color: MedicalTheme.colors.textSecondary,
    lineHeight: 18,
  },
  // Account card
  accountCard: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.xl,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    padding: MedicalTheme.spacing.md,
    gap: MedicalTheme.spacing.md,
    ...MedicalTheme.shadow.md,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: MedicalTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: 13,
    color: MedicalTheme.colors.textSecondary,
  },
  accountProviderRow: {
    flexDirection: 'row',
  },
  providerBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: MedicalTheme.colors.primaryLight,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.primary + '25',
  },
  providerText: {
    fontSize: 11,
    fontWeight: '600',
    color: MedicalTheme.colors.primary,
    letterSpacing: 0.3,
  },
  signOutButton: {
    borderRadius: MedicalTheme.radius.md,
    borderWidth: 1.5,
    borderColor: MedicalTheme.colors.alertRed + '30',
    backgroundColor: MedicalTheme.colors.alertRedBg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutPressed: {
    opacity: 0.8,
  },
  signOutText: {
    color: MedicalTheme.colors.alertRed,
    fontSize: 14,
    fontWeight: '600',
  },

  // Clinical Disclaimer Card
  disclaimerCard: {
    backgroundColor: MedicalTheme.colors.cream,
    borderRadius: MedicalTheme.radius.lg,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.creamDark,
    flexDirection: 'row',
    overflow: 'hidden',
    ...MedicalTheme.shadow.sm,
  },
  disclaimerCardAccent: {
    width: 3,
    backgroundColor: MedicalTheme.colors.creamText,
  },
  disclaimerCardBody: {
    flex: 1,
    padding: MedicalTheme.spacing.md,
  },
  disclaimerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  disclaimerCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: MedicalTheme.colors.creamText,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  disclaimerCardText: {
    fontSize: 13,
    lineHeight: 19,
    color: MedicalTheme.colors.creamText,
  },

  versionBlock: {
    alignItems: 'center',
    gap: 4,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
    color: MedicalTheme.colors.primary,
  },
  versionSubtext: {
    fontSize: 12,
    color: MedicalTheme.colors.textSecondary,
  },
  footer: {
    paddingHorizontal: MedicalTheme.spacing.lg,
    paddingBottom: MedicalTheme.spacing.sm,
  },
});
