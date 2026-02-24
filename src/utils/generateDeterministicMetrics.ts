type RocPoint = { fpr: number; tpr: number };
type PrPoint = { recall: number; precision: number };

export type BenchmarkMetrics = {
  auroc: number;
  auprc: number;
  f1: number;
  roc_curve: RocPoint[];
  pr_curve: PrPoint[];
};

/**
 * Deterministic hash → number
 */
function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

/**
 * Seeded pseudo-random generator
 */
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/**
 * Main generator
 */
// export function generateDeterministicMetrics(
//   datasetId: string
// ): BenchmarkMetrics {
//   const seed = hashString(datasetId);
//   const rand = seededRandom(seed);

//   // --- Scalar metrics ---
//   const auroc = +(0.75 + rand() * 0.2).toFixed(3);
//   const auprc = +(0.35 + rand() * 0.4).toFixed(3);
//   const f1 = +(0.45 + rand() * 0.25).toFixed(3);

//   // --- ROC Curve (monotonic, convex-ish) ---
//   const roc_curve: RocPoint[] = [
//     { fpr: 0, tpr: 0 },
//     { fpr: 0.05, tpr: +(0.55 + rand() * 0.15).toFixed(3) },
//     { fpr: 0.15, tpr: +(0.7 + rand() * 0.15).toFixed(3) },
//     { fpr: 0.3, tpr: +(0.82 + rand() * 0.12).toFixed(3) },
//     { fpr: 0.6, tpr: +(0.9 + rand() * 0.08).toFixed(3) },
//     { fpr: 1, tpr: 1 }
//   ];

//   // --- PR Curve (decreasing precision) ---
//   const pr_curve: PrPoint[] = [
//     { recall: 0, precision: 1 },
//     { recall: 0.2, precision: +(0.85 + rand() * 0.1).toFixed(3) },
//     { recall: 0.4, precision: +(0.7 + rand() * 0.1).toFixed(3) },
//     { recall: 0.6, precision: +(0.55 + rand() * 0.1).toFixed(3) },
//     { recall: 0.8, precision: +(0.4 + rand() * 0.1).toFixed(3) },
//     { recall: 1, precision: +(0.25 + rand() * 0.1).toFixed(3) }
//   ];

//   return {
//     auroc,
//     auprc,
//     f1,
//     roc_curve,
//     pr_curve,
//   };
// }

// export function generateDeterministicMetrics(
//   datasetId: string
// ): BenchmarkMetrics {
//   const storageKey = `benchmark_metrics_${datasetId}`;

//   // 1️⃣ Try localStorage first
//   if (typeof window !== "undefined") {
//     const cached = localStorage.getItem(storageKey);
//     if (cached) {
//       return JSON.parse(cached);
//     }
//   }

//   // 2️⃣ Generate deterministically if not cached
//   const seed = hashString(datasetId);
//   const rand = seededRandom(seed);

//   const auroc = +(0.75 + rand() * 0.2).toFixed(3);
//   const auprc = +(0.35 + rand() * 0.4).toFixed(3);
//   const f1 = +(0.45 + rand() * 0.25).toFixed(3);

//   const roc_curve: RocPoint[] = [
//     { fpr: 0, tpr: 0 },
//     { fpr: 0.05, tpr: +(0.55 + rand() * 0.15).toFixed(3) },
//     { fpr: 0.15, tpr: +(0.7 + rand() * 0.15).toFixed(3) },
//     { fpr: 0.3, tpr: +(0.82 + rand() * 0.12).toFixed(3) },
//     { fpr: 0.6, tpr: +(0.9 + rand() * 0.08).toFixed(3) },
//     { fpr: 1, tpr: 1 }
//   ];

//   const pr_curve: PrPoint[] = [
//     { recall: 0, precision: 1 },
//     { recall: 0.2, precision: +(0.85 + rand() * 0.1).toFixed(3) },
//     { recall: 0.4, precision: +(0.7 + rand() * 0.1).toFixed(3) },
//     { recall: 0.6, precision: +(0.55 + rand() * 0.1).toFixed(3) },
//     { recall: 0.8, precision: +(0.4 + rand() * 0.1).toFixed(3) },
//     { recall: 1, precision: +(0.25 + rand() * 0.1).toFixed(3) }
//   ];

//   const metrics: BenchmarkMetrics = {
//     auroc,
//     auprc,
//     f1,
//     roc_curve,
//     pr_curve,
//   };

//   // 3️⃣ Persist to localStorage
//   if (typeof window !== "undefined") {
//     localStorage.setItem(storageKey, JSON.stringify(metrics));
//   }

//   return metrics;
// }

const allDatasets = [
  // -------------------------
  // Curated Ground-Truth GRNs
  // -------------------------
  {
    id: 'GSD',
    name: 'GSD',
    organism: 'N/A',
    type: 'curated',
    genes: 18,
    cells: 120,
    edges: 79,
    source: 'real' as const,
    lastUpdated: '2020-03-27',
    sparklineData: [62, 59, 62, 61, 63, 64, 63, 60, 60, 64]
  },
  {
    id: 'HSC',
    name: 'HSC',
    organism: 'N/A',
    type: 'curated',
    genes: 11,
    cells: 110,
    edges: 30,
    source: 'real' as const,
    lastUpdated: '2020-05-14',
    sparklineData: [59, 58, 61, 60, 64, 57, 62, 59, 60, 58]
  },
  {
    id: 'mCAD',
    name: 'mCAD',
    organism: 'N/A',
    type: 'curated',
    genes: 5,
    cells: 100,
    edges: 14,
    source: 'real' as const,
    lastUpdated: '2021-01-11',
    sparklineData: [60, 63, 58, 61, 65, 53, 62, 57, 60, 61]
  },
  {
    id: 'VSC',
    name: 'VSC',
    organism: 'N/A',
    type: 'curated',
    genes: 8,
    cells: 115,
    edges: 15,
    source: 'real' as const,
    lastUpdated: '2021-04-02',
    sparklineData: [60, 61, 64, 59, 62, 58, 63, 60, 62, 61]
  },

  // -------------------------
  // Real scRNA-seq Datasets
  // -------------------------
  {
    id: 'hESC',
    name: 'hESC',
    organism: 'Human',
    type: 'scRNA-seq',
    genes: 1000,
    cells: 758,
    edges: 3200,
    source: 'real' as const,
    lastUpdated: '2020-09-18',
    sparklineData: [29, 27, 31, 25, 29, 31, 28, 32, 30, 26]
  },
  {
    id: 'hHep',
    name: 'hHep',
    organism: 'Human',
    type: 'scRNA-seq',
    genes: 950,
    cells: 642,
    edges: 2800,
    source: 'real' as const,
    lastUpdated: '2021-02-23',
    sparklineData: [18, 24, 20, 25, 32, 28, 25, 23, 25, 26]
  },
  {
    id: 'mDC',
    name: 'mDC',
    organism: 'Mouse',
    type: 'scRNA-seq',
    genes: 900,
    cells: 383,
    edges: 2100,
    source: 'real' as const,
    lastUpdated: '2021-06-30',
    sparklineData: [15, 20, 18, 26, 20, 25, 19, 23, 21, 17]
  },
  {
    id: 'mESC',
    name: 'mESC',
    organism: 'Mouse',
    type: 'scRNA-seq',
    genes: 1100,
    cells: 536,
    edges: 3400,
    source: 'real' as const,
    lastUpdated: '2022-01-19',
    sparklineData: [26, 25, 28, 24, 23, 27, 23, 23, 24, 22]
  },
  {
    id: 'mHSC-E',
    name: 'mHSC-E',
    organism: 'Mouse',
    type: 'scRNA-seq',
    genes: 1050,
    cells: 645,
    edges: 3100,
    source: 'real' as const,
    lastUpdated: '2022-03-07',
    sparklineData: [26, 27, 25, 30, 28, 30, 26, 29, 31, 29]
  },
  {
    id: 'mHSC-GM',
    name: 'mHSC-GM',
    organism: 'Mouse',
    type: 'scRNA-seq',
    genes: 1200,
    cells: 635,
    edges: 3600,
    source: 'real' as const,
    lastUpdated: '2022-06-12',
    sparklineData: [30, 25, 26, 23, 27, 29, 26, 28, 30, 24]
  },
  {
    id: 'mHSC-L',
    name: 'mHSC-L',
    organism: 'Mouse',
    type: 'scRNA-seq',
    genes: 980,
    cells: 712,
    edges: 2950,
    source: 'real' as const,
    lastUpdated: '2022-08-25',
    sparklineData: [20, 22, 25, 26, 27, 23, 26, 24, 28, 24]
  },

  // -------------------------
  // Synthetic Dynamic Networks
  // -------------------------
  {
    id: 'dyn-LL',
    name: 'Dynamic LL',
    organism: 'N/A',
    type: 'synthetic',
    genes: 18,
    cells: 140,
    edges: 19,
    source: 'synthetic' as const,
    lastUpdated: '2020-07-09',
    sparklineData: [39, 42, 42, 41, 38, 39, 41, 37, 40, 40]
  },
  {
    id: 'dyn-LI',
    name: 'Dynamic LI',
    organism: 'N/A',
    type: 'synthetic',
    genes: 7,
    cells: 115,
    edges: 8,
    source: 'synthetic' as const,
    lastUpdated: '2020-10-21',
    sparklineData: [36, 37, 35, 40, 38, 41, 39, 39, 41, 34]
  },
  {
    id: 'dyn-TF',
    name: 'Dynamic TF',
    organism: 'N/A',
    type: 'synthetic',
    genes: 7,
    cells: 118,
    edges: 20,
    source: 'synthetic' as const,
    lastUpdated: '2021-03-16',
    sparklineData: [40, 41, 38, 41, 36, 43, 39, 42, 37, 42]
  },
  {
    id: 'dyn-BF',
    name: 'Dynamic BF',
    organism: 'N/A',
    type: 'synthetic',
    genes: 5,
    cells: 105,
    edges: 12,
    source: 'synthetic' as const,
    lastUpdated: '2021-09-28',
    sparklineData: [35, 39, 37, 37, 36, 40, 39, 42, 38, 39]
  },
  {
    id: 'dyn-BFC',
    name: 'Dynamic BFC',
    organism: 'N/A',
    type: 'synthetic',
    genes: 9,
    cells: 125,
    edges: 18,
    source: 'synthetic' as const,
    lastUpdated: '2022-02-14',
    sparklineData: [39, 40, 38, 41, 37, 42, 39, 39, 38, 40]
  },
  {
    id: 'dyn-CY',
    name: 'Dynamic CY',
    organism: 'N/A',
    type: 'synthetic',
    genes: 5,
    cells: 110,
    edges: 6,
    source: 'synthetic' as const,
    lastUpdated: '2022-11-03',
    sparklineData: [37, 41, 39, 40, 31, 43, 40, 41, 40, 41]
  },
];

const METRICS_STORAGE_KEY = "all_dataset_metrics";

export function generateDeterministicMetrics(datasetId: string): BenchmarkMetrics {
  const seed = hashString(datasetId);
  const rand = seededRandom(seed);

  const auroc = +(0.75 + rand() * 0.2).toFixed(3);
  const auprc = +(0.35 + rand() * 0.4).toFixed(3);
  const f1 = +(0.45 + rand() * 0.25).toFixed(3);

  const roc_curve: RocPoint[] = [
    { fpr: 0, tpr: 0 },
    { fpr: 0.05, tpr: +(0.55 + rand() * 0.15).toFixed(3) },
    { fpr: 0.15, tpr: +(0.7 + rand() * 0.15).toFixed(3) },
    { fpr: 0.3, tpr: +(0.82 + rand() * 0.12).toFixed(3) },
    { fpr: 0.6, tpr: +(0.9 + rand() * 0.08).toFixed(3) },
    { fpr: 1, tpr: 1 }
  ];

  const pr_curve: PrPoint[] = [
    { recall: 0, precision: 1 },
    { recall: 0.2, precision: +(0.85 + rand() * 0.1).toFixed(3) },
    { recall: 0.4, precision: +(0.7 + rand() * 0.1).toFixed(3) },
    { recall: 0.6, precision: +(0.55 + rand() * 0.1).toFixed(3) },
    { recall: 0.8, precision: +(0.4 + rand() * 0.1).toFixed(3) },
    { recall: 1, precision: +(0.25 + rand() * 0.1).toFixed(3) }
  ];

  return { auroc, auprc, f1, roc_curve, pr_curve };
}

export function getAllDatasetMetrics() {
  let storedMetrics: Record<string, BenchmarkMetrics> = {};
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(METRICS_STORAGE_KEY);
    if (raw) storedMetrics = JSON.parse(raw);
  }

  for (const dataset of allDatasets) {
    if (!storedMetrics[dataset.id]) {
      storedMetrics[dataset.id] = generateDeterministicMetrics(dataset.id);
    }
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(storedMetrics));
  }

  return storedMetrics;
}