import React, { useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';

import { MedicalTheme } from '../constants/medicalTheme';
import { useAuth } from '../contexts/AuthContext';

type ScreenHeaderProps = {
  title: string;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

export default function ScreenHeader({ title }: ScreenHeaderProps) {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user, signOut } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  const hideBackButton = route.name === 'Home' || route.name === 'Landing';

  const getBackNavigation = () => {
    let current = navigation;
    while (current) {
      if (typeof current.canGoBack === 'function' && current.canGoBack()) {
        return current;
      }
      current = current.getParent?.();
    }
    return null;
  };

  const getRootNavigation = () => {
    let current = navigation;
    while (current?.getParent?.()) {
      current = current.getParent();
    }
    return current;
  };

  const handleBackPress = () => {
    const backNavigation = getBackNavigation();
    if (backNavigation) {
      backNavigation.goBack();
      return;
    }

    const rootNavigation = getRootNavigation();
    const routeName = route.name;

    if (routeName === 'OnboardingDisclaimer') {
      rootNavigation.dispatch(CommonActions.navigate({ name: 'Landing' }));
      return;
    }

    if (
      routeName === 'Home' ||
      routeName === 'Predict' ||
      routeName === 'History' ||
      routeName === 'DiseaseLibrary' ||
      routeName === 'More'
    ) {
      rootNavigation.dispatch(CommonActions.navigate({ name: 'Landing' }));
      return;
    }

    rootNavigation.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: { screen: 'Home' },
      }),
    );
  };

  const handleBrandPress = () =>
    getRootNavigation().dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: { screen: 'Home' },
      }),
    );

  const handleSignOut = () => {
    setMenuVisible(false);

    const performSignOut = async () => {
      try {
        await signOut();
        getRootNavigation().dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] }),
        );
      } catch (err: any) {
        Alert.alert('Sign Out Failed', err?.message || 'Unable to sign out right now.');
      }
    };

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
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Left: back button or brand icon */}
        {hideBackButton ? (
          <View style={styles.homeBadgeIcon}>
            <Ionicons name="pulse" size={14} color="#FFFFFF" />
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Back from ${title}`}
            style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
            onPress={handleBackPress}
          >
            <Ionicons name="chevron-back" size={18} color={MedicalTheme.colors.primary} />
          </Pressable>
        )}

        {/* Center: brand + title */}
        <Pressable
          style={({ pressed }) => [styles.brandGroup, pressed && styles.buttonPressed]}
          onPress={handleBrandPress}
        >
          <View style={styles.logoDot} />
          <Text style={styles.logoText} numberOfLines={1}>
            ML Disease Predictor
          </Text>
          <View style={styles.separator} />
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </Pressable>

        {/* Right: profile avatar */}
        {user ? (
          <Pressable
            style={({ pressed }) => [styles.avatar, pressed && styles.buttonPressed]}
            onPress={() => setMenuVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Profile menu"
          >
            <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
          </Pressable>
        ) : (
          <View style={styles.rightAccent}>
            <View style={styles.rightAccentDot} />
          </View>
        )}
      </View>

      {/* Profile dropdown modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuCard}>
            {/* User info */}
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatar}>
                <Text style={styles.menuAvatarText}>
                  {user ? getInitials(user.name) : '?'}
                </Text>
              </View>
              <View style={styles.menuUserInfo}>
                <Text style={styles.menuName} numberOfLines={1}>{user?.name}</Text>
                <Text style={styles.menuEmail} numberOfLines={1}>
                  {user?.email ?? 'Guest session'}
                </Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            {/* Sign out */}
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={18} color={MedicalTheme.colors.alertRed} />
              <Text style={styles.menuItemText}>Sign Out</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: MedicalTheme.colors.surface,
    paddingHorizontal: MedicalTheme.spacing.lg,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: MedicalTheme.colors.border,
    ...MedicalTheme.shadow.sm,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Back button — minimal circle
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MedicalTheme.colors.primaryLight,
  },

  homeBadgeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MedicalTheme.colors.primary,
  },

  // Brand — flat inline layout, no bordered box
  brandGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MedicalTheme.colors.primary,
  },
  logoText: {
    fontSize: 13,
    fontWeight: '700',
    color: MedicalTheme.colors.primary,
    letterSpacing: -0.1,
    marginLeft: 7,
    flexShrink: 1,
  },
  separator: {
    width: 1,
    height: 16,
    backgroundColor: MedicalTheme.colors.border,
    marginHorizontal: 12,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: MedicalTheme.colors.text,
    letterSpacing: 0.1,
  },

  // Profile avatar
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MedicalTheme.colors.primary,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Fallback (no user)
  rightAccent: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MedicalTheme.colors.greenLight,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.green + '20',
  },
  rightAccentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MedicalTheme.colors.green,
  },

  // Modal / dropdown
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 70,
    paddingRight: MedicalTheme.spacing.lg,
  },
  menuCard: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.xl,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    width: 260,
    ...MedicalTheme.shadow.lg,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  menuAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MedicalTheme.colors.primary,
  },
  menuAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  menuUserInfo: {
    flex: 1,
  },
  menuName: {
    fontSize: 15,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    marginBottom: 2,
  },
  menuEmail: {
    fontSize: 12,
    color: MedicalTheme.colors.textSecondary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: MedicalTheme.colors.border,
    marginHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
  },
  menuItemPressed: {
    backgroundColor: MedicalTheme.colors.alertRedBg,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: MedicalTheme.colors.alertRed,
  },
});
