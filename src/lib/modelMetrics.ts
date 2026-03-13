export type ModelMetrics = {
  loss: number;
  acc: number;
  macroPrecision: number;
  macroRecall: number;
  macroF1: number;
  top3: number;
  top5: number;
};

export type ModelInfo = {
  displayName: string;
  description: string;
  trainingDataDetails: string;
  metricsMean: ModelMetrics;
  metricsStd?: Partial<ModelMetrics>;
  extraNotes?: string;
  studyVariants?: {
    label: string;
    metricsMean: ModelMetrics;
    metricsStd?: Partial<ModelMetrics>;
    extraNotes?: string;
    topConfusions?: { trueLabel: string; predLabel: string; count: number }[];
  }[];
  baselineComparison?: {
    label: string;
    metricsMean: ModelMetrics;
    metricsStd?: Partial<ModelMetrics>;
    extraNotes?: string;
    topConfusions?: { trueLabel: string; predLabel: string; count: number }[];
  };
  topConfusions?: { trueLabel: string; predLabel: string; count: number }[];
};

export const MODEL_METRICS: Record<
  'ablation_study' | 'ae_clf_full' | 'cw_full' | 'lr_full',
  ModelInfo
> = {
  lr_full: {
    displayName: 'Logistic Regression',
    description:
      'A simple linear model that performs best on the current binary symptom dataset for disease classification.',
    trainingDataDetails:
      'This model operates directly on the 377-dimensional binary symptom vector without latent compression. It is the strongest overall performer in the current evaluation, which makes it the clearest reference model for raw symptom-pattern classification.',
    metricsMean: {
      loss: 0.322,
      acc: 0.864,
      macroPrecision: 0.8343,
      macroRecall: 0.9049,
      macroF1: 0.8529,
      top3: 0.9614,
      top5: 0.9811,
    },
    metricsStd: {
      loss: 0.0312,
      acc: 0.0006,
      macroPrecision: 0.0026,
      macroRecall: 0.001,
      macroF1: 0.0017,
      top3: 0.0007,
      top5: 0.0006,
    },
    extraNotes:
      'Because the inputs are already binary symptom indicators, the linear decision surface is a strong fit here and currently beats the more complex alternatives on the reported multi-seed evaluation.',
    topConfusions: [
      {
        trueLabel: 'infectious gastroenteritis',
        predLabel: 'noninfectious gastroenteritis',
        count: 285,
      },
      {
        trueLabel: 'noninfectious gastroenteritis',
        predLabel: 'infectious gastroenteritis',
        count: 277,
      },
      {
        trueLabel: 'cholecystitis',
        predLabel: 'gallstone',
        count: 264,
      },
      {
        trueLabel: 'depression',
        predLabel: 'post-traumatic stress disorder (ptsd)',
        count: 215,
      },
      {
        trueLabel: 'temporary or benign blood in urine',
        predLabel: 'bladder disorder',
        count: 205,
      },
    ],
  },
  ae_clf_full: {
    displayName: 'Autoencoder MLP Classifier',
    description:
      'An autoencoder plus MLP pipeline that can learn deeper semantic relationships, but latent compression can also discard useful symptom detail.',
    trainingDataDetails:
      'This model first compresses the raw symptom vector into a learned latent representation and then classifies from that embedding with an MLP head. That compression can improve abstraction in some cases, but it can also lose symptom-level information and underperform a direct model in other cases.',
    metricsMean: {
      loss: 0.3758,
      acc: 0.8525,
      macroPrecision: 0.8261,
      macroRecall: 0.8849,
      macroF1: 0.8386,
      top3: 0.9548,
      top5: 0.9773,
    },
    metricsStd: {
      loss: 0.0046,
      acc: 0.0014,
      macroPrecision: 0.0059,
      macroRecall: 0.0029,
      macroF1: 0.0051,
      top3: 0.0009,
      top5: 0.0007,
    },
    extraNotes:
      'This is a tradeoff model. It may outperform a simpler baseline in settings where latent structure helps, but it may also do worse when compression removes discriminative symptom cues.',
    baselineComparison: {
      label: 'Baseline MLP Classifier Reference',
      metricsMean: {
        loss: 0.4767,
        acc: 0.8583,
        macroPrecision: 0.8709,
        macroRecall: 0.8583,
        macroF1: 0.8585,
        top3: 0.9484,
        top5: 0.9697,
      },
      metricsStd: {
        loss: 0.0159,
        acc: 0.0027,
        macroPrecision: 0.0026,
        macroRecall: 0.0027,
        macroF1: 0.0028,
        top3: 0.0019,
        top5: 0.0018,
      },
      extraNotes:
        'Use this as the direct raw-symptom comparison point when discussing where latent compression helps versus where it costs information.',
      topConfusions: [
        {
          trueLabel: 'infectious gastroenteritis',
          predLabel: 'noninfectious gastroenteritis',
          count: 91,
        },
        {
          trueLabel: 'psychotic disorder',
          predLabel: 'schizophrenia',
          count: 99,
        },
        {
          trueLabel: 'kidney stone',
          predLabel: 'pyelonephritis',
          count: 80,
        },
        {
          trueLabel: 'gum disease',
          predLabel: 'tooth disorder',
          count: 69,
        },
        {
          trueLabel: 'fibromyalgia',
          predLabel: 'neuralgia',
          count: 68,
        },
      ],
    },
    topConfusions: [
      {
        trueLabel: 'noninfectious gastroenteritis',
        predLabel: 'infectious gastroenteritis',
        count: 303,
      },
      {
        trueLabel: 'infectious gastroenteritis',
        predLabel: 'noninfectious gastroenteritis',
        count: 249,
      },
      {
        trueLabel: 'cholecystitis',
        predLabel: 'gallstone',
        count: 246,
      },
      {
        trueLabel: 'kidney stone',
        predLabel: 'pyelonephritis',
        count: 210,
      },
      {
        trueLabel: 'depression',
        predLabel: 'post-traumatic stress disorder (ptsd)',
        count: 193,
      },
    ],
  },
  cw_full: {
    displayName: 'Baseline MLP Classifier',
    description:
      'A direct MLP baseline on the raw symptom vector used as the main non-compressed neural reference.',
    trainingDataDetails:
      'This model classifies directly from the binary symptom vector without an autoencoder bottleneck. It is the main baseline used to compare whether latent compression helps or hurts.',
    metricsMean: {
      loss: 0.4236,
      acc: 0.8499,
      macroPrecision: 0.8291,
      macroRecall: 0.8807,
      macroF1: 0.8399,
      top3: 0.9516,
      top5: 0.9739,
    },
    metricsStd: {
      loss: 0.0106,
      acc: 0.0012,
      macroPrecision: 0.0035,
      macroRecall: 0.0026,
      macroF1: 0.0026,
      top3: 0.0009,
      top5: 0.0007,
    },
    extraNotes:
      'Use this as the baseline MLP comparison card against the Autoencoder MLP Classifier and Logistic Regression.',
    topConfusions: [
      {
        trueLabel: 'infectious gastroenteritis',
        predLabel: 'noninfectious gastroenteritis',
        count: 331,
      },
      {
        trueLabel: 'noninfectious gastroenteritis',
        predLabel: 'infectious gastroenteritis',
        count: 263,
      },
      {
        trueLabel: 'cholecystitis',
        predLabel: 'gallstone',
        count: 253,
      },
      {
        trueLabel: 'skin polyp',
        predLabel: 'skin disorder',
        count: 207,
      },
      {
        trueLabel: 'depression',
        predLabel: 'post-traumatic stress disorder (ptsd)',
        count: 204,
      },
    ],
  },
  ablation_study: {
    displayName: 'Threshold Study',
    description:
      'Threshold experiments comparing Autoencoder MLP Classifier variants after filtering to diseases that meet a minimum sample cutoff and then balancing retained diseases to 200 samples each.',
    trainingDataDetails:
      'This study keeps only diseases whose original class counts meet the threshold cutoff, then removes samples from the retained diseases until each kept class has exactly 200 samples. The goal is to compare how the Autoencoder MLP Classifier behaves as class coverage becomes more selective before balancing.',
    metricsMean: {
      loss: 0.4994,
      acc: 0.842,
      macroPrecision: 0.8603,
      macroRecall: 0.842,
      macroF1: 0.8401,
      top3: 0.948,
      top5: 0.9728,
    },
    metricsStd: {
      loss: 0.0123,
      acc: 0.0042,
      macroPrecision: 0.0036,
      macroRecall: 0.0042,
      macroF1: 0.0042,
      top3: 0.002,
      top5: 0.0021,
    },
    extraNotes:
      'Supporting study only. Use this page to compare how stricter class-retention cutoffs change coverage and model behavior after balancing every retained class to 200 samples.',
    studyVariants: [
      {
        label: 'Autoencoder MLP Classifier Threshold 100',
        metricsMean: {
          loss: 0.4994,
          acc: 0.842,
          macroPrecision: 0.8603,
          macroRecall: 0.842,
          macroF1: 0.8401,
          top3: 0.948,
          top5: 0.9728,
        },
        metricsStd: {
          loss: 0.0123,
          acc: 0.0042,
          macroPrecision: 0.0036,
          macroRecall: 0.0042,
          macroF1: 0.0042,
          top3: 0.002,
          top5: 0.0021,
        },
        extraNotes:
          'Keeps only diseases with at least 100 original samples, then balances each retained disease to exactly 200 samples.',
        topConfusions: [
          {
            trueLabel: 'infectious gastroenteritis',
            predLabel: 'noninfectious gastroenteritis',
            count: 50,
          },
          {
            trueLabel: 'depression',
            predLabel: 'post-traumatic stress disorder (ptsd)',
            count: 39,
          },
          {
            trueLabel: 'corneal abrasion',
            predLabel: 'foreign body in the eye',
            count: 37,
          },
          {
            trueLabel: 'acute bronchospasm',
            predLabel: 'pneumonia',
            count: 37,
          },
          {
            trueLabel: 'kidney stone',
            predLabel: 'pyelonephritis',
            count: 27,
          },
        ],
      },
      {
        label: 'Autoencoder MLP Classifier Threshold 200',
        metricsMean: {
          loss: 0.3934,
          acc: 0.8646,
          macroPrecision: 0.8789,
          macroRecall: 0.8646,
          macroF1: 0.8636,
          top3: 0.9618,
          top5: 0.9823,
        },
        metricsStd: {
          loss: 0.0106,
          acc: 0.003,
          macroPrecision: 0.0024,
          macroRecall: 0.003,
          macroF1: 0.0028,
          top3: 0.0018,
          top5: 0.0007,
        },
        extraNotes:
          'Keeps only diseases with at least 200 original samples, then balances each retained disease to exactly 200 samples.',
        topConfusions: [
          {
            trueLabel: 'infectious gastroenteritis',
            predLabel: 'noninfectious gastroenteritis',
            count: 88,
          },
          {
            trueLabel: 'schizophrenia',
            predLabel: 'psychotic disorder',
            count: 46,
          },
          {
            trueLabel: 'tooth disorder',
            predLabel: 'gum disease',
            count: 46,
          },
          {
            trueLabel: 'acute glaucoma',
            predLabel: 'vitreous degeneration',
            count: 45,
          },
          {
            trueLabel: 'depression',
            predLabel: 'post-traumatic stress disorder (ptsd)',
            count: 45,
          },
        ],
      },
      {
        label: 'Autoencoder MLP Classifier Threshold 300',
        metricsMean: {
          loss: 0.3789,
          acc: 0.8661,
          macroPrecision: 0.8793,
          macroRecall: 0.8661,
          macroF1: 0.8658,
          top3: 0.963,
          top5: 0.9837,
        },
        metricsStd: {
          loss: 0.0089,
          acc: 0.0028,
          macroPrecision: 0.0035,
          macroRecall: 0.0028,
          macroF1: 0.0026,
          top3: 0.0016,
          top5: 0.0004,
        },
        extraNotes:
          'Keeps only diseases with at least 300 original samples, then balances each retained disease to exactly 200 samples.',
        topConfusions: [
          {
            trueLabel: 'infectious gastroenteritis',
            predLabel: 'noninfectious gastroenteritis',
            count: 99,
          },
          {
            trueLabel: 'psychotic disorder',
            predLabel: 'schizophrenia',
            count: 92,
          },
          {
            trueLabel: 'pyelonephritis',
            predLabel: 'kidney stone',
            count: 82,
          },
          {
            trueLabel: 'fibromyalgia',
            predLabel: 'neuralgia',
            count: 78,
          },
          {
            trueLabel: 'gum disease',
            predLabel: 'tooth disorder',
            count: 70,
          },
        ],
      },
    ],
    topConfusions: [
      {
        trueLabel: 'infectious gastroenteritis',
        predLabel: 'noninfectious gastroenteritis',
        count: 50,
      },
      {
        trueLabel: 'depression',
        predLabel: 'post-traumatic stress disorder (ptsd)',
        count: 39,
      },
      {
        trueLabel: 'corneal abrasion',
        predLabel: 'foreign body in the eye',
        count: 37,
      },
      {
        trueLabel: 'acute bronchospasm',
        predLabel: 'pneumonia',
        count: 37,
      },
      {
        trueLabel: 'kidney stone',
        predLabel: 'pyelonephritis',
        count: 27,
      },
    ],
  },
};

export type ModelKey = keyof typeof MODEL_METRICS;
