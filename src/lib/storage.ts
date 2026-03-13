import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ModelPrediction } from './api';

const STORAGE_KEY = 'hasAcceptedDisclaimer';
const FEEDBACK_KEY = 'feedbackSubmissions';
const HISTORY_KEY = 'predictionHistory';
const HISTORY_MAX = 50;

export type PredictionSession = {
  id: string;
  createdAt: string; // ISO string
  selectedSymptoms: string[];
  predictions: ModelPrediction[];
};

export type FeedbackSubmission = {
  submittedByProvider: 'email' | 'guest';
  submittedByEmail?: string;
  role: 'Researcher' | 'User';
  symptoms: string[];
  diagnosis: string;
  notes?: string;
  createdAt: string;
};

export async function getHasAcceptedDisclaimer(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setHasAcceptedDisclaimer(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
  } catch {
    // Storage failures should not crash the app.
  }
}

export async function getFeedbackSubmissions(): Promise<FeedbackSubmission[]> {
  try {
    const raw = await AsyncStorage.getItem(FEEDBACK_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FeedbackSubmission[]) : [];
  } catch {
    return [];
  }
}

export async function addFeedbackSubmission(
  submission: Omit<FeedbackSubmission, 'createdAt'>
): Promise<void> {
  try {
    const existing = await getFeedbackSubmissions();
    const next: FeedbackSubmission = {
      ...submission,
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify([next, ...existing]));
  } catch {
    // Storage failures should not crash the app.
  }
}

// ─── Prediction History ────────────────────────────────────────────────────

export async function getPredictionHistory(): Promise<PredictionSession[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PredictionSession[]) : [];
  } catch {
    return [];
  }
}

export async function addPredictionSession(
  session: Omit<PredictionSession, 'id' | 'createdAt'>
): Promise<void> {
  try {
    const existing = await getPredictionHistory();
    const next: PredictionSession = {
      ...session,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
    };
    const trimmed = [next, ...existing].slice(0, HISTORY_MAX);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage failures should not crash the app.
  }
}

export async function deletePredictionSession(id: string): Promise<void> {
  try {
    const existing = await getPredictionHistory();
    const filtered = existing.filter((s) => s.id !== id);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch {
    // Storage failures should not crash the app.
  }
}

export async function clearPredictionHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch {
    // Storage failures should not crash the app.
  }
}
