import type { ModelPrediction } from '../lib/api';
import type { ModelKey } from '../lib/modelMetrics';

export type ModelChoice = 'common' | 'uncommon' | 'rare' | 'broad';

export type TabParamList = {
  Home: undefined;
  Predict: undefined;
  History: undefined;
  DiseaseLibrary: undefined;
  More: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  OnboardingDisclaimer: undefined;
  Landing: undefined;
  MainTabs: undefined;
  Home: undefined;
  Predict: undefined;
  Symptoms: undefined;
  ModelsInfo: undefined;
  DiseaseLibrary: undefined;
  Feedback: { reset?: boolean } | undefined;
  FeedbackThankYou: undefined;
  ModelDetail: { modelKey: ModelKey };
  ModelSelect: { symptomText: string };
  Results:
    | {
        mode: 'multi';
        predictions: ModelPrediction[];
        selectedSymptoms: string[];
      }
    | { mode: 'legacy'; symptomText: string; modelChoice: ModelChoice };
  AboutPrivacy: undefined;
  History: undefined;
};
