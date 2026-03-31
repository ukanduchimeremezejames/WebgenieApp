
import { useState, useMemo } from "react";
import { louvain } from "graphology-communities-louvain";

export interface EdgeData {
  source: string;
  target: string;
  algorithms: Record<string, number>; // algorithm -> score
}

interface UseConsensusGRNProps {
  edges: EdgeData[];
  selectedAlgorithms: string[];
  minSupport?: number; // k edges supported by ≥k algorithms
}

export function useConsensusGRN({ edges, selectedAlgorithms, minSupport = 2 }: UseConsensusGRNProps) {
  const [thresholdScore, setThresholdScore] = useState(0);

  const filteredEdges = useMemo(() => {
    return edges.filter((edge) => {
      const supportedAlgos = Object.keys(edge.algorithms).filter((algo) =>
        selectedAlgorithms.includes(algo)
      );
      const supportCount = supportedAlgos.length;
      const passesSupport = supportCount >= minSupport;
      const passesScore = supportedAlgos.every((algo) => edge.algorithms[algo] >= thresholdScore);
      return passesSupport && passesScore;
    });
  }, [edges, selectedAlgorithms, minSupport, thresholdScore]);


  const nodeDegrees = useMemo(() => {
    const map: Record<string, number> = {};
    filteredEdges.forEach((edge) => {
      map[edge.source] = (map[edge.source] || 0) + 1;
      map[edge.target] = (map[edge.target] || 0) + 1;
    });
    return map;
  }, [filteredEdges]);

  // Louvain clustering for nodes
  const clusters = useMemo(() => {
    try {
      // Convert filteredEdges to graphology format
      const Graph = require("graphology");
      const g = new Graph();
      filteredEdges.forEach((edge) => {
        if (!g.hasNode(edge.source)) g.addNode(edge.source);
        if (!g.hasNode(edge.target)) g.addNode(edge.target);
        g.addEdge(edge.source, edge.target);
      });
      return louvain.assign(g); // Returns node -> community mapping
    } catch (err) {
      console.error("Louvain clustering failed", err);
      return {};
    }
  }, [filteredEdges]);

  return { filteredEdges, nodeDegrees, clusters, thresholdScore, setThresholdScore };
}
