export type PredictionModelChoice =
  | 'all'
  | 'class_weighted_baseline_classifier'
  | 'autoencoder_classifier_full'
  | 'logistic_regression'
  | 'ae_t100'
  | 'ae_t200'
  | 'ae_t300'
  | 'ablation_study';

type PredictionModelDescriptor = {
  choice: Exclude<PredictionModelChoice, 'all'>;
  label: string;
  description: string;
  badge: string;
  rank: number;
  aliases: string[];
};

const PREDICTION_MODEL_DESCRIPTORS: PredictionModelDescriptor[] = [
  {
    choice: 'logistic_regression',
    label: 'Logistic Regression',
    description: 'Simple linear model with the best performance on the current binary symptom dataset',
    badge: 'LOG REG',
    rank: 0,
    aliases: ['logistic_regression', 'logistic', 'log_reg', 'logreg', 'lr', 'lr_full'],
  },
  {
    choice: 'autoencoder_classifier_full',
    label: 'Autoencoder MLP Classifier',
    description: 'Latent-compression model with deeper semantic capacity but possible symptom information loss',
    badge: 'AE MLP',
    rank: 1,
    aliases: [
      'autoencoder_classifier_full',
      'autoencoder_full',
      'ae_classifier_full',
      'ae_clf_full',
      'ae_full',
      'full_autoencoder',
      'full_ae',
    ],
  },
  {
    choice: 'class_weighted_baseline_classifier',
    label: 'Baseline MLP Classifier',
    description: 'Direct raw-symptom MLP baseline used for comparison against compressed representations',
    badge: 'BASE MLP',
    rank: 2,
    aliases: [
      'class_weighted_baseline_classifier',
      'cw_baseline',
      'cw_baseline_study',
      'classwise_baseline',
      'cw_full',
    ],
  },
  {
    choice: 'ae_t100',
    label: 'Autoencoder MLP Classifier Threshold 100',
    description:
      'Keeps only diseases with at least 100 original samples, then balances each retained disease to 200 samples',
    badge: 'AE T100',
    rank: 3,
    aliases: ['ae_t100', 'threshold_100', 'autoencoder_threshold_100'],
  },
  {
    choice: 'ae_t200',
    label: 'Autoencoder MLP Classifier Threshold 200',
    description:
      'Keeps only diseases with at least 200 original samples, then balances each retained disease to 200 samples',
    badge: 'AE T200',
    rank: 4,
    aliases: ['ae_t200', 'threshold_200', 'autoencoder_threshold_200'],
  },
  {
    choice: 'ae_t300',
    label: 'Autoencoder MLP Classifier Threshold 300',
    description:
      'Keeps only diseases with at least 300 original samples, then balances each retained disease to 200 samples',
    badge: 'AE T300',
    rank: 5,
    aliases: ['ae_t300', 'threshold_300', 'autoencoder_threshold_300'],
  },
  {
    choice: 'ablation_study',
    label: 'Threshold Study',
    description: 'Autoencoder MLP Classifier threshold experiments across 100, 200, and 300 sample cutoffs with 200-sample class balancing',
    badge: 'THRESH',
    rank: 6,
    aliases: [
      'ablation_study',
      'ablation',
      'ae_ablation',
      'ablate',
      'threshold_studies',
      'threshold_study',
      'threshold',
      'ae_threshold',
    ],
  },
];

const DIRECT_MODEL_LABELS: Record<string, string> = {
  logistic_regression: 'Logistic Regression',
  lr_full: 'Logistic Regression',
  ae_classifier_full: 'Autoencoder MLP Classifier',
  ae_clf_full: 'Autoencoder MLP Classifier',
  cw_full: 'Baseline MLP Classifier',
  ae_t100: 'Autoencoder MLP Classifier Threshold 100',
  ae_t200: 'Autoencoder MLP Classifier Threshold 200',
  ae_t300: 'Autoencoder MLP Classifier Threshold 300',
};

export const PREDICTION_MODEL_CHOICES: {
  key: PredictionModelChoice;
  label: string;
  description: string;
}[] = [
  {
    key: 'all',
    label: 'All Studies',
    description: 'Run every study returned by the API and compare results',
  },
  ...PREDICTION_MODEL_DESCRIPTORS.map(({ choice, label, description }) => ({
    key: choice,
    label,
    description,
  })),
];

function normalizeModelToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function resolveDescriptor(modelKey: string): PredictionModelDescriptor | null {
  const normalized = normalizeModelToken(modelKey);
  for (const descriptor of PREDICTION_MODEL_DESCRIPTORS) {
    if (
      descriptor.aliases.some(
        (alias) => normalized === alias || normalized.includes(alias) || alias.includes(normalized),
      )
    ) {
      return descriptor;
    }
  }
  return null;
}

function titleCaseFromToken(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function matchesPredictionModelChoice(
  modelKey: string,
  choice: Exclude<PredictionModelChoice, 'all'>,
): boolean {
  const normalized = normalizeModelToken(modelKey);
  if (choice === 'ablation_study') {
    return normalized === 'ae_t100' || normalized === 'ae_t200' || normalized === 'ae_t300';
  }
  const descriptor = resolveDescriptor(modelKey);
  return descriptor?.choice === choice;
}

export function getPredictionModelLabel(modelKey: string): string {
  const normalized = normalizeModelToken(modelKey);
  const directLabel = DIRECT_MODEL_LABELS[normalized];
  if (directLabel) {
    return directLabel;
  }
  const descriptor = resolveDescriptor(modelKey);
  if (descriptor) {
    return descriptor.label;
  }
  return normalized ? titleCaseFromToken(normalized) : modelKey;
}

export function getPredictionModelBadge(modelKey: string, modelType?: string): string {
  const descriptor = resolveDescriptor(modelKey);
  if (descriptor) {
    return descriptor.badge;
  }
  if (typeof modelType === 'string' && modelType.trim()) {
    return modelType.trim().toUpperCase();
  }
  return 'MODEL';
}

export function getPredictionModelRank(modelKey: string): number {
  const descriptor = resolveDescriptor(modelKey);
  if (descriptor) {
    return descriptor.rank;
  }
  return Number.MAX_SAFE_INTEGER;
}

type ThresholdWarningInfo = {
  threshold: number;
  title: string;
  message: string;
};

const THRESHOLD_MODEL_WARNINGS: Record<'ae_t100' | 'ae_t200' | 'ae_t300', ThresholdWarningInfo> = {
  ae_t100: {
    threshold: 100,
    title: 'Threshold 100 coverage warning',
    message:
      'This variant keeps only diseases with at least 100 original samples. Retained diseases are then balanced to 200 samples each, so diagnoses below the cutoff are excluded.',
  },
  ae_t200: {
    threshold: 200,
    title: 'Threshold 200 coverage warning',
    message:
      'This variant keeps only diseases with at least 200 original samples. Retained diseases are then balanced to 200 samples each, so diagnoses below the cutoff are excluded.',
  },
  ae_t300: {
    threshold: 300,
    title: 'Threshold 300 coverage warning',
    message:
      'This variant keeps only diseases with at least 300 original samples. Retained diseases are then balanced to 200 samples each, so diagnoses below the cutoff are excluded.',
  },
};

export function getThresholdModelWarning(modelKey: string): ThresholdWarningInfo | null {
  const normalized = normalizeModelToken(modelKey);
  if (normalized in THRESHOLD_MODEL_WARNINGS) {
    return THRESHOLD_MODEL_WARNINGS[normalized as keyof typeof THRESHOLD_MODEL_WARNINGS];
  }
  return null;
}
