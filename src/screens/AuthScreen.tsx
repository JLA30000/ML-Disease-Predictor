import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import {
  AuthUser,
  requestPasswordReset,
  resendEmailConfirmation,
  signInWithEmail,
  signUpWithEmail,
  updatePassword,
} from '../lib/auth';
import { isSupabaseConfigured, supabaseRedirectUrl } from '../lib/supabase';
import { RootStackParamList } from '../types/navigation';

type Mode = 'signin' | 'signup';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function AuthScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Auth'>>();
  const { user, signIn, signInAsGuest, isPasswordRecovery, clearPasswordRecovery } = useAuth();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerificationHelp, setShowVerificationHelp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const authPanelTitle = isPasswordRecovery
    ? 'Set a new password'
    : mode === 'signin'
      ? 'Welcome back'
      : 'Create your ML Disease Predictor account';
  const authPanelSubtitle = isPasswordRecovery
    ? 'Your reset link is confirmed. Choose a password that you will use the next time you enter the workspace.'
    : mode === 'signin'
      ? 'Sign in to continue to saved runs, prediction history, and the full model workspace.'
      : 'Create an account to save your research flow, verify your email, and return to the same workspace later.';
  const brandHeroText = isPasswordRecovery
    ? 'Securely finish resetting your account'
    : mode === 'signin'
      ? 'Sign in to continue your research workflow'
      : 'Create an account for repeatable, saved analysis';
  const brandSupportText = isPasswordRecovery
    ? 'Once your password is updated, you will be returned to the app.'
    : 'You can use an account for saved history and verification, or continue as a guest from this screen.';

  useEffect(() => {
    if (!isPasswordRecovery) {
      return;
    }

    setMode('signin');
    setPassword('');
    setConfirmPassword('');
    setShowForgotPassword(false);
    setShowVerificationHelp(false);
    setError('');
    setInfo('Choose a new password for your account.');
  }, [isPasswordRecovery]);

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setError('');
    setInfo('');
    setShowForgotPassword(false);
    if (newMode === 'signup') {
      setShowVerificationHelp(false);
    }
  }

  async function completeAuth(user: AuthUser) {
    await signIn(user);
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  }

  async function handleEmailAuth() {
    setError('');
    setInfo('');

    if (isPasswordRecovery) {
      if (!password) {
        setError('Please enter your new password.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setLoading(true);
      try {
        await updatePassword(password);
        clearPasswordRecovery();
        setPassword('');
        setConfirmPassword('');
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } catch (err: any) {
        setError(err?.message || 'Unable to update password.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!isSupabaseConfigured) {
      setError(
        'Supabase auth is not configured yet. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
      );
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const result = await signUpWithEmail(name.trim(), email.trim(), password);
        setMode('signin');
        setShowVerificationHelp(true);
        setPassword('');
        setInfo(
          result.requiresEmailConfirmation
            ? `Verification email sent to ${result.email}. Open the link in that email, then return here to sign in.`
            : `Account created for ${result.email}.`
        );
        return;
      }

      const user = await signInWithEmail(email.trim(), password);
      await completeAuth(user);
    } catch (err: any) {
      const message = err?.message || 'Something went wrong.';
      if (message.toLowerCase().includes('verify your email')) {
        setShowVerificationHelp(true);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError('');
    setInfo('');

    if (!isSupabaseConfigured) {
      setError(
        'Supabase auth is not configured yet. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
      );
      return;
    }

    if (!email.trim()) {
      setError('Enter your email to send a password reset link.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setShowForgotPassword(true);
      setInfo(
        `Password reset email sent to ${email.trim().toLowerCase()}. Open the link from that email on this device to set a new password.`
      );
    } catch (err: any) {
      setError(err?.message || 'Unable to send password reset email.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGuestAccess() {
    if (loading) {
      return;
    }

    setError('');
    setInfo('');
    setLoading(true);

    try {
      await signInAsGuest();
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err: any) {
      setError(err?.message || 'Unable to continue as guest.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
    setError('');
    setInfo('');

    if (!isSupabaseConfigured) {
      setError(
        'Supabase auth is not configured yet. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
      );
      return;
    }

    if (!email.trim()) {
      setError('Enter your email to resend verification.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await resendEmailConfirmation(email.trim());
      setShowVerificationHelp(true);
      setInfo(`Verification email resent to ${email.trim().toLowerCase()}.`);
    } catch (err: any) {
      setError(err?.message || 'Unable to resend verification email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Image
        source={require('../pictures/landingPage.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={300}
      />

      <View style={styles.overlay} />
      <View style={styles.overlayBottom} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!isPasswordRecovery ? (
            <View style={styles.topActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.backToLandingButton,
                  pressed && styles.submitPressed,
                ]}
                onPress={() => navigation.navigate('Landing')}
                disabled={loading}
              >
                <Ionicons name="chevron-back" size={16} color="#E2E8F0" />
                <Text style={styles.backToLandingText}>Return to Landing Page</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.brandSection}>
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>ML Research Platform</Text>
            </View>
            <Text style={styles.brandTitle}>ML Disease Predictor</Text>
            <Text style={styles.brandHero}>{brandHeroText}</Text>
            <Text style={styles.brandSubtitle}>{brandSupportText}</Text>
          </View>

          <View style={styles.card}>
            {isPasswordRecovery ? (
              <View style={styles.recoveryHeader}>
                <Text style={styles.cardEyebrow}>Account recovery</Text>
                <Text style={styles.recoveryTitle}>{authPanelTitle}</Text>
                <Text style={styles.recoverySubtitle}>{authPanelSubtitle}</Text>
              </View>
            ) : (
              <View style={styles.cardHeader}>
                <View style={styles.toggleRow}>
                  <Pressable
                    style={[styles.toggleButton, mode === 'signin' && styles.toggleActive]}
                    onPress={() => switchMode('signin')}
                  >
                    <Text style={[styles.toggleText, mode === 'signin' && styles.toggleTextActive]}>
                      Sign In
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.toggleButton, mode === 'signup' && styles.toggleActive]}
                    onPress={() => switchMode('signup')}
                  >
                    <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>
                      Sign Up
                    </Text>
                  </Pressable>
                </View>
                <View style={styles.cardIntro}>
                  <Text style={styles.cardEyebrow}>
                    {mode === 'signin' ? 'Secure access' : 'New workspace account'}
                  </Text>
                  <Text style={styles.cardTitle}>{authPanelTitle}</Text>
                  <Text style={styles.cardSubtitle}>{authPanelSubtitle}</Text>
                </View>
              </View>
            )}

            <View style={styles.form}>
              {mode === 'signup' && !isPasswordRecovery && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Researcher name"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoComplete="name"
                  />
                </View>
              )}

              {!isPasswordRecovery ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="name@institution.edu"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {isPasswordRecovery ? 'New Password' : 'Password'}
                </Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder={
                      mode === 'signup' || isPasswordRecovery
                        ? 'Min. 6 characters'
                        : 'Enter password'
                    }
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete={isPasswordRecovery ? 'new-password' : 'password'}
                  />
                  <Pressable
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={8}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? 'Hide' : 'Show'}</Text>
                  </Pressable>
                </View>
              </View>

              {isPasswordRecovery ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Re-enter new password"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoComplete="new-password"
                    />
                    <Pressable
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      hitSlop={8}
                    >
                      <Text style={styles.eyeIcon}>
                        {showConfirmPassword ? 'Hide' : 'Show'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {!isSupabaseConfigured ? (
                <View style={styles.errorBox}>
                  <View style={styles.errorDot} />
                  <Text style={styles.errorText}>
                    Auth setup missing. Configure Supabase env vars before using sign in or sign up.
                    Guest access is still available.
                  </Text>
                </View>
              ) : null}

              {info ? (
                <View style={styles.infoBox}>
                  <View style={styles.infoDot} />
                  <Text style={styles.infoText}>{info}</Text>
                </View>
              ) : null}

              {error ? (
                <View style={styles.errorBox}>
                  <View style={styles.errorDot} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.submitPressed,
                  (loading || !isSupabaseConfigured) && styles.submitDisabled,
                ]}
                onPress={handleEmailAuth}
                disabled={loading || !isSupabaseConfigured}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>
                    {isPasswordRecovery
                      ? 'Update Password'
                      : mode === 'signin'
                        ? 'Sign In'
                        : 'Create Account'}
                  </Text>
                )}
              </Pressable>

              {!isPasswordRecovery ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.guestButton,
                    pressed && styles.submitPressed,
                    loading && styles.submitDisabled,
                  ]}
                  onPress={handleGuestAccess}
                  disabled={loading}
                >
                  <Text style={styles.guestButtonText}>Continue as Guest</Text>
                </Pressable>
              ) : null}

              {mode === 'signin' && !isPasswordRecovery ? (
                <>
                  {!showVerificationHelp ? (
                    <Pressable
                      style={styles.linkButton}
                      onPress={() => setShowVerificationHelp(true)}
                      disabled={loading}
                    >
                      <Text style={styles.linkText}>Need a new verification email?</Text>
                    </Pressable>
                  ) : null}

                  <Pressable
                    style={styles.linkButton}
                    onPress={() => setShowForgotPassword(!showForgotPassword)}
                    disabled={loading}
                  >
                    <Text style={styles.linkText}>
                      {showForgotPassword ? 'Hide password reset' : 'Forgot your password?'}
                    </Text>
                  </Pressable>
                </>
              ) : null}

              {showVerificationHelp ? (
                <View style={styles.confirmationPanel}>
                  <View style={styles.confirmationHeader}>
                    <Text style={styles.confirmationTitle}>Email Verification</Text>
                    {mode === 'signin' ? (
                      <Pressable
                        onPress={() => setShowVerificationHelp(false)}
                        disabled={loading}
                      >
                        <Text style={styles.confirmationToggle}>Hide</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <Text style={styles.confirmationBody}>
                    Supabase sends a real verification link to the address you signed up with.
                    The email should open this app using:
                  </Text>

                  <Text style={styles.redirectText}>{supabaseRedirectUrl}</Text>

                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.submitPressed,
                      (loading || !isSupabaseConfigured) && styles.submitDisabled,
                    ]}
                    onPress={handleResendConfirmation}
                    disabled={loading || !isSupabaseConfigured}
                  >
                    <Text style={styles.secondaryButtonText}>Resend Verification Email</Text>
                  </Pressable>
                </View>
              ) : null}

              {showForgotPassword && !isPasswordRecovery ? (
                <View style={styles.confirmationPanel}>
                  <View style={styles.confirmationHeader}>
                    <Text style={styles.confirmationTitle}>Password Reset</Text>
                    <Pressable
                      onPress={() => setShowForgotPassword(false)}
                      disabled={loading}
                    >
                      <Text style={styles.confirmationToggle}>Hide</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.confirmationBody}>
                    Supabase will email a secure reset link to the address above. The link should
                    open this app using:
                  </Text>

                  <Text style={styles.redirectText}>{supabaseRedirectUrl}</Text>

                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.submitPressed,
                      (loading || !isSupabaseConfigured) && styles.submitDisabled,
                    ]}
                    onPress={handleForgotPassword}
                    disabled={loading || !isSupabaseConfigured}
                  >
                    <Text style={styles.secondaryButtonText}>Send Password Reset Email</Text>
                  </Pressable>
                </View>
              ) : null}

              {isPasswordRecovery ? (
                <Pressable
                  style={styles.linkButton}
                  onPress={() => {
                    clearPasswordRecovery();
                    setPassword('');
                    setConfirmPassword('');
                    setInfo('');
                    setError('');
                    if (user) {
                      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
                    }
                  }}
                  disabled={loading}
                >
                  <Text style={styles.linkText}>Cancel reset</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.footerDisclaimer}>
            <View style={styles.footerDot} />
            <Text style={styles.footerText}>
              This platform is for research and education only. It is not intended for clinical use or as a substitute for professional medical advice.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  flex: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  overlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    backgroundColor: 'rgba(15, 23, 42, 0.80)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  topActions: {
    marginBottom: 18,
    alignItems: 'flex-start',
  },
  backToLandingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
  },
  backToLandingText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 26,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    marginBottom: 14,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4F6BF6',
  },
  badgeText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 10,
    textAlign: 'center',
  },
  brandHero: {
    fontSize: 24,
    lineHeight: 30,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  brandSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(226,232,240,0.82)',
    letterSpacing: 0.1,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  cardHeader: {
    paddingTop: 18,
  },
  cardIntro: {
    paddingHorizontal: 18,
    paddingTop: 16,
    gap: 6,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93C5FD',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(226,232,240,0.72)',
  },
  recoveryHeader: {
    paddingHorizontal: 18,
    paddingTop: 20,
    gap: 6,
  },
  recoveryTitle: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  recoverySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(226,232,240,0.72)',
  },
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: 'rgba(79, 107, 246, 0.35)',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.62)',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  form: {
    padding: 18,
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 11,
    fontSize: 15,
    color: '#FFFFFF',
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 60,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F6BF6',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.14)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.28)',
  },
  infoDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#60A5FA',
    marginTop: 5,
  },
  infoText: {
    flex: 1,
    color: '#BFDBFE',
    fontSize: 13,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  errorDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginTop: 5,
  },
  errorText: {
    flex: 1,
    color: '#FCA5A5',
    fontSize: 13,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#4F6BF6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F6BF6',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
  },
  secondaryButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  guestButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
  },
  guestButtonText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  submitPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  linkButton: {
    alignSelf: 'center',
  },
  linkText: {
    color: '#93C5FD',
    fontSize: 13,
    fontWeight: '600',
  },
  confirmationPanel: {
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  confirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmationToggle: {
    color: '#93C5FD',
    fontSize: 13,
    fontWeight: '600',
  },
  confirmationBody: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    lineHeight: 19,
  },
  redirectText: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  footerDisclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 4,
  },
  footerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginTop: 4,
    flexShrink: 0,
  },
  footerText: {
    flex: 1,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    lineHeight: 16,
  },
});
