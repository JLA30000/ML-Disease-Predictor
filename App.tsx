import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import AppBottomNav from './src/components/AppBottomNav';
import ScreenHeader from './src/components/ScreenHeader';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { MedicalTheme } from './src/constants/medicalTheme';
import { getHasAcceptedDisclaimer } from './src/lib/storage';
import AboutPrivacyScreen from './src/screens/AboutPrivacyScreen';
import AuthScreen from './src/screens/AuthScreen';
import DiseaseLibraryScreen from './src/screens/DiseaseLibraryScreen';
import FeedbackScreen from './src/screens/FeedbackScreen';
import FeedbackThankYouScreen from './src/screens/FeedbackThankYouScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import HomeScreen from './src/screens/HomeScreen';
import LandingScreen from './src/screens/LandingScreen';
import ModelDetailScreen from './src/screens/ModelDetailScreen';
import ModelSelectScreen from './src/screens/ModelSelectScreen';
import ModelsInfoScreen from './src/screens/ModelsInfoScreen';
import MoreScreen from './src/screens/MoreScreen';
import OnboardingDisclaimerScreen from './src/screens/OnboardingDisclaimerScreen';
import PredictScreen from './src/screens/PredictScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import SymptomsScreen from './src/screens/SymptomsScreen';
import { RootStackParamList, TabParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function resolveActiveTab(routeName: keyof RootStackParamList): keyof TabParamList | undefined {
  if (routeName === 'Home' || routeName === 'Landing' || routeName === 'OnboardingDisclaimer') {
    return 'Home';
  }

  if (routeName === 'Predict' || routeName === 'Symptoms' || routeName === 'Results') {
    return 'Predict';
  }

  if (routeName === 'History') {
    return 'History';
  }

  if (routeName === 'DiseaseLibrary') {
    return 'DiseaseLibrary';
  }

  if (
    routeName === 'Feedback' ||
    routeName === 'FeedbackThankYou' ||
    routeName === 'ModelsInfo' ||
    routeName === 'ModelDetail' ||
    routeName === 'ModelSelect' ||
    routeName === 'AboutPrivacy'
  ) {
    return 'More';
  }

  return undefined;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: MedicalTheme.colors.primary,
        tabBarInactiveTintColor: MedicalTheme.colors.muted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: MedicalTheme.colors.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: 68,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Predict"
        component={PredictScreen}
        options={{
          tabBarLabel: 'Predict',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DiseaseLibrary"
        component={DiseaseLibraryScreen}
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function SplashScreen() {
  const splashFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(splashFade, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [splashFade]);

  return (
    <Animated.View style={[styles.splashContainer, { opacity: splashFade }]}>
      <View style={styles.splashAccent} />
      <View style={styles.splashContent}>
        <View style={styles.splashBadge}>
          <View style={styles.splashBadgeDot} />
          <Text style={styles.splashBadgeText}>ML Research Platform</Text>
        </View>
        <Text style={styles.splashTitle}>ML Disease Predictor</Text>
        <Text style={styles.splashSubtitle}>Disease Classification Research</Text>
        <View style={styles.splashDivider} />
        <View style={styles.splashLoadingRow}>
          <ActivityIndicator size="small" color={MedicalTheme.colors.primary} />
          <Text style={styles.splashLoadingText}>Initializing...</Text>
        </View>
      </View>
      <Text style={styles.splashVersion}>Research & Education Build</Text>
    </Animated.View>
  );
}

function AppNavigator() {
  const { user, isLoading, isPasswordRecovery } = useAuth();
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState<boolean | null>(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const accepted = await getHasAcceptedDisclaimer();
        if (isActive) {
          setHasAcceptedDisclaimer(accepted);
        }
      } catch {
        if (isActive) {
          setHasAcceptedDisclaimer(false);
        }
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, []);

  if (isLoading || hasAcceptedDisclaimer === null) {
    return <SplashScreen />;
  }

  const initialRouteName: keyof RootStackParamList = hasAcceptedDisclaimer
    ? isPasswordRecovery
      ? 'Auth'
      : 'Landing'
    : 'OnboardingDisclaimer';

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={isPasswordRecovery ? 'recovery' : user ? 'authenticated' : 'guest'}
        initialRouteName={initialRouteName}
        screenLayout={({ children, route }) => {
          if (
            route.name === 'MainTabs' ||
            route.name === 'OnboardingDisclaimer' ||
            route.name === 'Landing' ||
            route.name === 'Auth'
          ) {
            return children;
          }

          return (
            <View style={styles.screenLayout}>
              <View style={styles.screenContent}>{children}</View>
              <AppBottomNav activeTab={resolveActiveTab(route.name as keyof RootStackParamList)} />
            </View>
          );
        }}
        screenOptions={{
          headerTitleAlign: 'center',
          header: ({ options, route }) => (
            <ScreenHeader
              title={typeof options.title === 'string' ? options.title : route.name}
            />
          ),
        }}
      >
        <Stack.Screen
          name="OnboardingDisclaimer"
          component={OnboardingDisclaimerScreen}
          options={{ title: 'Disclaimer' }}
        />
        <Stack.Screen
          name="Landing"
          component={LandingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />

        {user ? (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ModelDetail"
              component={ModelDetailScreen}
              options={{ title: 'Model Details' }}
            />
            <Stack.Screen
              name="ModelSelect"
              component={ModelSelectScreen}
              options={{ title: 'Select Model' }}
            />
            <Stack.Screen
              name="ModelsInfo"
              component={ModelsInfoScreen}
              options={{ title: 'Model Library' }}
            />
            <Stack.Screen
              name="Feedback"
              component={FeedbackScreen}
              options={{ title: 'Feedback' }}
            />
            <Stack.Screen
              name="FeedbackThankYou"
              component={FeedbackThankYouScreen}
              options={{ title: 'Thank You' }}
            />
            <Stack.Screen
              name="Symptoms"
              component={SymptomsScreen}
              options={{ title: 'Symptom Entry' }}
            />
            <Stack.Screen
              name="Results"
              component={ResultsScreen}
              options={{ title: 'Prediction Results' }}
            />
            <Stack.Screen
              name="AboutPrivacy"
              component={AboutPrivacyScreen}
              options={{ title: 'About & Privacy' }}
            />
          </>
        ) : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screenLayout: {
    flex: 1,
    backgroundColor: MedicalTheme.colors.background,
  },
  screenContent: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: MedicalTheme.colors.background,
  },
  splashAccent: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: MedicalTheme.colors.primary,
    opacity: 0.06,
  },
  splashContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  splashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: MedicalTheme.colors.primaryLight,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.primary + '30',
    marginBottom: 28,
  },
  splashBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MedicalTheme.colors.primary,
  },
  splashBadgeText: {
    color: MedicalTheme.colors.primary,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  splashTitle: {
    fontSize: 38,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    letterSpacing: -0.8,
    marginBottom: 10,
    textAlign: 'center',
  },
  splashSubtitle: {
    fontSize: 16,
    color: MedicalTheme.colors.textSecondary,
    letterSpacing: 0.4,
    textAlign: 'center',
    lineHeight: 24,
  },
  splashDivider: {
    width: 40,
    height: 1,
    backgroundColor: MedicalTheme.colors.border,
    marginVertical: 32,
  },
  splashLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  splashLoadingText: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  splashVersion: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    color: MedicalTheme.colors.muted,
    fontSize: 11,
    letterSpacing: 0.8,
    opacity: 0.6,
  },
});
