// import { FileDown, X } from 'lucide-react';
import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Download, FileDown, X, Activity } from 'lucide-react';
import { mockAlgorithms, mockPerformanceMetrics, getPRCurveData, getROCCurveData } from '.././components/mockData';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const downloadRocGraph = async () => {
  const chartContainer = document.querySelector('.roc-chart-container .recharts-wrapper');
  if (!chartContainer) return;

  const scale = 3; 

  const canvas = await html2canvas(chartContainer, {
    scale,
    useCORS: true,
    backgroundColor: null,
    logging: false,
    allowTaint: true
  });

  const dataURL = canvas.toDataURL('image/png', 1.0);
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'roc-curve-hd.png';
  link.click();
};


const downloadPrcGraph = async () => {
  const chartContainer = document.querySelector('.prc-chart-container .recharts-wrapper');
  if (!chartContainer) return;

  const scale = 3; 

  const canvas = await html2canvas(chartContainer, {
    scale,
    useCORS: true,
    backgroundColor: null, 
    logging: false,
    allowTaint: true
  });

  const dataURL = canvas.toDataURL('image/png', 1.0);
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'precision-recall-curve-hd.png';
  link.click();
};


const exportCSV = (metrics) => {
  const header = [
    "Algorithm",
    "Precision",
    "Recall",
    "F1 Score",
    "AUROC",
    "AUPRC",
    "Early Precision",
    "Runtime (s)",
    "Memory (MB)"
  ];

  const rows = metrics.map((m) => [
    m.algorithmName,
    m.precision.toFixed(3),
    m.recall.toFixed(3),
    m.f1Score.toFixed(3),
    m.auroc.toFixed(3),
    m.auprc.toFixed(3),
    m.earlyPrecision.toFixed(3),
    m.runtime.toFixed(1),
    m.memoryUsage.toLocaleString(),
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [header, ...rows].map((e) => e.join(",")).join("\n");

  const link = document.createElement("a");
  link.href = encodeURI(csvContent);
  link.download = "performance_metrics.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const exportPDF = (metrics) => {
  const doc = new jsPDF();

  const tableColumn = [
    "Algorithm",
    "Precision",
    "Recall",
    "F1",
    "AUROC",
    "AUPRC",
    "Early Prec",
    "Runtime",
    "Memory MB",
  ];

  const tableRows = metrics.map((m) => [
    m.algorithmName,
    m.precision.toFixed(3),
    m.recall.toFixed(3),
    m.f1Score.toFixed(3),
    m.auroc.toFixed(3),
    m.auprc.toFixed(3),
    m.earlyPrecision.toFixed(3),
    m.runtime.toFixed(1),
    m.memoryUsage.toLocaleString(),
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    styles: { fontSize: 8 },
    theme: "grid",
  });

  doc.save("performance_metrics.pdf");
};

const algorithms = [

  { name: 'GENIE3',       color: '#A970FF', selected: true },
  { name: 'SCODE',        color: '#60a5fa', selected: true },
  { name: 'GRNVBEM',  color: '#f59e0b', selected: true },
  { name: 'PIDC',         color: '#ef4444', selected: false },
  { name: 'GRNBoost2',    color: '#10b981', selected: false },
  { name: 'SCENIC',       color: '#8b5cf6', selected: false },

  { name: 'ARBORETO',    color: '#e11d48', selected: true },
  { name: 'SCNS',         color: '#f87171', selected: false },
  { name: 'LEAP',      color: '#fb923c', selected: false },
  { name: 'GRNVBEM',     color: '#facc15', selected: false },
  { name: 'ARACNE',       color: '#a3e635', selected: false },
  { name: 'LEAP',        color: '#4ade80', selected: false },
  { name: 'Spearman',         color: '#2dd4bf', selected: false },
  { name: 'SCINGE',      color: '#22d3ee', selected: false },
  { name: 'SCNS',        color: '#38bdf8', selected: false },
  { name: 'SCODE',       color: '#818cf8', selected: false },
  { name: 'Pearson',      color: '#a78bfa', selected: false },
  { name: 'GRISLI',       color: '#c084fc', selected: false },
  { name: 'SINGE',       color: '#e879f9', selected: false },
];

const similarityData = [
  { pair: 'GENIE3 — GRNBoost2', similarity: 0.82, color: '#A970FF' },
  { pair: 'GENIE3 — SINGE', similarity: 0.76, color: '#60a5fa' },
  { pair: 'SCODE — PIDC', similarity: 0.71, color: '#f59e0b' },
  { pair: 'GRNVBEM — SINGE', similarity: 0.68, color: '#ef4444' },
  { pair: 'GENIE3 — ARBORETO', similarity: 0.79, color: '#8b5cf6' },
  { pair: 'GENIE3 — SCNS', similarity: 0.65, color: '#10b981' },
  { pair: 'GENIE3 — LEAP', similarity: 0.72, color: '#f97316' },
  { pair: 'GENIE3 — GRNVBEM', similarity: 0.74, color: '#3b82f6' },
  { pair: 'GENIE3 — ARACNE', similarity: 0.67, color: '#ec4899' },
  { pair: 'GENIE3 — LEAP', similarity: 0.70, color: '#eab308' },
  { pair: 'GENIE3 — Spearman', similarity: 0.69, color: '#22d3ee' },
  { pair: 'GENIE3 — SINGE', similarity: 0.71, color: '#f43f5e' },
  { pair: 'GENIE3 — SCNS', similarity: 0.68, color: '#6366f1' },
  { pair: 'GENIE3 — SCODE', similarity: 0.66, color: '#facc15' },
  { pair: 'GENIE3 — Pearson', similarity: 0.73, color: '#14b8a6' },
  { pair: 'GENIE3 — GRISLI', similarity: 0.64, color: '#f87171' },
  { pair: 'GENIE3 — SINGE', similarity: 0.69, color: '#8b5cf6' },

  { pair: 'ARBORETO — LEAP', similarity: 0.62, color: '#60a5fa' },
  { pair: 'ARBORETO — GRNVBEM', similarity: 0.65, color: '#a78bfa' },
  { pair: 'SCNS — ARACNE', similarity: 0.61, color: '#f97316' },
  { pair: 'LEAP — SCINGE', similarity: 0.67, color: '#f59e0b' },
  { pair: 'Spearman — SCNS', similarity: 0.63, color: '#22d3ee' },
  { pair: 'SCODE — Pearson', similarity: 0.66, color: '#f43f5e' },
  { pair: 'GRISLI — SINGE', similarity: 0.64, color: '#14b8a6' },
  { pair: 'PIDC — SCODE', similarity: 0.70, color: '#f59e0b' },
  { pair: 'SCENIC — GRNVBEM', similarity: 0.68, color: '#ef4444' },
  { pair: 'GRNBoost2 — GRNVBEM', similarity: 0.66, color: '#a970ff' },
  { pair: 'GRNBoost2 — SCODE', similarity: 0.65, color: '#f97316' },
  { pair: 'SCNS — Pearson', similarity: 0.63, color: '#3b82f6' },
];


export function Compare() {

  const datasets = [
  {
    id: 'hESC',
    label: 'hESC',
    data: [
      { motif: 'SOX2', enrichment: 8.4 },
      { motif: 'OCT4', enrichment: 7.2 },
      { motif: 'NANOG', enrichment: 6.8 },
      { motif: 'KLF4', enrichment: 5.9 },
      { motif: 'MYC', enrichment: 4.7 }
    ]
  },
  {
    id: 'GSD',
    label: 'GSD',
    data: [
      { motif: 'SRY', enrichment: 8.9 },
      { motif: 'SOX9', enrichment: 8.1 },
      { motif: 'SF1', enrichment: 7.4 },
      { motif: 'WT1', enrichment: 6.8 },
      { motif: 'FOXL2', enrichment: 5.95 }
    ]
  },
  {
    id: 'HSC',
    label: 'HSC',
    data: [
      { motif: 'GATA2', enrichment: 8.75 },
      { motif: 'RUNX1', enrichment: 8.1 },
      { motif: 'SPI1', enrichment: 7.6 },
      { motif: 'TAL1', enrichment: 7.1 },
      { motif: 'GATA1', enrichment: 6.85 }
    ]
  },
  {
    id: 'dyn-LI',
    label: 'dyn-LI',
    data: [
      { motif: 'G1', enrichment: 8.5 },
      { motif: 'G2', enrichment: 7.8 },
      { motif: 'G3', enrichment: 6.9 },
      { motif: 'G4', enrichment: 6.1 },
      { motif: 'G5', enrichment: 5.4 }
    ]
  },
  {
    id: 'dyn-BF',
    label: 'dyn-BF',
    data: [
      { motif: 'G1', enrichment: 8.7 },
      { motif: 'G2', enrichment: 7.9 },
      { motif: 'G3A', enrichment: 6.8 },
      { motif: 'G3B', enrichment: 6.75 },
      { motif: 'G4', enrichment: 5.6 }
    ]
  },
  {
    id: 'dyn-BFC',
    label: 'dyn-BFC',
    data: [
      { motif: 'G1', enrichment: 8.6 },
      { motif: 'G2', enrichment: 7.85 },
      { motif: 'G3A', enrichment: 6.9 },
      { motif: 'G3B', enrichment: 6.85 },
      { motif: 'G5', enrichment: 5.95 }
    ]
  }
];

const [currentIndex, setCurrentIndex] = React.useState(0);

const nextDataset = () => {
  setCurrentIndex((prev) => (prev + 1) % datasets.length);
};

const prevDataset = () => {
  setCurrentIndex((prev) =>
    prev === 0 ? datasets.length - 1 : prev - 1
  );
};

const motifEnrichmentData = datasets[currentIndex].data;


  const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>(['alg1', 'alg4', 'alg6', 'alg7', 'alg9', 'alg12']);

  const toggleAlgorithm = (algId: string) => {
    setSelectedAlgorithms(prev =>
      prev.includes(algId)
        ? prev.filter(id => id !== algId)
        : [...prev, algId]
    );
  };

  const selectAll = () => {
    setSelectedAlgorithms(mockAlgorithms.map(a => a.id));
  };

  const deselectAll = () => {
    setSelectedAlgorithms([]);
  };

  const selectedMetrics = mockPerformanceMetrics.filter(m =>
    selectedAlgorithms.includes(m.algorithmId)
  );

  const colors = ['#5B2C6F', '#28A745', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  const prData = Array.from({ length: 11 }, (_, i) => {
    const recall = i * 0.1;
    const point: any = { recall };
    selectedAlgorithms.forEach((algId, idx) => {
      const precision = 0.9 - recall * 0.4 - (idx * 0.05) + Math.random() * 0.05;
      point[algId] = Math.max(0, Math.min(1, precision));
    });
    return point;
  });

  const rocData = Array.from({ length: 11 }, (_, i) => {
    const fpr = i * 0.1;
    const point: any = { fpr };
    selectedAlgorithms.forEach((algId, idx) => {
      const tpr = fpr + 0.3 + (idx * 0.05) + Math.random() * 0.05;
      point[algId] = Math.min(1, tpr);
    });
    return point;
  });

  return (
    <div id="compare" className="min-h-screen py-20 pb-0">
      <div className="container px-4 mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Algorithm Comparison</h1>
          <p className="text-muted-foreground">
            Compare gene inference algorithm performance on HSC dataset
          </p>
        </div>

        {/* Algorithm Selection */}
        <Card id="select" className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground">Select Algorithms to Compare</h3>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Select ALL algorithm names
                  const all = algorithms.map(a => a.name);
                  setSelectedAlgorithms(['alg1', 'alg2', 'alg3', 'alg4', 'alg5', 'alg6', 'alg7', 'alg8', 'alg9', 'alg10', 'alg11', 'alg12',]);
                }}
              >
                Select All
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Clear all selections
                  setSelectedAlgorithms([]);
                }}
              >
                Deselect All
              </Button>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockAlgorithms.map(algorithm => (
              <div
                key={algorithm.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedAlgorithms.includes(algorithm.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => toggleAlgorithm(algorithm.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedAlgorithms.includes(algorithm.id)}
                    onCheckedChange={() => toggleAlgorithm(algorithm.id)}
                  />
                  <div className="flex-1">
                    <p className="text-foreground">{algorithm.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">v{algorithm.version}</p>
                    <Badge variant="secondary" className="text-xs">
                      {algorithm.category}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground">{selectedAlgorithms.length}</span> algorithms selected
            </p>
          </div>
        </div>
      </Card>

      {/* Performance Metrics Table */}
      {selectedMetrics.length > 0 && (
        <Card id="metrics" className='mt-5 px-5 pb-5'>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-foreground">Performance Metrics</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => exportCSV(selectedMetrics)}>
                <FileDown className="w-4 h-4" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => exportPDF(selectedMetrics)}>
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Algorithm</TableHead>
                <TableHead className="text-right">Precision</TableHead>
                <TableHead className="text-right">Recall</TableHead>
                <TableHead className="text-right">F1 Score</TableHead>
                <TableHead className="text-right">AUROC</TableHead>
                <TableHead className="text-right">AUPRC</TableHead>
                <TableHead className="text-right">Early Prec.</TableHead>
                <TableHead className="text-right">Runtime (s)</TableHead>
                <TableHead className="text-right">Memory (MB)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedMetrics.map((metric, idx) => (
                <TableRow key={metric.algorithmId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors[idx % colors.length] }}
                      />
                      <span className="text-foreground">{metric.algorithmName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{metric.precision.toFixed(3)}</TableCell>
                  <TableCell className="text-right">{metric.recall.toFixed(3)}</TableCell>
                  <TableCell className="text-right">{metric.f1Score.toFixed(3)}</TableCell>
                  <TableCell className="text-right">{metric.auroc.toFixed(3)}</TableCell>
                  <TableCell className="text-right">{metric.auprc.toFixed(3)}</TableCell>
                  <TableCell className="text-right">{metric.earlyPrecision.toFixed(3)}</TableCell>
                  <TableCell className="text-right">{metric.runtime.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{metric.memoryUsage.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      
      {/* Visualization Zone */}
      {selectedMetrics.length > 0 && (
        <div id="roc" className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-5">
          {/* Precision-Recall Curve */}
          <Card className="p-6">
            <div className="space-y-4 prc-chart-container">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground">Precision-Recall Curve</h3>
                <Button variant="outline" size="sm" className="gap-2" onClick={downloadPrcGraph}>
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={prData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E6EB" />
                  <XAxis
                    dataKey="recall"
                    label={{ value: 'Recall', position: 'insideBottom', offset: -5 }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{ value: 'Precision', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #E4E6EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  {selectedAlgorithms.map((algId, idx) => {
                    const alg = mockAlgorithms.find(a => a.id === algId);
                    return (
                      <Line
                        key={algId}
                        type="monotone"
                        dataKey={algId}
                        name={alg?.name}
                        stroke={colors[idx % colors.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* ROC Curve */}
          <Card className="p-6">
            <div className="space-y-4 roc-chart-container">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground">ROC Curve</h3>
                <Button variant="outline" size="sm" className="gap-2" onClick={downloadRocGraph}>
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={rocData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E6EB" />
                  <XAxis
                    dataKey="fpr"
                    label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5 }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #E4E6EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  {selectedAlgorithms.map((algId, idx) => {
                    const alg = mockAlgorithms.find(a => a.id === algId);
                    return (
                      <Line
                        key={algId}
                        type="monotone"
                        dataKey={algId}
                        name={alg?.name}
                        stroke={colors[idx % colors.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    );
                  })}
                  <Line
                    type="monotone"
                    dataKey="fpr"
                    stroke="#E4E6EB"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Random"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Performance Comparison Bar Chart */}
          <Card className="lg:col-span-2 p-6">
            <div className="space-y-4">
              <h3 className="text-foreground">Performance Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={selectedMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E6EB" />
                  <XAxis dataKey="algorithmName" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #E4E6EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="precision" fill="#5B2C6F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recall" fill="#28A745" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="f1Score" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {selectedMetrics.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            Select algorithms above to view performance comparisons
          </p>
        </Card>
      )}

        {/* Additional Charts */}
        <div id="enrichment" className="grid lg:grid-cols-2 gap-6 py-5">
          {/* Enrichment */}

          <div className="p-6 rounded-lg border bg-card h-[400px] overflow-y-auto scrollbar-thin">

  {/* Header with dataset switcher */}
  <div className="mb-6 flex items-center justify-between">
    <div>
      <h2 className="font-semibold mb-1">Top Motif Enrichment</h2>
      <p className="text-sm text-muted-foreground">
        {datasets[currentIndex].label} dataset
      </p>
    </div>

    <div className="flex items-center gap-2">
      <button
        onClick={prevDataset}
        className="px-3 py-1 rounded border hover:bg-accent transition"
      >
        ←
      </button>
      <button
        onClick={nextDataset}
        className="px-3 py-1 rounded border hover:bg-accent transition"
      >
        →
      </button>
    </div>
  </div>

  {motifEnrichmentData.length > 0 ? (
    <div className="space-y-4">
      {(() => {
        const maxEnrichment = Math.max(
          ...motifEnrichmentData.map(d => d.enrichment ?? 0),
          1
        );

        return motifEnrichmentData
          .slice()
          .sort((a, b) => b.enrichment - a.enrichment)
          .map((item, idx) => {
            const value = item.enrichment ?? 0;
            const width = (value / maxEnrichment) * 100;

            return (
              <div key={item.motif}>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      #{idx + 1}
                    </span>
                    <span className="font-medium">{item.motif}</span>
                  </div>
                  <span className="font-mono">{value.toFixed(2)}</span>
                </div>

                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${width}%`,
                      backgroundColor: 'var(--color-secondary)',
                    }}
                  />
                </div>
              </div>
            );
          });
      })()}

      <div className="mt-6 p-3 rounded-lg bg-accent/50 border">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Higher enrichment scores indicate stronger
          overrepresentation of transcription factor motifs in inferred
          regulatory networks.
        </p>
      </div>
    </div>
  ) : (
    <p className="text-sm text-muted-foreground text-center">
      No motif enrichment data available.
    </p>
  )}
</div>
      
          {/* Similarity */}
          <div className="p-6 rounded-lg border bg-card h-[400px] overflow-y-auto scrollbar-thin">
            <div className="mb-6">
              <h2 className="font-semibold mb-1">Algorithm Similarity</h2>
              <p className="text-sm text-muted-foreground">
                Network prediction overlap (Jaccard index)
              </p>
            </div>
            <div className="space-y-4">
              {similarityData.map((item) => (
                <div key={item.pair}>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="font-medium">{item.pair}</span>
                    <span className="font-mono">{item.similarity.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${item.similarity * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="mt-6 p-3 rounded-lg bg-accent/50 border">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> High similarity indicates algorithms predict overlapping
                  edge sets. Low similarity suggests complementary approaches.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background mt-12">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <p className='text-sm text-muted-foreground'>© 2026 WebGenie Platform. Licensed under MIT. All rights reserved.</p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
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
