
export interface BeelineEdge {
  source: string;
  target: string;
  type: "activation" | "repression";
  bestAlgo?: string;
  bestMean?: number;
}

export interface BeelineNode {
  id: string;
  label: string;
  importance: number;
  inDegree?: number;
  outDegree?: number;
  degree?: number;
  neighbors?: string[];
  bestAlgo?: string;
  bestMean?: number;
}



function getStorageKey(datasetId: string) {
  return `beeline_inference_${datasetId}`;
}
const ALGORITHMS = ["GENIE3", "GRNBoost2", "PIDC"];

function InferenceScore(): number {
  const r = Math.random();

  // 85% weak edges, 15% stronger edges
  const value =
    r < 0.85
      ? Math.pow(Math.random(), 4) * 0.2       // mostly 0.000–0.2
      : 0.2 + Math.pow(Math.random(), 2) * 0.8; // rare strong edges

  return parseFloat(value.toFixed(4));
}

function addRandomInferenceToEdges(edges: BeelineEdge[]): BeelineEdge[] {
  return edges.map(edge => {
    const scores: Record<string, number> = {};

    ALGORITHMS.forEach(algo => {
      scores[algo] = InferenceScore();
    });

    let bestAlgo = "";
    let bestMean = -Infinity;

    Object.entries(scores).forEach(([algo, score]) => {
      if (score > bestMean) {
        bestMean = score;
        bestAlgo = algo;
      }
    });

    return {
      ...edge,
      bestAlgo,
      bestMean: parseFloat(bestMean.toFixed(4))
    };
  });
}

function addNodeInference(
  nodes: BeelineNode[],
  edges: BeelineEdge[]
): BeelineNode[] {
  return nodes.map(node => {
    const relatedEdges = edges.filter(
      e => e.source === node.id || e.target === node.id
    );

    const algoSums: Record<string, number> = {};
    const algoCounts: Record<string, number> = {};

    relatedEdges.forEach(edge => {
      if (!edge.bestAlgo || edge.bestMean === undefined) return;

      algoSums[edge.bestAlgo] =
        (algoSums[edge.bestAlgo] ?? 0) + edge.bestMean;

      algoCounts[edge.bestAlgo] =
        (algoCounts[edge.bestAlgo] ?? 0) + 1;
    });

    let nodeBestAlgo = "";
    let nodeBestMean = 0;

    Object.keys(algoSums).forEach(algo => {
      const mean = algoSums[algo] / algoCounts[algo];
      if (mean > nodeBestMean) {
        nodeBestMean = mean;
        nodeBestAlgo = algo;
      }
    });

    return {
      ...node,
      bestAlgo: nodeBestAlgo,
      bestMean: parseFloat(nodeBestMean.toFixed(4))
    };
  });
}

export function BeelineDataset(edges: BeelineEdge[]) {
  const nodeMap = new Map<string, number>();

  edges.forEach(edge => {
    nodeMap.set(edge.source, (nodeMap.get(edge.source) ?? 0) + 1);
    nodeMap.set(edge.target, (nodeMap.get(edge.target) ?? 0) + 1);
  });

  const nodes: BeelineNode[] = Array.from(nodeMap.entries()).map(
    ([id, degree]) => ({
      id,
      label: id,
      importance: degree ?? 1
    })
  );

// --- Add neighbors & degree + in/out degree
nodes.forEach(node => {
  // Neighbors (undirected)
  node.neighbors = edges
    .filter(e => e.source === node.id || e.target === node.id)
    .map(e => (e.source === node.id ? e.target : e.source));

  // Degrees
  node.outDegree = edges.filter(e => e.source === node.id).length;
  node.inDegree = edges.filter(e => e.target === node.id).length;
  node.degree = node.inDegree + node.outDegree;
});

  // --- Add inference to edges
  const edgesWithInference = addRandomInferenceToEdges(edges);

  // --- Compute edge score range from bestMean
  const edgeScores = edgesWithInference
    .map(e => e.bestMean)
    .filter((v): v is number => v !== undefined);

  const minEdgeScore = edgeScores.length
    ? Math.min(...edgeScores)
    : 0;

  const maxEdgeScore = edgeScores.length
    ? Math.max(...edgeScores)
    : 0;

  // --- Add node-level inference
  const nodesWithInference = addNodeInference(
    nodes,
    edgesWithInference
  );

  // --- Compute node score range
  const nodeScores = nodesWithInference
    .map(n => n.bestMean)
    .filter((v): v is number => v !== undefined);

  const minNodeScore = nodeScores.length
    ? Math.min(...nodeScores)
    : 0;

  const maxNodeScore = nodeScores.length
    ? Math.max(...nodeScores)
    : 0;

  return {
    nodes: nodesWithInference,
    edges: edgesWithInference,
    scoreRange: {
      edges: [
        parseFloat(minEdgeScore.toFixed(4)),
        parseFloat(maxEdgeScore.toFixed(4))
      ],
      nodes: [
        parseFloat(minNodeScore.toFixed(4)),
        parseFloat(maxNodeScore.toFixed(4))
      ]
    }
  };
}

