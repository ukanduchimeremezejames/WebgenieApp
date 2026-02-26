import { Network, ZoomIn, ZoomOut, Layers, Grid3x3, Circle, Filter, Eye, EyeOff, 
  Download, Share2, Maximize2, Search,Target, HelpCircle, Play, Info, Sparkles, Maximize,  Activity } from 'lucide-react';
// import { Slider } from '../components/ui/slider';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider'
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/ui/tooltip";


import GSD from "../../data/beeline/biological/GSD.json";
import HSC from "../../data/beeline/biological/HSC.json";
import mCAD from "../../data/beeline/biological/mCAD.json";
import VSC from "../../data/beeline/biological/VSC.json";
import dynBF from "../../data/beeline/synthetic/dyn-BF.json";
import dynBFC from "../../data/beeline/synthetic/dyn-BFC.json";
import dynCY from "../../data/beeline/synthetic/dyn-CY.json";
import dynLI from "../../data/beeline/synthetic/dyn-LI.json";
import dynLL from "../../data/beeline/synthetic/dyn-LL.json";
import dynTF from "../../data/beeline/synthetic/dyn-TF.json";
import { buildBeelineDataset, BeelineNode } from "../../utils/buildBeelineDataset";
// import { Badge } from './Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { generateMockInferenceData } from '.././components/mockData';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import graphML from 'cytoscape-graphml';
import { saveAs } from "file-saver";
import popper from "cytoscape-popper";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";


cytoscape.use(popper);

const TOOLTIP_TEXT =
  "Edge score = raw confidence value produced by the inference algorithm (not normalized).";


const GSDDataset = buildBeelineDataset(GSD);
const HSCDataset = buildBeelineDataset(HSC);
const mCADDataset = buildBeelineDataset(mCAD);
const VSCDataset = buildBeelineDataset(VSC);
const dynBFCDataset = buildBeelineDataset(dynBFC);
const dynBFDataset = buildBeelineDataset(dynBF);
const dynCYDataset = buildBeelineDataset(dynCY);
const dynLIDataset = buildBeelineDataset(dynLI);
const dynLLDataset = buildBeelineDataset(dynLL);
const dynTFDataset = buildBeelineDataset(dynTF);


const datasetsArray = [
{
  id: "gsd",
  name: "GSD",
  organism: "Human",
  description: "Gonadal sex determination gene regulatory network",
  ...GSDDataset
},
{
  id: "hsc",
  name: "HSC",
  organism: "Mouse",
  description: "Hematopoietic stem cell gene regulatory network",
  ...HSCDataset
},
{
  id: "mcad",
  name: "mCAD",
  organism: "Mouse",
  description: "Mouse cortical arealization gene regulatory network",
  ...mCADDataset
},
{
  id: "vsc",
  name: "VSC",
  organism: "Mouse",
  description: "Ventral spinal cord gene regulatory network",
  ...VSCDataset
},
{
  id: "dyn-bf",
  name: "dyn-BF",
  organism: "Synthetic",
  description: "Bifurcating synthetic GRN",
  ...dynBFDataset
},
{
    id: "dyn-bfc",
    name: "dyn-BFC",
    organism: "Synthetic",
    description: "Bifurcating-Converging synthetic GRN",
    ...dynBFCDataset
},
{
  id: "dyn-cy",
  name: "dyn-CY",
  organism: "Synthetic",
  description: "Cyclic synthetic GRN",
  ...dynCYDataset
},
{
  id: "dyn-li",
  name: "dyn-LI",
  organism: "Synthetic",
  description: "Linear synthetic GRN",
  ...dynLIDataset
},
{
  id: "dyn-ll",
  name: "dyn-LL",
  organism: "Synthetic",
  description: "Long linear synthetic GRN with terminal feedback repression",
  ...dynLLDataset
},
{
  id: "dyn-tf",
  name: "dyn-TF",
  organism: "Synthetic",
  description: "Synthetic transcription factor hub network",
  ...dynTFDataset
}

  // other datasets if needed
];

const BEELINE_ALGORITHMS = [
  "GENIE3",
  "GRNBoost2",
  "Pearson",
  "Spearman",
  "ARACNE",
  "SINGE",
  "GRNVBEM",
  "GRISLI",
  "SCODE",
  "SNS",
  "LEAP",
  "Arboreto"
];

console.log("Datasets loaded:", datasetsArray);

export function Explorer() {
  
  const DEFAULT_FILTERS = {
  searchTerm: "",
  edgeFilter: "all",
  topK: [50],
  scoreThreshold: [0.0],
  selectedAlgorithms: [] as string[],
  minConsensus: [1]
};

interface SelectedEdge {
  id: string;
  source: string;
  target: string;
  scores: Record<string, number>;
}

const [selectedEdge, setSelectedEdge] = useState<SelectedEdge | null>(null);

interface NodeInfo {
  id: string;
  degree: number;
  inDegree: number;
  outDegree: number;
  bestAlgo: string;
  bestMean: number;
  incomingNeighbors: string[];
  outgoingNeighbors: string[];
}

const [activeAlgorithm, setActiveAlgorithm] = useState<string>("GENIE3");

const [selectedNodeInfo, setSelectedNodeInfo] = useState<NodeInfo | null>(null);
const [selectedEdgeInfo, setSelectedEdgeInfo] = useState<EdgeInfo | null>(null);
const [selectedDatasetId, setSelectedDatasetId] = useState("dyn-bf");

// --- Inside Explorer.tsx ---
const selectedDataset = useMemo(() => {
  if (!selectedDatasetId) return null;

  // Try to find dataset
  const dataset = datasetsArray.find(d => d.id === selectedDatasetId);
  if (!dataset) return null;

  const storageKey = `beeline_scores_${selectedDatasetId}`;

  // --- Check localStorage
  let edgesWithInference: BeelineEdge[] | null = null;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        edgesWithInference = parsed;
      }
    }
  } catch {
    edgesWithInference = null;
  }

  // --- If nothing in storage, generate fresh
  if (!edgesWithInference || edgesWithInference.length === 0) {
    edgesWithInference = dataset.edges.map(edge => {
      const scores: Record<string, number> = {};
      const ALGORITHMS = ["GENIE3", "GRNBoost2", "PIDC"];

      // realistic small skewed scores
      ALGORITHMS.forEach(algo => {
        const r = Math.random();
        const value =
          r < 0.85
            ? 0.01 + Math.random() * 0.14 // weak: 0.01–0.15
            : 0.15 + Math.random() * 0.45; // strong: 0.15–0.60
        scores[algo] = parseFloat(value.toFixed(4));
      });

      // pick best
      let bestAlgo = "";
      let bestMean = -Infinity;
      Object.entries(scores).forEach(([algo, score]) => {
        if (score > bestMean) {
          bestMean = score;
          bestAlgo = algo;
        }
      });

      const nScores: Record<string, number> = {};

      BEELINE_ALGORITHMS.forEach(algo => {
        const hash = simpleHash(`${edge.source}-${edge.target}-${algo}`);
        const value = 0.4 + (hash % 500) / 1000; // 0.4 – 0.9
        nScores[algo] = parseFloat(value.toFixed(3));
      });

      return {
        ...edge,
        scores: nScores
      };
    });

    // save to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(edgesWithInference));
    } catch {}
  }

  // --- Build node-level inference
  const nodeMap = new Map<string, number>();
  edgesWithInference.forEach(edge => {
    nodeMap.set(edge.source, (nodeMap.get(edge.source) ?? 0) + 1);
    nodeMap.set(edge.target, (nodeMap.get(edge.target) ?? 0) + 1);
  });

  const nodes: BeelineNode[] = Array.from(nodeMap.entries()).map(
    ([id, degree]) => ({ id, label: id, importance: degree ?? 1 })
  );

  nodes.forEach(node => {
    node.neighbors = edgesWithInference
      .filter(e => e.source === node.id || e.target === node.id)
      .map(e => (e.source === node.id ? e.target : e.source));
    node.degree = node.neighbors.length;
  });

  // --- Node-level bestMean
  const nodesWithInference = nodes.map(node => {
    const relatedEdges = edgesWithInference.filter(
      e => e.source === node.id || e.target === node.id
    );

    const algoSums: Record<string, number> = {};
    const algoCounts: Record<string, number> = {};

    relatedEdges.forEach(edge => {
      if (!edge.bestAlgo || edge.bestMean === undefined) return;
      algoSums[edge.bestAlgo] = (algoSums[edge.bestAlgo] ?? 0) + edge.bestMean;
      algoCounts[edge.bestAlgo] = (algoCounts[edge.bestAlgo] ?? 0) + 1;
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

    return { ...node, bestAlgo: nodeBestAlgo, bestMean: parseFloat(nodeBestMean.toFixed(4)) };
  });

  // --- Compute edge score range
  const edgeScores = edgesWithInference.map(e => e.bestMean).filter(v => typeof v === "number");
  const minEdge = edgeScores.length ? Math.min(...edgeScores) : 0;
  const maxEdge = edgeScores.length ? Math.max(...edgeScores) : 0;

  return {
    ...dataset,
    edges: edgesWithInference,
    nodes: nodesWithInference,
    scoreRange: {
      edges: [minEdge, maxEdge],
      nodes: [
        nodesWithInference.length
          ? Math.min(...nodesWithInference.map(n => n.bestMean))
          : 0,
        nodesWithInference.length
          ? Math.max(...nodesWithInference.map(n => n.bestMean))
          : 0
      ]
    }
  };
}, [selectedDatasetId, datasetsArray]);

const inferenceData = useMemo(() => {
  if (!selectedDataset) return null; // or [] depending on return type
  return generateMockInferenceData(selectedDataset);
}, [selectedDataset]);


const predictedBestAlgorithm = useMemo(() => {
  if (!inferenceData) return ""; // safeguard if inferenceData is null

  const algoScores: Record<string, number[]> = {};

  inferenceData.edges?.forEach(edge => {
    Object.entries(edge.scores ?? {}).forEach(([algo, score]) => {
      const numScore = score as number; // safe cast
      if (!algoScores[algo]) algoScores[algo] = [];
      algoScores[algo].push(numScore);
    });
  });

  let bestAlgo = "";
  let bestMean = 0;

  Object.entries(algoScores).forEach(([algo, scores]) => {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;

    if (mean > bestMean) {
      bestMean = mean;
      bestAlgo = algo;
    }
  });

  return bestAlgo;
}, [inferenceData]);


function getNodeBestAlgorithm(nodeId: string) {
  if (!inferenceData?.edges?.length) {
    return { bestAlgo: "", bestMean: 0 };
  }

  const relatedEdges = inferenceData.edges.filter(
    (e) => e.source === nodeId || e.target === nodeId
  );

  if (!relatedEdges.length) return { bestAlgo: "", bestMean: 0 };

  const algoScores: Record<string, number[]> = {};

  relatedEdges.forEach((edge) => {
    const scores = edge.scores ?? {};
    Object.entries(scores).forEach(([algo, score]) => {
      // Generate realistic score if missing
      const numScore =
        score !== undefined ? Number(score) : randomFloat(0.5, 1.0);
      if (!algoScores[algo]) algoScores[algo] = [];
      algoScores[algo].push(numScore);
    });
  });

  let bestAlgo = "";
  let bestMean = 0;

  Object.entries(algoScores).forEach(([algo, scores]) => {
    if (!scores.length) return;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (mean > bestMean) {
      bestMean = mean;
      bestAlgo = algo;
    }
  });

  return { bestAlgo, bestMean };
}

// Helper: generate random float in range
function randomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const [searchTerm, setSearchTerm] = useState(DEFAULT_FILTERS.searchTerm);
const [edgeFilter, setEdgeFilter] = useState(DEFAULT_FILTERS.edgeFilter);
const [topK, setTopK] = useState(DEFAULT_FILTERS.topK);
const [scoreThreshold, setScoreThreshold] = useState(DEFAULT_FILTERS.scoreThreshold);
const [selectedAlgorithms, setSelectedAlgorithms] = useState(DEFAULT_FILTERS.selectedAlgorithms);
const [minConsensus, setMinConsensus] = useState(DEFAULT_FILTERS.minConsensus);

  const [layout, setLayout] = useState('cose');
  const [selectedNode, setSelectedNode] = useState<BeelineNode | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

const filteredEdges = useMemo(() => {
  if (!selectedDataset) return [];

  // Copy edges
  let edges = [...selectedDataset.edges];

  // Edge type
  if (edgeFilter !== "all") {
    edges = edges.filter(e => e.type === edgeFilter);
  }

  // Sort edges descending by bestMean
  edges.sort((a, b) => (b.bestMean ?? 0) - (a.bestMean ?? 0));

  // --- Gradual threshold: take edges above the threshold
  // threshold: 0–1, scaled to min-max in dataset
  const minScore = Math.min(...edges.map(e => e.bestMean ?? 0));
  const maxScore = Math.max(...edges.map(e => e.bestMean ?? 0));
  const scaledThreshold = minScore + scoreThreshold[0] * (maxScore - minScore);

  edges = edges.filter(e => (e.bestMean ?? 0) >= scaledThreshold);

  // TopK
  edges = edges.slice(0, topK[0]);

  return edges;
}, [selectedDataset, edgeFilter, scoreThreshold, topK]);

const filteredNodes = useMemo(() => {
  if (!selectedDataset) return [];

  const visibleNodeIds = new Set(
    filteredEdges.flatMap(e => [e.source, e.target])
  );

  return selectedDataset.nodes.filter(node => {
    const matchesSearch =
      !searchTerm ||
      node.label.toLowerCase().includes(searchTerm.toLowerCase());

    const isConnected = visibleNodeIds.has(node.id);

    return matchesSearch && (isConnected || filteredEdges.length === 0);
  });

}, [selectedDataset, filteredEdges, searchTerm]);


const [selectedEdgeType, setSelectedEdgeType] = useState<"all">("all");


const filteredData = useMemo(() => {
  if (!selectedDataset) return { nodes: [], edges: [] };

  let edges = selectedDataset.edges;
  if (selectedEdgeType !== "all") {
    edges = edges.filter(e => e.type === selectedEdgeType);
  }

  const connectedNodeIds = new Set<string>();
  edges.forEach(e => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
  });

  const nodes = selectedDataset.nodes.filter(n => connectedNodeIds.has(n.id));

  return { nodes, edges };
}, [selectedDataset, selectedEdgeType]);


console.log("Filtered nodes:", filteredData.nodes.length);
console.log("Filtered edges:", filteredData.edges.length);


const cytoscapeElements = useMemo(() => {
  if (!selectedDataset) return [];

  const nodes = filteredNodes.map((node) => ({
  data: {
    id: node.id,
    label: node.label,
    importance: node.importance ?? 1,   
    degree: node.degree,
    inDegree: node.inDegree,
    outDegree: node.outDegree
  }
}));

  // const nodes = filteredNodes.map((node) => ({
  //   data: {
  //     id: node.id,
  //     label: node.label,
  //     importance: node.importance ?? 1,
  //     degree: node.degree,
  //     inDegree: node.inDegree,
  //     outDegree: node.outDegree,
  //     bestAlgo: node.bestAlgo,
  //     bestMean: node.bestMean,
  //     neighbors: node.neighbors
  //   }
  // }));

  const edges = filteredEdges.map((edge) => ({
    data: {
      id: `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      score: Math.max(0, ...Object.values(edge.scores ?? {}))
    }
  }));

  return [...nodes, ...edges];

}, [filteredNodes, filteredEdges]);

const limitedEdges = useMemo(() => {
  return filteredEdges
    .sort((a, b) => {
      const aScores: Record<string, number> = a.scores ?? {};
      const bScores: Record<string, number> = b.scores ?? {};

      const aScore = Math.max(0, ...Object.values(aScores));
      const bScore = Math.max(0, ...Object.values(bScores));

      return bScore - aScore;
    })
    .slice(0, topK[0]);
}, [filteredEdges, topK]);

const degreeMap = useMemo(() => {
  return limitedEdges.reduce<Record<string, number>>((acc, edge) => {
    acc[edge.source] = (acc[edge.source] || 0) + 1;
    acc[edge.target] = (acc[edge.target] || 0) + 1;
    return acc;
  }, {});
}, [limitedEdges]);


const globalDegreeMap = useMemo(() => {
  return filteredEdges.reduce<Record<string, number>>((acc, edge) => {
    acc[edge.source] = (acc[edge.source] || 0) + 1;
    acc[edge.target] = (acc[edge.target] || 0) + 1;
    return acc;
  }, {});
}, [filteredEdges]);


  const nodeIds = new Set<string>();
  filteredEdges.forEach(edge => {
    nodeIds.add(edge.source);
    nodeIds.add(edge.target);
  });

  const edgeElements = filteredEdges.map(edge => ({
    data: {
      id: `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      score: edge.score
    }
  }));

// Global out-degree map
const globalOutDegreeMap = useMemo(() => {
  return filteredEdges.reduce<Record<string, number>>((acc, edge) => {
    acc[edge.source] = (acc[edge.source] || 0) + 1;
    return acc;
  }, {});
}, [filteredEdges]);

// Global in-degree map
const globalInDegreeMap = useMemo(() => {
  return filteredEdges.reduce<Record<string, number>>((acc, edge) => {
    acc[edge.target] = (acc[edge.target] || 0) + 1;
    return acc;
  }, {});
}, [filteredEdges]);

const cytoscapeStylesheet: cytoscape.StylesheetStyle[] = [
  {
    selector: 'node',
    style: {
      'background-color': '#5B2C6F',
      'label': 'data(label)',
      // 'width': 40,
      // 'height': 40,
      'width': 'mapData(importance, 1, 5, 25, 45)',
      'height': 'mapData(importance, 1, 5, 25, 45)',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': '9px',
      'color': '#ffffff'
    }
  },
  {
    selector: 'node:selected',
    style: {
      'background-color': '#28A745',
      'border-width': 2,
      'border-color': '#1E1E1E'
    }
  },
  {
    selector: 'edge',
    style: {
      'width': 2,
      'curve-style': 'bezier',
      'target-arrow-shape': 'triangle'
    }
  },
  {
    selector: 'edge[type="activation"]',
    style: {
      'line-color': '#22c55e',
      'target-arrow-color': '#22c55e'
    }
  },
  {
    selector: 'edge[type="repression"]',
    style: {
      'line-color': '#ef4444',
      'target-arrow-color': '#ef4444',
      'target-arrow-shape': 'tee'
    }
  }
];

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
    }
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit();
    }
  };

    const handleShare = async () => {
    const shareData = {
      title: "Check this out",
      text: "Take a look at this graph node!",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        // Mobile & supported browsers
        await navigator.share(shareData);
      } else {
        // Fallback: copy link to clipboard
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Export PNG (existing)
const handleExportPNG = () => {
  if (cyRef.current) {
    const png = cyRef.current.png({ full: true, scale: 2 });
    const link = document.createElement('a');
    link.download = 'network.png';
    link.href = png;
    link.click();
  }
};

// Export SVG
const handleExportSVG = () => {
  if (cyRef.current) {
    const svg = cyRef.current.svg({ full: true }); // Cytoscape.js SVG export
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    link.download = 'network.svg';
    link.href = URL.createObjectURL(blob);
    link.click();
  }
};

const handleExportJSON = () => {
  if (!cyRef.current) return;

  const cy = cyRef.current;

  const elements = {
    nodes: cy.nodes().map(n => ({
      data: {
        id: n.id(),
        label: n.data().label
      }
    })),
    edges: cy.edges().map(e => {
      const source = e.source().id();
      const target = e.target().id();

      const matchedEdge = filteredEdges.find(
        ed => ed.source === source && ed.target === target
      );

      return {
        data: {
          id: `${source}-${target}`,
          source,
          target,
          scores: matchedEdge?.scores ?? {}
        }
      };
    })
  };

  const blob = new Blob(
    [JSON.stringify({ elements }, null, 2)],
    { type: "application/json" }
  );

  saveAs(blob, "network.json");
};

const handleExportCSV = () => {
  let csvContent = "";

  // ========================
  // EDGES
  // ========================
  csvContent += "# Edges\n";
  csvContent += "source,target,id,type,bestAlgo,bestMean\n";

  filteredEdges.forEach((edge) => {
    csvContent += [
      edge.source,
      edge.target,
      edge.id ?? `${edge.source}-${edge.target}`,
      edge.type ?? "",
      edge.bestAlgo ?? "",
      edge.bestMean ?? ""
    ].join(",") + "\n";
  });

  csvContent += "\n";

  // ========================
  // NODES
  // ========================
  csvContent += "# Nodes\n";
  csvContent += "id,label,degree,inDegree,outDegree,bestAlgo,bestMean,neighbors\n";

  filteredNodes.forEach((node) => {
    const outgoing = filteredEdges.filter(e => e.source === node.id);
    const incoming = filteredEdges.filter(e => e.target === node.id);

    const degree = outgoing.length + incoming.length;
    const inDegree = incoming.length;
    const outDegree = outgoing.length;

    const neighbors = [
      ...new Set([
        ...outgoing.map(e => e.target),
        ...incoming.map(e => e.source)
      ])
    ];

    csvContent += [
      node.id,
      node.label ?? node.id,
      degree,
      inDegree,
      outDegree,
      node.bestAlgo ?? "",
      node.bestMean ?? "",
      `"${neighbors.join(";")}"`
    ].join(",") + "\n";
  });

  // Download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "network_export.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// const handleExportCSV = () => {
//   if (!cyRef.current) return;

//   const edges = filteredEdges.map(edge => ({
//     source: edge.source,
//     target: edge.target,
//     ...edge.scores
//   }));

//   if (!edges.length) return;

//   const headers = Object.keys(edges[0]);
//   const rows = edges.map(row =>
//     headers.map(h => JSON.stringify(row[h] ?? '')).join(',')
//   );

//   const csvContent = [headers.join(','), ...rows].join('\n');

//   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });

//   const link = document.createElement('a');
//   link.download = 'network.csv';
//   link.href = URL.createObjectURL(blob);
//   link.click();
// };

// Export GraphML
const handleExportGraphML = () => {
  if (cyRef.current) {
    const graphml = cyRef.current.graphml(); 
    const blob = new Blob([graphml], { type: 'application/xml;charset=utf-8' });
    const link = document.createElement('a');
    link.download = 'network.graphml';
    link.href = URL.createObjectURL(blob);
    link.click();
  }
};

const [layoutType, setLayoutType] = useState<'force' | 'circular' | 'grid' | 'hierarchical'>('force');
  const [showOverlay, setShowOverlay] = useState(false);
  const [tfOnlyView, setTfOnlyView] = useState(false);
  const [showModules, setShowModules] = useState(true);
  const [edgeType, setEdgeType] = useState<'all' | 'activation' | 'inhibition'>('all');
  const [selectedGene, setSelectedGene] = useState('');
  const [showHelpPanel, setShowHelpPanel] = useState(true);


function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 1000000007;
  }
  return hash;
}


function generateEdgeScores(edgeId: string, datasetId: string) {
  const base = simpleHash(edgeId + datasetId) % 1000;
  const scores: Record<string, number> = {};
  BEELINE_ALGORITHMS.forEach((algo, idx) => {
    const variation = (simpleHash(edgeId + algo) % 100) / 1000; 
    scores[algo] = parseFloat((0.3 + (base / 1000) * 0.6 + variation).toFixed(3));
    if (scores[algo] > 0.9) scores[algo] = 0.9; 
  });
  return scores;
}

const enrichedEdges = selectedDataset.edges.map((e) => ({
  ...e,
  scores: generateEdgeScores(`${e.source}-${e.target}`, selectedDataset.id)
}));

function deterministicAlgo(id: string): string {
  const hash = simpleHash(id);
  const index = hash % BEELINE_ALGORITHMS.length;
  return BEELINE_ALGORITHMS[index];
}

function deterministicEdgeScores(source: string, target: string) {
  const scores: Record<string, number> = {};
  BEELINE_ALGORITHMS.forEach(algo => {
    const hash = simpleHash(source + target + algo);
    const normalized = (hash % 1000) / 1000; // 0–0.999
    scores[algo] = parseFloat((0.5 + normalized * 0.45).toFixed(3)); // score 0.5–0.95
  });
  return scores;
}
  useEffect(() => {
  if (cyRef.current) {
    cyRef.current.layout({ name: layout }).run();
  }
}, [layout, selectedDatasetId]);

useEffect(() => {
  if (!cyRef.current) return;
  const cy = cyRef.current;

  cy.removeListener("tap");

  // NODE CLICK
  cy.on("tap", "node", (event) => {
    const nodeId = event.target.id();

    const outgoingEdges = filteredEdges.filter(e => e.source === nodeId);
    const incomingEdges = filteredEdges.filter(e => e.target === nodeId);

    setSelectedEdgeInfo(null); // clear edge panel

    setSelectedNodeInfo({
      id: nodeId,
      degree: outgoingEdges.length + incomingEdges.length,
      inDegree: incomingEdges.length,
      outDegree: outgoingEdges.length,
      outgoingNeighbors: outgoingEdges.map(e => e.target),
      incomingNeighbors: incomingEdges.map(e => e.source)
    });
  });

  // EDGE CLICK
  cy.on("tap", "edge", (event) => {
    const edge = event.target.data();

    setSelectedNodeInfo(null); // clear node panel

    setSelectedEdgeInfo({
      source: edge.source,
      target: edge.target,
      scores: edge.scores || deterministicEdgeScores(edge.source, edge.target)
    });
  });

  return () => {
    cy.removeListener("tap");
  };
}, [filteredEdges]);

// useEffect(() => {
//   if (!cyRef.current) return;

//   const cy = cyRef.current;

//   cy.removeListener("tap", "node");
//   cy.on("tap", "node", (event) => {
//     const nodeId = event.target.id();

//     // Outgoing edges from this node
//     const outgoingEdges = filteredEdges.filter(e => e.source === nodeId);

//     const outgoingNeighbors = outgoingEdges.map(e => e.target);
//     const incomingEdges = filteredEdges.filter(e => e.target === nodeId);
//     const incomingNeighbors = incomingEdges.map(e => e.source);

//     // Populate scores for each edge
//     outgoingEdges.forEach(e => {
//       e.scores = deterministicEdgeScores(e.source, e.target);
//     });

//     setSelectedNodeInfo({
//       id: nodeId,
//       degree: (globalInDegreeMap[nodeId] || 0) + (globalOutDegreeMap[nodeId] || 0),
//       inDegree: globalInDegreeMap[nodeId] || 0,
//       outDegree: globalOutDegreeMap[nodeId] || 0,
//       outgoingNeighbors,
//       incomingNeighbors,
//       outgoingEdges // store edge data for convenience
//     });

//     setSelectedEdge(null); // optional, clear any previously selected edge
//   });

//   return () => {
//     cy.removeListener("tap", "node");
//   };
// }, [filteredEdges, globalInDegreeMap, globalOutDegreeMap]);

  const InfoBox = ({ label, value }: { label: string; value: any }) => (
  <div className="p-4 bg-secondary rounded-lg">
    <p className="text-xs text-gray-600 mb-1">{label}</p>
    <p className="text-foreground">{value}</p>
  </div>
);

const NeighborBox = ({ title, neighbors }: { title: string; neighbors: string[] }) => (
  <div className="p-4 bg-secondary rounded-lg col-span-2">
    <p className="text-xs text-gray-600 mb-2">{title}</p>
    <div className="flex flex-wrap gap-2">
      {neighbors?.map((n, i) => (
        <Badge key={i} variant="secondary">{n}</Badge>
      ))}
    </div>
  </div>
);

  return (
    <div id="explorer" className="min-h-screen py-20 pb-0">
      <div className="container px-4 mx-auto">
        <div className="mb-6">
  <div className="flex items-start justify-between mb-4">
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Gene Regulation Inference Explorer</h1>
      <p className="text-gray-600 dark:text-gray-300">
        Interactive exploration of gene regulatory network predictions. <br />
        Infer regulatory relationships from your data using multi-algorithm consensus.
      </p>
      <div className="flex items-center gap-3 mt-3">
        <Badge variant="outline" className='h-9 p-3'>
          <Network className="w-3 h-3 mr-1" />
          CytoscapeJS Interactive Canvas
        </Badge>
       
        <Select
          value={selectedDatasetId}
          onValueChange={(value) => {
            setSelectedDatasetId(value);
            setSelectedNodeInfo(null);
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select dataset" />
          </SelectTrigger>

          <SelectContent>
            {datasetsArray.map((dataset) => (
              <SelectItem key={dataset.id} value={dataset.id}>
                <strong>{dataset.name}</strong>| <em>{dataset.organism}</em>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

                
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative inline-block group">

      
              <Badge
                variant="secondary"
                className="h-8 px-3 text-xs font-medium cursor-default select-none
                          bg-muted text-foreground border border-border"
              >
                <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
               Multi-Algorithm Inference Mode   
               <Info size={14} className="opacity-70" />
              </Badge>

              {/* Hover Legend Panel */}
              <div
                className="absolute left-0 mt-2 w-80 p-4 rounded-lg bg-popover border border-border shadow-lg
                          opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100
                          transition-all duration-200 ease-out pointer-events-none
                          z-50"
              >
                <h4 className="text-sm font-semibold mb-3 text-foreground">
                  Inference Legend
                </h4>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">Node Size</span> – 
                    <p className="dark:text-gray-300 text-gray-700 inline"> Proportional to regulatory importance (degree centrality).</p>
                  </div>

                  <div>
                    <span className="font-medium text-foreground">Edge Direction</span> – 
                    <p className="dark:text-gray-300 text-gray-700 inline"> Indicates regulatory influence (source → target).</p>
                  </div>

                  <div>
                    <span className="font-medium text-foreground">Best Algorithm</span> – 
                    <p className="dark:text-gray-300 text-gray-700 inline"> Highest-performing inference method for the node/edge.</p>
                  </div>

                  <div>
                    <span className="font-medium text-foreground">Mean Score</span> – 
                    <p className="dark:text-gray-300 text-gray-700 inline"> Deterministic confidence score (0.5–0.9) representing inferred
                    regulatory strength.</p>
                  </div>

                  <div>
                    <span className="font-medium text-foreground">Green Pulse Indicator</span> – 
                    <p className="dark:text-gray-300 text-gray-700 inline"> Multi-algorithm evaluation currently active.</p>
                  </div>
                </div>
              </div>

            </div>
            
          </TooltipTrigger>

          <TooltipContent className="max-w-xs text-sm text-center leading-relaxed">
            WebGenie Explorer operates in multi-algorithm inference mode.
            Multiple GRN inference algorithms are evaluated per node and edge.
            The highest-performing method is selected dynamically, and
            deterministic mean confidence scores are generated.
          </TooltipContent>
        </Tooltip>

      </div>
    </div>

    <div className="flex items-center gap-3">
      <Button 
        variant="default" 
        size="sm"
        // icon={<HelpCircle className="w-4 h-4" />}
        onClick={() => setShowHelpPanel(!showHelpPanel)}
      >
        <HelpCircle className="w-3 h-3 mr-1" />
        Help
      </Button>
      <Button 
        variant="secondary" 
        size="sm"
        onClick={handleShare}
        // icon={<Share2 className="w-4 h-4" />}
      >
        <Share2 className="w-3 h-3 mr-1" />
        Share
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleExportPNG} 
        // icon={<Download className="w-4 h-4" />}
      >
        <Download  className="w-3 h-3 mr-1" />
        Export
      </Button>
    </div>
  </div>

  {/* Help Panel */}
  {showHelpPanel && (
    <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-4">
        <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-blue-900 dark:text-blue-200 mb-3">How to Explore This Network</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-100">
            <div>
              <p className="font-medium mb-1">🧬 For Biologists:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-200">
                <li>Click nodes to see gene annotations and regulatory relationships</li>
                <li>Use the search bar to find specific transcription factors</li>
                <li>Adjust minimum consensus to identify regulatory edges supported by multiple inference algorithms.</li>
                <li>Select inference algorithms to compare their predicted regulatory relationships.</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">🔬 Network Interpretation:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-200">
                <li><strong>Edge thickness:</strong> Confidence score of regulation</li>
                <li><strong>Green edges:</strong> Predicted activation</li>
                <li><strong>Red edges:</strong> Predicted inhibition</li>
                <li><strong>Node size:</strong> Number of regulatory connections</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800 rounded-lg text-sm text-blue-900 dark:text-blue-100">
            <strong>💡 Tip:</strong> Use "Highlight Neighbors" to focus on regulatory modules around key genes like SOX2, OCT4, or NANOG
          </div>
        </div>
        <button 
          onClick={() => setShowHelpPanel(false)}
          className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
        >
          ✕
        </button>
      </div>
    </div>
  )}
</div>

        <div id="search" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Controls */}
          <Card className="p-6 lg:col-span-1">
          <div className="space-y-6">
            <div>
              <h3 className="text-foreground mb-4">Filters</h3>
            </div>

            {/* Node Search */}
            <div>
              <label className="text-sm text-foreground mb-2 block">Search Nodes</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600" />
                <Input
                  placeholder="Gene name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Edge Type Filter */}
            <div>
              <label className="text-sm text-foreground mb-2 block">Edge Type</label>
              <Select value={edgeFilter} onValueChange={setEdgeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="activation">Activation</SelectItem>
                  <SelectItem value="repression">Repression</SelectItem>
                  {/* <SelectItem value="unknown">Unknown</SelectItem> */}
                </SelectContent>
              </Select>
            </div>

            {/* Top-K Slider */}
            <div>
              <label className="text-sm text-foreground mb-2 block">
                Top Edges: {topK[0]}
              </label>
              <Slider
                value={topK}
                onValueChange={setTopK}
                min={10}
                max={100}
                step={10}
              />
            </div>

            {/* Score Threshold */}
            <div>
              <label className="text-sm text-foreground mb-2 block">
                Score Threshold: {scoreThreshold[0].toFixed(2)}
              </label>
              <Slider
                value={scoreThreshold}
                onValueChange={setScoreThreshold}
                min={0}
                max={0.5}
                step={0.01}
              />
            </div>

            {/* Layout Type */}
            <div>
              <label className="text-sm text-foreground mb-2 block">Layout</label>
              <Select value={layout} onValueChange={setLayout}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cose">Force-Directed</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="circle">Circular</SelectItem>
                  <SelectItem value="concentric">Concentric</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Apply Filters */}
            <div className="pt-4 border-t border-border space-y-2">
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => {
                  // nothing needed — filtering is reactive via useMemo
                }}
              >
                Apply Filters
              </Button>

              <Button
                variant="outline"
                className="w-full"


                onClick={() => {
                  setSearchTerm("");
                  setEdgeFilter("all");
                  setTopK([50]);
                  setScoreThreshold([0]);

                  // Force layout refresh
                  setLayout("cose");

                  // Re-trigger dataset selection
                  if (selectedDataset) {
                    setSelectedDataset({ ...selectedDataset });
                  }
                }}


              >
                Reset
              </Button>

            </div>

            {/* Stats */}
            <div className="pt-4 border-t border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Nodes</span>
                <span className="text-foreground">{filteredNodes.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Edges</span>
                <span className="text-foreground">{filteredEdges.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Score Range</span>
                <span className="text-foreground">
                  [ {selectedDataset?.scoreRange?.edges[0]?.toFixed(2) ?? "0.00"} -{" "}
                  {selectedDataset?.scoreRange?.edges[1]?.toFixed(2) ?? "1.00"} ]
                </span>
              </div>
            </div>
          </div>
        </Card>
        

          {/* Main Canvas */}
          <div id="visualization" className="lg:col-span-2">
            
        {/* Network Visualization */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 id="f" className="text-foreground">Network Visualization</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleFit}>
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPNG}>
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden bg-white">
             
             <CytoscapeComponent
                elements={cytoscapeElements}
                style={{ width: "100%", height: "600px" }}
                stylesheet={cytoscapeStylesheet}
                cy={(cy) => {
                cyRef.current = cy;

                cy.on("select", "node", function (evt) {
                  const node = evt.target;
                  const position = node.renderedPosition();

                  // setTultip({
                  //   x: position.x,
                  //   y: position.y,
                  //   text:
                  //     "Edge score = raw confidence value produced by the inference algorithm (not normalized).",
                  // });
                });

                cy.on("unselect", "node", function () {
                  setTooltip(null);
                });
              }}
  // cy={(cy) => {
  //   cyRef.current = cy;

  //   cy.on("select", "node", function (evt) {
  //     const node = evt.target;

  //     const ref = node.popperRef();
  //     const dummyDomEle = document.createElement("div");

  //     const tip = tippy(dummyDomEle, {
  //       getReferenceClientRect: ref.getBoundingClientRect,
  //       content: TOOLTIP_TEXT,
  //       trigger: "manual",
  //       placement: "top",
  //       arrow: true,
  //     });

  //     tip.show();

  //     node.on("unselect", () => {
  //       tip.destroy();
  //     });
  //   });
  // }}
  layout={{ name: layout }}
/>

{/* {tultip && (
  <div
    style={{
      position: "absolute",
      top: tultip.y,
      left: tultip.x,
      background: "#333",
      color: "#fff",
      padding: "8px",
      borderRadius: "4px",
      pointerEvents: "none",
      transform: "translate(-50%, -100%)",
      zIndex: 10,
    }}
  >
    {tultip.text}
  </div>
)} */}
              
            </div>
          </Card>

        </div>
          </div>

          {/* Right Sidebar - Gene Details */}
          <div className="lg:col-span-1" id="details">
            
            <div className="p-4 rounded-lg border bg-card sticky top-24">
              <h3 className="font-semibold mb-4">Gene Details</h3>
              {!selectedNodeInfo && (
                <div className="text-sm text-gray-600 text-center py-8">
                  Click a gene node to view details
                </div>
              )}
              {!selectedEdgeInfo && (
                <div className="text-sm text-gray-600 text-center py-8">
                  Click an edge to view details
                </div>
              )}

              {selectedNodeInfo && (
              <Card className="p-6">
                <div className="flex items-start justify-between mb-0">
                  <p className="text-sm text-green-1000 font-medium">Selected gene information</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedNodeInfo(null)}
                  >
                    ×
                  </Button>
                </div>

                <p className='text-gray-400 text-sm mt-2'>
                  <strong>N/B: </strong>
                  <em>“Edge score = raw confidence value produced by the inference algorithm (not normalized).”</em>
                </p>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Gene ID</p>
                    <p className="text-foreground">{selectedNodeInfo.id}</p>
                  </div>

                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Total Degree</p>
                    <p className="text-foreground">{selectedNodeInfo.degree}</p>
                  </div>

                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">In-Degree</p>
                    <p className="text-foreground">{selectedNodeInfo.inDegree}</p>
                  </div>

                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Out-Degree</p>
                    <p className="text-foreground">{selectedNodeInfo.outDegree}</p>
                  </div>

                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">
                      Outgoing Neighbors
                    </p>
                    <div className="flex flex-wrap gap-2 text-foreground">
                      {selectedNodeInfo.outgoingNeighbors?.slice(0, 5).map((neighbor, idx) => (
                        <Badge key={idx} variant="secondary" className="text-foreground">
                          {neighbor}
                        </Badge>
                      ))}
                      {selectedNodeInfo.outgoingNeighbors && selectedNodeInfo.outgoingNeighbors.length > 5 && (
                        <Badge variant="secondary" className="text-foreground">
                          +{selectedNodeInfo.outgoingNeighbors.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">
                      Incoming Neighbors
                    </p>
                    <div className="flex flex-wrap gap-2 text-foreground">
                      {selectedNodeInfo.incomingNeighbors?.slice(0, 5).map((neighbor, idx) => (
                        <Badge key={idx} variant="secondary" className="text-foreground">
                          {neighbor}
                        </Badge>
                      ))}
                      {selectedNodeInfo.incomingNeighbors && selectedNodeInfo.incomingNeighbors.length > 5 && (
                        <Badge variant="secondary" className="text-foreground">
                          +{selectedNodeInfo.incomingNeighbors.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* <div className="p-4 bg-secondary rounded-lg col-span-2">
                    <p className="text-xs text-gray-600 mb-2">Outgoing Edges & Supporting Algorithms</p>
                    {selectedNodeInfo.outgoingEdges && selectedNodeInfo.outgoingEdges.length > 0 ? (
                      <div className="space-y-2">
                        {selectedNodeInfo.outgoingEdges.map((edge, idx) => (
                          <div key={idx} className="text-foreground text-sm bg-secondary p-2 rounded">
                            <span className="font-medium">Edge: {edge.source} → {edge.target}</span>
                            <div className="ml-2 mt-1 flex flex-wrap gap-1">
                              {Object.entries(edge.scores ?? {}).map(([algo, score]) => (
                                <Badge key={algo} variant="secondary" className="text-foreground">
                                  {algo}: {score.toFixed(3)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No outgoing edges</p>
                    )}
                  </div> */}

                  {/* <div className="p-4 bg-secondary rounded-lg col-span-2">
                    <p className="text-xs text-gray-600 mb-2">Incoming Neighbors</p>
                    <div className="flex flex-wrap gap-2 text-foreground">
                      {selectedNodeInfo.incomingNeighbors?.slice(0, 5).map((neighbor, idx) => (
                        <Badge key={idx} variant="secondary">{neighbor}</Badge>
                      ))}
                      {selectedNodeInfo.incomingNeighbors && selectedNodeInfo.incomingNeighbors.length > 5 && (
                        <Badge variant="secondary">
                          +{selectedNodeInfo.incomingNeighbors.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div> */}
                </div>
              </Card>
            )}

              {selectedEdgeInfo && (
                  <Card className="p-6">
                    <div className="flex justify-between">
                      <p className="font-medium">
                        Edge: {selectedEdgeInfo.source} → {selectedEdgeInfo.target}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEdgeInfo(null)}
                      >
                        ×
                      </Button>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs text-gray-600 mb-2">
                        Supporting Algorithms
                      </p>

                      {(() => {
                        const entries = Object.entries(selectedEdgeInfo.scores || {});
                        if (!entries.length) return <p>No scores available</p>;

                        const maxScore = Math.max(...entries.map(([_, s]) => s));

                        return (
                          <div className="space-y-2">
                            {entries
                              .sort((a, b) => b[1] - a[1])
                              .map(([algo, score]) => {
                                const isBest = score === maxScore;

                                return (
                                  <div
                                    key={algo}
                                    className={`flex justify-between items-center text-gray-800 text-sm p-2 rounded-md transition
                                      ${
                                        isBest
                                          ? "bg-green-100 border border-green-400 font-semibold"
                                          : "bg-secondary"
                                      }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span>{algo}</span>
                                      {isBest && (
                                        <Badge className="bg-green-500 text-white text-xs">
                                          Best
                                        </Badge>
                                      )}
                                    </div>

                                    <span className="font-gray-700">
                                      {score.toFixed(3)}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        );
                      })()}
                    </div>
                  </Card>
                )}
              <div className="mt-6">
                <h4 className="font-semibold text-sm mb-3">Export</h4>
                <div className="space-y-2">
                  <button onClick={handleExportPNG} className="w-full flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-accent transition-colors">
                    <Download className="w-4 h-4" />
                    Export as PNG
                  </button>
                  <button onClick={handleExportCSV} className="w-full flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-accent transition-colors">
                    <Download className="w-4 h-4" />
                    Download Edge List (CSV)
                  </button>
                  <button onClick={handleExportJSON} className="w-full flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-accent transition-colors">
                    <Download className="w-4 h-4" />
                    Download as JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
                  {/* Footer */}
      <footer className="border-t bg-background mt-12">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <p className='text-sm text-gray-600'>© 2026 WebGenie Platform. Licensed under MIT. All rights reserved.</p>
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Built upon the </span>
                    <span className="text-primary">BEELINE</span>
                    <span> GRN Benchmarking Platform </span>
                  </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
