import { Dataset, Algorithm, PerformanceMetrics, Job, NetworkData } from './types';

function seededRandom(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function InferenceData(dataset: Dataset) {
  const algorithms = ["GENIE3", "GRNBoost2", "PIDC", "SCENIC"];

  const geneCount = Math.min(dataset.genes / 100, 40); 
  const edgeCount = Math.min(dataset.edges / 100, 60);

  const genes = Array.from({ length: geneCount }, (_, i) => {
    return `GENE_${i + 1}`;
  });

  const edges: any[] = [];

  for (let i = 0; i < edgeCount; i++) {
    const source = genes[Math.floor(seededRandom(i + 1) * genes.length)];
    const target = genes[Math.floor(seededRandom(i + 2) * genes.length)];

    if (source === target) continue;

    const scores: Record<string, number> = {};

    algorithms.forEach((algo, idx) => {
      const base =
        algo === "GENIE3" && dataset.source === "curated"
          ? 0.85
          : algo === "GRNBoost2" && dataset.source === "real"
          ? 0.8
          : algo === "PIDC" && dataset.source === "synthetic"
          ? 0.82
          : 0.7;

      scores[algo] =
        base + (seededRandom(i * (idx + 3)) - 0.5) * 0.1;
    });

    edges.push({
      id: `${source}-${target}`,
      source,
      target,
      type: randomEdgeType(),
      scores
    });
  }

  return {
    genes: genes.map(g => ({ id: g, label: g })),
    algorithms,
    edges
  };
}

// Types
export interface Node {
  id: string;
  label: string;
  degree?: number;
  neighbors?: string[];
  bestAlgo?: string;
  bestMean?: number;
}

export interface Edge {
  source: string;
  target: string;
  scores: Record<string, number>;
}

export interface Dataset {
  id: string;
  name: string;
  organism: string;
  type: string;
  genes: number;
  cells: number;
  edges: number;
  source: 'curated' | 'real' | 'synthetic';
  description: string;
  lastUpdated: string;
  sparklineData: number[];
  nodes: Node[];
  edgesData: Edge[];
}

function randomInt1(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function Edges1(nodes: Node[], algorithms: string[]) {
  const edgeTypes = ["activation", "repression", "unknown"] as const;

function randomEdgeType() {
  const rand = Math.random();

  if (rand < 0.45) return "activation";
  if (rand < 0.9) return "repression";
  return "unknown";
}

  const edges: Edge[] = [];
  const n = nodes.length;

  for (let i = 0; i < n; i++) {
    const numConnections = randomInt1(2, 4);
    for (let j = 0; j < numConnections; j++) {
      const targetIdx = randomInt1(0, n - 1);
      if (targetIdx !== i) {
        const scores: Record<string, number> = {};
        algorithms.forEach(algo => {
          scores[algo] = parseFloat((Math.random() * 1).toFixed(3));
        });

        edges.push({
          source: nodes[i].id,
          target: nodes[targetIdx].id,
          scores,
        });
      }
    }
  }

  return edges;
}

const geneNames = [
  'SOX2', 'OCT4', 'NANOG', 'SOX3', 'GATA3', 'KLF4', 'MYC', 'POU5F1',
  'TBX3', 'DPPA4', 'LIN28A', 'ZFP42', 'TFAP2C', 'NR5A2', 'ESRRB', 'TAL1',
  'RUNX1', 'HNF4A', 'FOXA2', 'PAX6', 'SOX1', 'SOX17', 'CDX2', 'EOMES', 'GATA6',
  'MEIS1', 'HAND1', 'HOXA1', 'HOXB1', 'HOXC6'
];

function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

function Dataset(
  id: string,
  name: string,
  organism: string,
  type: string,
  genes: number
) {
  const algorithms = ['algo1', 'algo2', 'algo3'];

  const shuffledGenes = shuffleArray(geneNames);

  const selectedGenes = shuffledGenes.slice(
    0,
    Math.min(genes, geneNames.length)
  );

  const nodes: Node[] = selectedGenes.map((gene) => ({
    id: gene,
    label: gene,
    degree: 0,
    neighbors: [],
    bestAlgo: '',
    bestMean: 0
  }));

  const edgesData = Edges1(nodes, algorithms);


  nodes.forEach(node => {

    const relatedEdges = edgesData.filter(
      e => e.source === node.id || e.target === node.id
    );

    const neighbors = relatedEdges.map(e =>
      e.source === node.id ? e.target : e.source
    );

    node.degree = neighbors.length;
    node.neighbors = neighbors;

    const algoScores: Record<string, number[]> = {};

    relatedEdges.forEach(edge => {
      Object.entries(edge.scores).forEach(([algo, score]) => {
        if (!algoScores[algo]) algoScores[algo] = [];
        algoScores[algo].push(score);
      });
    });

    let bestAlgo = '';
    let bestMean = 0;

    Object.entries(algoScores).forEach(([algo, scores]) => {
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (mean > bestMean) {
        bestMean = mean;
        bestAlgo = algo;
      }
    });

    node.bestAlgo = bestAlgo;
    node.bestMean = parseFloat(bestMean.toFixed(3));
  });

  return {
    id,
    name,
    organism,
    type,
    genes,
    cells: randomInt1(300, 800),
    edges: edgesData.length,
    source: 'curated' as const,
    description: `${name}  dataset`,
    lastUpdated: new Date().toISOString().split('T')[0],
    sparklineData: Array.from({ length: 10 }, () => randomInt1(20, 100)),
    nodes,
    edgesData,
  } as Dataset;
}

export const Algorithms: Algorithm[] = [
  {
    id: 'alg1',
    name: 'GENIE3',
    version: '1.0',
    description: 'Tree-based network inference using random forests',
    category: 'Tree-based',
    lastCommitMessage: 'Yiqi dockerfiles pull',
    lastCommitDate: '2 years ago'
  },
  {
    id: 'alg2',
    name: 'GRNBoost2',
    version: '1.0',
    description: 'Boolean network inference with GRNBoost2',
    category: 'Gradient Boosting',
    lastCommitMessage: 'Added BoolTraineR.',
    lastCommitDate: '7 years ago'
  },
  {
    id: 'alg3',
    name: 'Pearson',
    version: '1.0',
    description: 'Gene regulatory inference using correlation analysis',
    category: 'Correlation',
    lastCommitMessage: 'Add README markdown files for algorithms integration',
    lastCommitDate: '3 years ago'
  },
  {
    id: 'alg4',
    name: 'Spearman',
    version: '1.0',
    description: 'Variational Information Theory for network inference',
    category: 'Information Theory',
    lastCommitMessage: 'Add README markdown files for algorithms integration',
    lastCommitDate: '3 years ago'
  },
  {
    id: 'alg5',
    name: 'ARACNE',
    version: '1.0',
    description: 'Tree-based network inference',
    category: 'Tree-based',
    lastCommitMessage: 'tried to run the time command',
    lastCommitDate: '7 years ago'
  },
  {
    id: 'alg6',
    name: 'SINGE',
    version: '1.2',
    description: 'Probabilistic based expression association for pseudotime',
    category: 'Probabilistic',
    lastCommitMessage: 'Add README markdown files for algorithms integration',
    lastCommitDate: '3 years ago'
  },
  {
    id: 'alg7',
    name: 'GRNVBEM',
    version: '2.1',
    description: 'Dynamical Systems Information Decomposition and Context',
    category: 'Dynamical Systems',
    lastCommitMessage: 'Yiqi dockerfiles pull',
    lastCommitDate: '2 years ago'
  },
  {
    id: 'alg8',
    name: 'GRISLI',
    version: '1.0',
    description: 'Pseudo-time network inference',
    category: 'Time Series',
    lastCommitMessage: 'Added time module to each of the dockers.',
    lastCommitDate: '7 years ago'
  },
  {
    id: 'alg9',
    name: 'SCODE',
    version: '1.0',
    description: 'Partial correlation based network inference',
    category: 'Linear Models',
    lastCommitMessage: 'Add README markdown files for algorithms integration',
    lastCommitDate: '3 years ago'
  },
  {
    id: 'alg10',
    name: 'SNS',
    version: '1.0',
    description: 'Regression network inference with time series',
    category: 'Regression',
    lastCommitMessage: 'Set user to avoid permission issues',
    lastCommitDate: '5 years ago'
  },
  {
    id: 'alg11',
    name: 'LEAP',
    version: '1.0',
    description: 'Correlation based network inference',
    category: 'Correlation',
    lastCommitMessage: 'scns dockerfile fix',
    lastCommitDate: '2 years ago'
  },
  {
    id: 'alg12',
    name: 'Arboreto',
    version: '1.0',
    description: 'Network inference from single-cell expression data',
    category: 'Tree-based',
    lastCommitMessage: 'Add README markdown files for algorithms integration',
    lastCommitDate: '3 years ago'
  }
];

export const Datasets: Dataset[] = [
  Dataset('hESC', 'hESC', 'Human', 'scRNA-seq', 25),
  Dataset('mDC', 'mDC', 'Mouse', 'scRNA-seq', 22),
  Dataset('mESC', 'mESC', 'Mouse', 'scRNA-seq', 28),
  Dataset('hHep', 'hHep', 'Human', 'scRNA-seq', 24),
  Dataset('VSC', 'VSC', 'Mouse', 'scRNA-seq', 26),
  Dataset('hHSPC', 'hHSPC', 'Human', 'scRNA-seq', 30),
  Dataset('mHSC-E', 'mHSC-E', 'Mouse', 'scRNA-seq', 27),
  Dataset('mHSC-L', 'mHSC-L', 'Mouse', 'scRNA-seq', 23),
  Dataset('Synthetic-1', 'Synthetic-1', 'Synthetic', 'scRNA-seq', 25),
  Dataset('Synthetic-2', 'Synthetic-2', 'Synthetic', 'scRNA-seq', 24),
  Dataset('yeast-1', 'Yeast Network 1', 'Yeast', 'Bulk RNA-seq', 22),
  Dataset('yeast-2', 'Yeast Network 2', 'Yeast', 'Bulk RNA-seq', 21),
];

const geneLabels = [
  'SOX2','OCT4','NANOG','KLF4','MYC','SOX3','POU5F1','GATA3',
  'TBX3','ESRRB','DPPA4','ZFP42','UTF1','SALL4','DNMT3B',
  'PRDM14','LEFTY1','NODAL','FGF4','LIN28A','T','EOMES','CER1','GSC','NANOS3','TFAP2C','SOX17','GATA6','PDGFRA','FOXA2'
];

export const NetworkData = {
  nodes: geneLabels.map((gene, idx) => ({
    id: `gene${idx + 1}`,
    label: gene,
    score: parseFloat((Math.random() * 1).toFixed(3))
  })),
};

export const InferenceData2 = {
  algorithms: Algorithms,
  edges: [] as any[],
};

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

NetworkData.nodes.forEach(sourceNode => {
  const numEdges = getRandomInt(2, 5);

  for (let i = 0; i < numEdges; i++) {
    const targetNode = NetworkData.nodes[getRandomInt(0, NetworkData.nodes.length - 1)];
    if (targetNode.id === sourceNode.id) continue; 
    if (InferenceData2.edges.some(e => e.source === sourceNode.id && e.target === targetNode.id)) continue;

    const edgeType = Math.random() < 0.5 ? 'activation' : 'repression';

    const scores: Record<string, number> = {};
    Algorithms.forEach(algo => {
      scores[algo] = parseFloat((Math.random()).toFixed(2));
    });

    InferenceData2.edges.push({
      id: `edge-${InferenceData2.edges.length + 1}`,
      source: sourceNode.id,
      target: targetNode.id,
      type: edgeType,
      scores,
    });
  }
});

console.log(`d ${NetworkData.nodes.length} nodes and ${InferenceData2.edges.length} edges`);

export type EdgeType = 'activation' | 'repression';

export interface Node {
  id: string;
  label: string;
  degree?: number;
  neighbors?: string[];
  bestAlgo?: string;
  bestMean?: number;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  scores: Record<string, number>;
}

export interface Dataset {
  nodes: Node[];
  edges: Edge[];
  algorithms: string[];
}

const algorithms = ['GENIE3', 'SCENIC', 'PIDC', 'GRNBoost2'];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function Edges(nodes: Node[], numEdges: number): Edge[] {
  const edges: Edge[] = [];
  const n = nodes.length;

  for (let i = 0; i < numEdges; i++) {
    const sourceIdx = randomInt(0, n - 1);
    let targetIdx = randomInt(0, n - 1);
    while (targetIdx === sourceIdx) targetIdx = randomInt(0, n - 1);

    const type: EdgeType = Math.random() < 0.5 ? 'activation' : 'repression';

    const scores: Record<string, number> = {};
    algorithms.forEach(algo => {
      scores[algo] = parseFloat((Math.random()).toFixed(3));
    });

    edges.push({
      id: `edge-${i}`,
      source: nodes[sourceIdx].id,
      target: nodes[targetIdx].id,
      type,
      scores,
    });
  }

  return edges;
}

const datasetGenePools: Record<string, string[]> = {
  hESC: [
    'SOX2','OCT4','NANOG','KLF4','MYC','POU5F1','ESRRB','ZFP42',
    'DPPA4','UTF1','PRDM14','LEFTY1','NODAL','FGF4','LIN28A'
  ],
  mESC: [
    'Sox2','Pou5f1','Nanog','Esrrb','Zfp42','Dppa4','Klf4',
    'Tbx3','Gata6','Sall4','Dnmt3b','Lefty2','Eomes'
  ],
  yeast: [
    'GAL4','GAL80','MIG1','HAP4','SWI4','MBP1','STE12',
    'GCN4','YAP1','RPN4','SOK2','ACE2'
  ],
  synthetic: [
    'TF1','TF2','TF3','TF4','TF5','GeneA','GeneB','GeneC','GeneD'
  ]
};

function getGenePool(datasetId: string): string[] {
  if (datasetId.startsWith('yeast')) return datasetGenePools.yeast;
  if (datasetId.startsWith('Synthetic')) return datasetGenePools.synthetic;
  if (datasetId === 'mESC') return datasetGenePools.mESC;
  return datasetGenePools.hESC; // default human stem-like
}

function Nodes(
  dataset: Dataset,
  edges: Edge[]
): Node[] {

  const pool = getGenePool(dataset.id);

  const nodeCount = Math.min(
    Math.floor(dataset.genes / 100),
    pool.length
  );

  const selectedGenes = pool.slice(0, nodeCount);

  const nodes: Node[] = selectedGenes.map(gene => ({
    id: gene,
    label: gene,
    degree: 0,
    neighbors: [],
    bestAlgo: '',
    bestMean: 0
  }));


  nodes.forEach(node => {

    const relatedEdges = edges.filter(
      e => e.source === node.id || e.target === node.id
    );

    const neighbors = relatedEdges.map(e =>
      e.source === node.id ? e.target : e.source
    );

    node.neighbors = neighbors;
    node.degree = neighbors.length;

    const algoScores: Record<string, number[]> = {};

    relatedEdges.forEach(edge => {
      Object.entries(edge.scores).forEach(([algo, score]) => {
        if (!algoScores[algo]) algoScores[algo] = [];
        algoScores[algo].push(score);
      });
    });

    let bestAlgo = '';
    let bestMean = 0;

    Object.entries(algoScores).forEach(([algo, scores]) => {
      const mean =
        scores.reduce((a, b) => a + b, 0) / scores.length;

      if (mean > bestMean) {
        bestMean = mean;
        bestAlgo = algo;
      }
    });

    node.bestAlgo = bestAlgo;
    node.bestMean = parseFloat(bestMean.toFixed(3));
  });

  return nodes;
}

export const PerformanceMetrics: PerformanceMetrics[] = [
  {
    algorithmId: 'alg1',
    algorithmName: 'GENIE3',
    precision: 0.71,
    recall: 0.69,
    f1Score: 0.70,
    auroc: 0.82,
    auprc: 0.75,
    earlyPrecision: 0.68,
    runtime: 132.4,
    memoryUsage: 2200
  },
  {
    algorithmId: 'alg2',
    algorithmName: 'GRNBoost2',
    precision: 0.63,
    recall: 0.60,
    f1Score: 0.61,
    auroc: 0.74,
    auprc: 0.66,
    earlyPrecision: 0.57,
    runtime: 245.1,
    memoryUsage: 2700
  },
  {
    algorithmId: 'alg3',
    algorithmName: 'Pearson',
    precision: 0.68,
    recall: 0.71,
    f1Score: 0.69,
    auroc: 0.80,
    auprc: 0.72,
    earlyPrecision: 0.66,
    runtime: 154.8,
    memoryUsage: 2400
  },
  {
    algorithmId: 'alg4',
    algorithmName: 'Spearman',
    precision: 0.66,
    recall: 0.67,
    f1Score: 0.66,
    auroc: 0.76,
    auprc: 0.69,
    earlyPrecision: 0.61,
    runtime: 178.3,
    memoryUsage: 2816
  },
  {
    algorithmId: 'alg5',
    algorithmName: 'ARACNE',
    precision: 0.62,
    recall: 0.58,
    f1Score: 0.60,
    auroc: 0.72,
    auprc: 0.64,
    earlyPrecision: 0.55,
    runtime: 268.9,
    memoryUsage: 3000
  },
  {
    algorithmId: 'alg6',
    algorithmName: 'SINGE',
    precision: 0.69,
    recall: 0.73,
    f1Score: 0.71,
    auroc: 0.81,
    auprc: 0.74,
    earlyPrecision: 0.67,
    runtime: 143.2,
    memoryUsage: 2304
  },
  {
    algorithmId: 'alg7',
    algorithmName: 'GRNVBEM',
    precision: 0.71,
    recall: 0.68,
    f1Score: 0.69,
    auroc: 0.80,
    auprc: 0.73,
    earlyPrecision: 0.70,
    runtime: 98.2,
    memoryUsage: 1536
  },
  {
    algorithmId: 'alg8',
    algorithmName: 'GRISLI',
    precision: 0.64,
    recall: 0.63,
    f1Score: 0.63,
    auroc: 0.75,
    auprc: 0.67,
    earlyPrecision: 0.59,
    runtime: 221.5,
    memoryUsage: 2600
  },
  {
    algorithmId: 'alg9',
    algorithmName: 'SCODE',
    precision: 0.62,
    recall: 0.65,
    f1Score: 0.63,
    auroc: 0.74,
    auprc: 0.68,
    earlyPrecision: 0.58,
    runtime: 156.8,
    memoryUsage: 2560
  },
  {
    algorithmId: 'alg10',
    algorithmName: 'SCNS',
    precision: 0.67,
    recall: 0.64,
    f1Score: 0.65,
    auroc: 0.77,
    auprc: 0.70,
    earlyPrecision: 0.62,
    runtime: 285.4,
    memoryUsage: 3100
  },
  {
    algorithmId: 'alg11',
    algorithmName: 'LEAP',
    precision: 0.58,
    recall: 0.62,
    f1Score: 0.60,
    auroc: 0.71,
    auprc: 0.65,
    earlyPrecision: 0.54,
    runtime: 195.7,
    memoryUsage: 2400
  },
  {
    algorithmId: 'alg12',
    algorithmName: 'Arboreto',
    precision: 0.65,
    recall: 0.68,
    f1Score: 0.66,
    auroc: 0.76,
    auprc: 0.70,
    earlyPrecision: 0.61,
    runtime: 168.3,
    memoryUsage: 2450
  }
];

export const Jobs: Job[] = [
  {
    id: 'job1',
    datasetId: 'ds1',
    datasetName: 'hESC',
    algorithmId: 'alg3',
    algorithmName: 'GRNBoost2',
    status: 'completed',
    progress: 100,
    startTime: '2026-02-04T10:30:00',
    endTime: '2026-02-05T10:31:27'
  },
  {
    id: 'job2',
    datasetId: 'ds2',
    datasetName: 'mDC',
    algorithmId: 'alg1',
    algorithmName: 'GENIE3',
    status: 'running',
    progress: 67,
    startTime: '2026-02-02T11:15:00'
  },
  {
    id: 'job3',
    datasetId: 'ds3',
    datasetName: 'HSC',
    algorithmId: 'alg7',
    algorithmName: 'SCENIC',
    status: 'pending',
    progress: 0,
    startTime: '2026-01-30T11:30:00'
  },
  {
    id: 'job4',
    datasetId: 'ds4',
    datasetName: 'DREAM',
    algorithmId: 'alg2',
    algorithmName: 'PIDC',
    status: 'failed',
    progress: 45,
    startTime: '2026-02-01T09:45:00',
    endTime: '2026-02-05T09:50:12',
    error: 'Memory allocation failed: insufficient resources'
  }
];

export function getAUPRCDistributionData() {
  return PerformanceMetrics.map(m => ({
    name: m.algorithmName,
    auprc: m.auprc,
    auroc: m.auroc,
    f1Score: m.f1Score
  }));
}

export function getPRCurveData(algorithmId: string) {
  //   Precision-Recall curve data
  const points = [];
  for (let recall = 0; recall <= 1; recall += 0.1) {
    const precision = 0.8 - recall * 0.3 + Math.random() * 0.1;
    points.push({ recall: recall, precision: Math.max(0, Math.min(1, precision)) });
  }
  return points;
}

export function getROCCurveData(algorithmId: string) {
  //   ROC curve data
  const points = [];
  for (let fpr = 0; fpr <= 1; fpr += 0.1) {
    const tpr = fpr + 0.2 + Math.random() * 0.1;
    points.push({ fpr: fpr, tpr: Math.min(1, tpr) });
  }
  return points;
}

export const Datasets2: Dataset[] = [
  {
    id: 'dyn-BF',
    name: 'Dynamic BF',
    organism: 'Synthetic',
    type: 'synthetic',
    genes: 5,
    cells: 105,
    edges: 12,
    source: 'synthetic' as const,
    description: 'Synthetic bifurcating gene regulatory network dataset simulating a branching cellular trajectory.',
    lastUpdated: '2024-11-15',
    sparklineData: [34, 45, 52, 48, 61, 73, 68, 82, 91, 78]
  },
  {
    id: 'dyn-BFC',
    name: 'Dynamic BFC',
    organism: 'Synthetic',
    type: 'synthetic',
    genes: 9,
    cells: 125,
    edges: 18,
    source: 'synthetic' as const,
    description: 'Synthetic bifurcating-converging gene regulatory network dataset representing complex branching and merging dynamics.',
    lastUpdated: '2024-10-28',
    sparklineData: [28, 31, 39, 42, 38, 51, 58, 64, 59, 71]
  },
  {
    id: 'dyn-CY',
    name: 'Dynamic CY',
    organism: 'Synthetic',
    type: 'synthetic',
    genes: 5,
    cells: 110,
    edges: 6,
    source: 'synthetic' as const,
    lastUpdated: '2022-11-03',
    description: 'Synthetic cyclic gene regulatory network dataset with periodic trajectory structure.',
    sparklineData: [22, 35, 41, 48, 44, 59, 62, 71, 68, 75]
  },
  {
    id: 'dyn-LI',
    name: 'Dynamic LI',
    organism: 'Synthetic',
    type: 'synthetic',
    genes: 7,
    cells: 115,
    edges: 8,
    source: 'synthetic' as const,
    lastUpdated: '2024-09-22',
    description: 'Synthetic linear gene regulatory network dataset representing a sequential regulatory cascade.',
    sparklineData: [31, 38, 42, 49, 55, 62, 58, 69, 77, 82]
  },
  {
    id: 'GSD',
    name: 'GSD',
    organism: 'Human',
    type: 'curated',
    genes: 18,
    cells: 120,
    edges: 79,
    source: 'real' as const,
    lastUpdated: '2024-10-12',
    description: 'Curated Boolean model dataset representing the gene regulatory network underlying gonadal sex determination.',
    sparklineData: [19, 28, 34, 41, 48, 52, 59, 65, 71, 68]
  },
  {
    id: 'HSC',
    name: 'HSC',
    organism: 'Mouse',
    type: 'curated',
    genes: 11,
    cells: 110,
    edges: 30,
    source: 'real' as const,
    lastUpdated: '2024-09-05',
    description: 'Curated Boolean model dataset capturing the gene regulatory network of hematopoietic stem cell differentiation.”',
    sparklineData: [42, 51, 58, 62, 69, 75, 81, 88, 92, 89]
  }
];

export const allDatasets = [

  {
    id: 'GSD',
    name: 'GSD',
    organism: 'Human',
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
    organism: 'Mouse',
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
    organism: 'Mouse',
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
    organism: 'Mouse',
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


  {
    id: 'dyn-LL',
    name: 'Dynamic LL',
    organism: 'Synthetic',
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
    organism: 'Synthetic',
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
    organism: 'Synthetic',
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
    organism: 'Synthetic',
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
    organism: 'Synthetic',
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
    organism: 'Synthetic',
    type: 'synthetic',
    genes: 5,
    cells: 110,
    edges: 6,
    source: 'synthetic' as const,
    lastUpdated: '2022-11-03',
    sparklineData: [37, 41, 39, 40, 31, 43, 40, 41, 40, 41]
  },
];
