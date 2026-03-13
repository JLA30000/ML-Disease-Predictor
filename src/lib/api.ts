import { Platform } from 'react-native';
import { fallbackSymptoms } from './fallbackSymptoms';

const API_BASE_URL_OVERRIDE: string | undefined =
  'https://multiclass-disease-classification-using.onrender.com';
const DEFAULT_API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
export const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ||
  API_BASE_URL_OVERRIDE ||
  DEFAULT_API_BASE_URL
).replace(/\/+$/, '');

export type PredictionEntry = {
  disease: string;
  prob: number;
};

export type ModelPrediction = {
  model_key: string;
  model_type: string;
  num_classes: number;
  top1: PredictionEntry;
  top3: PredictionEntry[];
  top5: PredictionEntry[];
};

export type PredictSymptomsResponse = {
  predictions: ModelPrediction[];
};

type SymptomsResponse = {
  symptoms: string[];
};

function normalizeSymptomsPayload(data: unknown): string[] {
  if (Array.isArray(data)) {
    return data.map(String);
  }
  if (data && typeof data === 'object' && Array.isArray((data as SymptomsResponse).symptoms)) {
    return (data as SymptomsResponse).symptoms.map(String);
  }
  throw new Error(`Invalid symptoms response: ${JSON.stringify(data).slice(0, 300)}`);
}

async function assertOk(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }
  let bodyText = '';
  try {
    bodyText = await response.text();
  } catch {
    bodyText = '';
  }
  const suffix = bodyText ? `: ${bodyText}` : '';
  throw new Error(`Request failed with status ${response.status}${suffix}`);
}

function toPredictionEntry(entry: unknown): PredictionEntry {
  if (!entry || typeof entry !== 'object') {
    throw new Error('Invalid prediction entry');
  }
  const candidate = entry as { disease?: unknown; prob?: unknown };
  if (typeof candidate.disease !== 'string' || typeof candidate.prob !== 'number') {
    throw new Error('Invalid prediction entry');
  }
  return { disease: candidate.disease, prob: candidate.prob };
}

function toPredictionList(value: unknown): PredictionEntry[] {
  if (!Array.isArray(value)) {
    throw new Error('Invalid prediction list');
  }
  return value.map(toPredictionEntry);
}

function toModelPrediction(item: unknown): ModelPrediction {
  if (!item || typeof item !== 'object') {
    throw new Error('Invalid prediction payload');
  }
  const candidate = item as {
    model_key?: unknown;
    model_type?: unknown;
    num_classes?: unknown;
    top1?: unknown;
    top3?: unknown;
    top5?: unknown;
  };
  if (typeof candidate.model_key !== 'string') {
    throw new Error('Invalid prediction payload');
  }
  if (typeof candidate.model_type !== 'string' || !candidate.model_type.trim()) {
    throw new Error('Invalid prediction payload');
  }
  if (typeof candidate.num_classes !== 'number') {
    throw new Error('Invalid prediction payload');
  }
  return {
    model_key: candidate.model_key,
    model_type: candidate.model_type,
    num_classes: candidate.num_classes,
    top1: toPredictionEntry(candidate.top1),
    top3: toPredictionList(candidate.top3),
    top5: toPredictionList(candidate.top5),
  };
}

export async function fetchHealth(): Promise<void> {
  const response = await fetch(`${BASE_URL}/health`);
  await assertOk(response);
}

export async function fetchSymptoms(): Promise<string[]> {
  try {
    const response = await fetch(`${BASE_URL}/symptoms`);
    await assertOk(response);
    const raw = await response.text();
    return normalizeSymptomsPayload(JSON.parse(raw));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown symptoms fetch error';
    console.warn(`Falling back to bundled symptom list because /symptoms failed: ${message}`);
    return fallbackSymptoms;
  }
}

export async function predictSymptoms(symptoms: string[]): Promise<PredictSymptomsResponse> {
  const response = await fetch(`${BASE_URL}/predict_symptoms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ symptoms, strict: true, temperature: 1.0 }),
  });
  await assertOk(response);
  let data: { predictions?: unknown };
  try {
    const raw = await response.text();
    data = JSON.parse(raw) as { predictions?: unknown };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown JSON parse error';
    throw new Error(`Invalid prediction response: ${message}`);
  }
  if (!data.predictions || !Array.isArray(data.predictions)) {
    throw new Error(`Invalid prediction response: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return { predictions: data.predictions.map(toModelPrediction) };
}
