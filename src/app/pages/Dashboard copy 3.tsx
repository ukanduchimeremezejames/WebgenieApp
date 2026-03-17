import React, { useState, useEffect } from 'react';
import { TrendingUp, Database, GitCompare, Cpu, Play, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Line, LineChart, Legend } from 'recharts';
import { KPICard } from '../components/KPICard';
import { DatasetCard } from './DatasetCard2';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Slider } from '../components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { DatasetDetailModal } from '../components/DatasetDetailModal';
import { Search, ArrowUpDown, Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockDatasets2, mockAlgorithms, mockJobs, getAUPRCDistributionData, allDatasets } from '../components/mockData';
import { Dataset } from '../types';


type RecentResult = {
  id: string
  dataset: string
  algorithm: string
  auroc: string
  auprc: string
  status: string
  createdAt: number  
}

interface AlgorithmMetrics {
  algorithm: string;
  auroc: number;
  auprc: number;
  f1: number;
  runtime: number;
}

export function Dashboard() {

  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('auprc');
  const [sizeRange, setSizeRange] = useState([0, 100]);
  const [selectedOrganism, setSelectedOrganism] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const totalGenes = allDatasets.reduce((sum, ds) => sum + ds.genes, 0);
  const totalCells = allDatasets.reduce((sum, ds) => sum + ds.cells, 0);
  const totalEdges = allDatasets.reduce((sum, ds) => sum + ds.edges, 0);

  const handleViewDetails = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setModalOpen(true);
  };

  const formatMinutesAgo = (date?: number) => {
  if (!date || isNaN(date)) return 'just now';

  const diffMs = Date.now() - date;
  const diffMins = Math.floor(diffMs / 60000);

  return diffMins <= 0 ? 'just now' : `${diffMins}m ago`;
};

const generateSingleResult = (): RecentResult => {
  const dataset =
    mockDatasets2[Math.floor(Math.random() * mockDatasets2.length)].name;

  const algorithm =
    mockAlgorithms[Math.floor(Math.random() * mockAlgorithms.length)].name;

  const auroc = (Math.random() * 0.2 + 0.6).toFixed(3);
  const auprc = (Math.random() * 0.2 + 0.55).toFixed(3);

  return {
  id: crypto.randomUUID(),
  dataset,
  algorithm,
  auroc,
  auprc,
  status: 'completed',
  createdAt: Date.now(),
};
};

useEffect(() => {
  const initialResults = Array.from({ length: 6 }, () =>
    generateSingleResult()
  );

  setRecentResults(initialResults);
}, []);

useEffect(() => {
  let timeout: ReturnType<typeof setTimeout>;

  const scheduleNext = () => {
    const randomDelay =
      (Math.floor(Math.random() * 11) + 5) * 60 * 1000; // 5–15 minutes

    timeout = setTimeout(() => {
      setRecentResults((prev) => {
        const updated = [
          generateSingleResult(),
          ...prev,
        ].slice(0, 6);

        return updated;
      });

      scheduleNext();
    }, randomDelay);
  };

  scheduleNext();

  return () => clearTimeout(timeout);
}, []);


useEffect(() => {
  const interval = setInterval(() => {
    setRecentResults((prev) => [...prev]);
  }, 60 * 1000);

  return () => clearInterval(interval);
}, []);

// const GLOBAL_RUNS_KEY = "benchmark_runs_all";

// function getAllRuns() {
//   const raw = localStorage.getItem(GLOBAL_RUNS_KEY);
//   return raw ? JSON.parse(raw) : [];
// }

// function saveRun(datasetId: string, run: any) {
//   const existing = getAllRuns();

//   const newRun = {
//     ...run,
//     dataset: datasetId,
//     algorithm: datasetId, // or ds.name if available
//   };

//   const updated = [newRun, ...existing].slice(0, 50); // keep latest 50

//   localStorage.setItem(GLOBAL_RUNS_KEY, JSON.stringify(updated));
// }

const GLOBAL_RUNS_KEY = "benchmark_runs_all";

function getAllRuns() {
  const raw = localStorage.getItem(GLOBAL_RUNS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveRun(datasetId: string, run: any) {
  const existing = getAllRuns();

  const newRun = {
    ...run,
    dataset: datasetId,
    algorithm: datasetId, // or ds.name
    timestamp: new Date().toISOString(), // ✅ REAL TIME
  };

  // ✅ Keep only latest 6
  const updated = [newRun, ...existing].slice(0, 6);

  localStorage.setItem(GLOBAL_RUNS_KEY, JSON.stringify(updated));
}

function formatTimeAgo(timestamp: string) {
  const now = new Date().getTime();
  const past = new Date(timestamp).getTime();
  const diff = Math.floor((now - past) / 1000);

  if (diff < 60) return `${diff}s ago`;

  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const [recentRuns, setRecentRuns] = useState<any[]>([]);

useEffect(() => {
  const runs = getAllRuns();
  setRecentRuns(runs);
}, []); // ✅ NO dependency// updates when a new run completes

  // Function to generate random results
  const generateRecentResults = () => {
    const results: RecentResult[] = [];
    for (let i = 0; i < 6; i++) {
      const dataset = mockDatasets2[Math.floor(Math.random() * mockDatasets2.length)].name;
      const algorithm = mockAlgorithms[Math.floor(Math.random() * mockAlgorithms.length)].name;
      const auroc = (Math.random() * 0.2 + 0.6).toFixed(3); // AUROC between 0.6-0.8
      const auprc = (Math.random() * 0.2 + 0.55).toFixed(3); // AUPRC between 0.55-0.75
      const minutesAgo = Math.floor(Math.random() * 59) + 1;
      results.push({
        id: i,
        dataset,
        algorithm,
        auroc,
        auprc,
        status: 'completed',
        date: `${minutesAgo}m ago`,
      });
    }
    setRecentResults(results);
  };

  // Initialize and refresh every 5 minutes
  useEffect(() => {
    generateRecentResults(); // initial
    const interval = setInterval(generateRecentResults, 5 * 60 * 1000); // every 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
  const runs = getAllRuns();
  setRecentRuns(runs);
}, []);


  
  const [algorithmComparison, setAlgorithmComparison] = useState<AlgorithmMetrics[]>([]);

  // Function to generate random metrics
  const generateAlgorithmComparison = () => {
    const results: AlgorithmMetrics[] = mockAlgorithms.map((algo) => {
      const auroc = Math.random() * 0.2 + 0.6;  // AUROC between 0.6 - 0.8
      const auprc = Math.random() * 0.2 + 0.55; // AUPRC between 0.55 - 0.75
      const f1 = Math.min(auroc, auprc) - Math.random() * 0.05; // F1 slightly lower than metrics
      const runtime = Math.floor(Math.random() * 100 + 20); // Runtime 20-120s
      return {
        algorithm: algo.name,
        auroc,
        auprc,
        f1,
        runtime,
      };
    });
    setAlgorithmComparison(results);
  };

  // Initialize and refresh every 5 minutes
  useEffect(() => {
    generateAlgorithmComparison(); // initial
    const interval = setInterval(generateAlgorithmComparison, 5 * 60 * 1000); // every 5 minutes
    return () => clearInterval(interval);
  }, []);


  const handleDownload = (dataset: Dataset) => {
  console.log("Downloading dataset:", dataset.name);

  // open link in a new tab
  window.open("https://zenodo.org/records/3701939", "_blank");
};


  const chartData = getAUPRCDistributionData();

  // Filter datasets
  const filteredDatasets = mockDatasets2.filter(ds => {
    const matchesOrganism = selectedOrganism === 'all' || ds.organism === selectedOrganism;
    const matchesType = selectedType === 'all' || ds.type === selectedType;
    const matchesSize = ds.genes >= sizeRange[0] && ds.genes <= sizeRange[1];
    return matchesOrganism && matchesType && matchesSize;
  });

  const [totalRuns, setTotalRuns] = useState(0);

  useEffect(() => {
  const storedRuns = localStorage.getItem("totalRuns");
  const currentRuns = storedRuns ? parseInt(storedRuns, 10) : 195;

  const updatedRuns = currentRuns + 1;

  localStorage.setItem("totalRuns", updatedRuns.toString());
  setTotalRuns(updatedRuns);
}, []);



useEffect(() => {
  const stored = localStorage.getItem("recentResults");

  if (stored) {
    setRecentResults(JSON.parse(stored));
    return;
  }


  // Generate 6 results spaced 3–20 mins apart in the past
  const initialResults = Array.from({ length: 6 }, (_, index) => {
    const minutesAgo = (index + 1) * (Math.floor(Math.random() * 5) + 3);
    const result = generateSingleResult();
    return {
      ...result,
      createdAt: Date.now() - minutesAgo * 60 * 1000,
    };
  });

  setRecentResults(initialResults);
  localStorage.setItem("recentResults", JSON.stringify(initialResults));
}, []);

useEffect(() => {
  if (recentResults.length > 0) {
    localStorage.setItem("recentResults", JSON.stringify(recentResults));
  }
}, [recentResults]);


  

  return (
    <div id="overview" className="min-h-screen py-20 pb-0">
      <div className="container px-4 mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of recent benchmarking results and system metrics
          </p>
        </div>

        {/* KPI Cards */}
      <div id="performance" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Database}
          title="Total Datasets"
          value={allDatasets.length}
          description="BEELINE benchmark datasets"
          gradient="from-purple-50 to-purple-100"
        />
        <KPICard
          icon={Cpu}
          title="Total Algorithms"
          value={mockAlgorithms.length}
          description="Network inference methods"
          gradient="from-green-50 to-green-100"
        />
        <KPICard
          icon={Play}
          title="Total Runs"
          value={totalRuns}
          description="Algorithm executions"
          gradient="from-blue-50 to-blue-100"
        />
        <KPICard
          icon={Activity}
          title="Total Genes"
          value={totalGenes}
          description={`${totalCells.toLocaleString()} cells, ${totalEdges.toLocaleString()} edges`}
          gradient="from-orange-50 to-orange-100"
        />
      </div>

        {/* Stats Cards */}
        

        {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
        {/* AUPRC Distribution Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-foreground">Performance Metrics Distribution</h3>
                <p className="text-sm text-muted-foreground">Algorithm comparison for each dataset computed as a mean across all datasets</p>
              </div>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auprc">AUPRC</SelectItem>
                  <SelectItem value="auroc">AUROC</SelectItem>
                  <SelectItem value="f1Score">F1 Score</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E6EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #E4E6EB',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                {/* {performanceData.map((entry, index) => ( */}
                <Bar 
                  dataKey={selectedMetric} 
                  fill={2 % 2 === 0 ? 'var(--color-primary)' : 'var(--color-secondary)'} 
                  radius={[4, 4, 0, 0]} />
               
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quick Filter Panel */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-foreground mb-2">Quick Filters</h3>
              <p className="text-sm text-muted-foreground">Filter datasets by criteria</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-foreground mb-2 block">Organism</label>
                <Select value={selectedOrganism} onValueChange={setSelectedOrganism}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Organisms</SelectItem>
                    <SelectItem value="Human">Human</SelectItem>
                    <SelectItem value="Mouse">Mouse</SelectItem>
                    <SelectItem value="Yeast">Yeast</SelectItem>
                    <SelectItem value="Synthetic">Synthetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-foreground mb-2 block">Dataset Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="scRNA-seq">scRNA-seq</SelectItem>
                    <SelectItem value="bulk RNA-seq">Bulk RNA-seq</SelectItem>
                    <SelectItem value="synthetic">Synthetic</SelectItem>
                    <SelectItem value="time-series">Time Series</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-foreground mb-2 block">
                  Size Range: {sizeRange[0]} - {sizeRange[1]} genes
                </label>
                <Slider
                  value={sizeRange}
                  onValueChange={setSizeRange}
                  min={0}
                  max={100}
                  step={10}
                  className="mt-2"
                />
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => console.log('Applying filters')}
                >
                  Apply Filters
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedOrganism('all');
                    setSelectedType('all');
                    setSizeRange([0, 100]);
                  }}
                >
                  Reset Filters
                </Button>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground">{filteredDatasets.length}</span> datasets match your criteria
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Featured Datasets Section */}
      <div>
        <div className="mb-4 mt-10">
          <h3 className="text-foreground">Featured Datasets</h3>
          <p className="text-sm text-muted-foreground">
            BEELINE benchmark datasets for network inference evaluation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDatasets.slice(0, 6).map(dataset => (
            <DatasetCard
              key={dataset.id}
              dataset={dataset}
              onViewDetails={handleViewDetails}
              onDownload={handleDownload}
            />
          ))}
        </div>
      </div>

        <div className="grid lg:grid-cols-3 gap-6">
           {/* Algorithm Comparison Table */}
      <div id="comparison" className="lg:col-span-2 mt-6 rounded-lg border bg-card p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Algorithm Comparison</h2>
          <p className="text-sm text-muted-foreground">
            Detailed performance metrics across all benchmarked algorithms
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Algorithm
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  AUROC
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  AUPRC
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  F1 Score
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Runtime (s)
                </th>
              </tr>
            </thead>
            <tbody>
              {algorithmComparison.map((algo, index) => (
                <tr key={algo.algorithm} className="border-b last:border-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          index === 0 ? 'bg-primary' : 'bg-secondary'
                        }`}
                      />
                      <span className="font-medium">{algo.algorithm}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 font-mono text-sm">
                    {algo.auroc.toFixed(3)}
                  </td>
                  <td className="text-right py-3 px-4 font-mono text-sm">
                    {algo.auprc.toFixed(3)}
                  </td>
                  <td className="text-right py-3 px-4 font-mono text-sm">
                    {algo.f1.toFixed(3)}
                  </td>
                  <td className="text-right py-3 px-4 font-mono text-sm text-muted-foreground">
                    {algo.runtime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
          
      {/* Recent Results
      <div id="recent" className="rounded-lg border bg-card p-6 mt-5">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Recent Results</h2>
          <p className="text-sm text-muted-foreground">Latest benchmark runs</p>
        </div>
        <div className="space-y-4">
          {recentResults.map((result) => (
            <div key={result.id} className="p-3 rounded-lg border bg-accent/50">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium">{result.dataset}</div>
                <div className="text-xs text-muted-foreground">{formatMinutesAgo(result.createdAt)}</div>
              </div>
              <div className="text-xs text-muted-foreground mb-2">{result.algorithm}</div>
              <div className="flex gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">AUROC:</span>{' '}
                  <span className="font-medium">{result.auroc}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">AUPRC:</span>{' '}
                  <span className="font-medium">{result.auprc}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div> */}
      {/* Recent Results (from localStorage) */}
      {/* <div id="recent" className="rounded-lg border bg-card p-6 mt-5">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Recent Results</h2>
          <p className="text-sm text-muted-foreground">Latest benchmark runs</p>
        </div>

        {(() => {
          try {
            const raw = localStorage.getItem(`benchmark_runs_${selectedDatasetId}`);
            const runs = raw ? JSON.parse(raw) : [];

            if (!runs.length) {
              return (
                <div className="text-sm text-muted-foreground">
                  No runs yet. Start a benchmark to see results.
                </div>
              );
            }

            // format + sort latest first
            const formatted = runs
              .map((run: any) => ({
                id: run.id,
                dataset: "GSD",
                algorithm: "GENIE3",
                auroc: run?.metrics?.auroc ?? 0,
                auprc: run?.metrics?.auprc ?? 0,
                createdAt: run.timestamp,
              }))
              .sort(
                (a: any, b: any) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              );

            return (
              <div className="space-y-4">
                {formatted.map((result: any) => (
                  <div
                    key={result.id}
                    className="p-3 rounded-lg border bg-accent/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium">
                        {result.dataset}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatMinutesAgo(result.createdAt)}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mb-2">
                      {result.algorithm}
                    </div>

                    <div className="flex gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">AUROC:</span>{" "}
                        <span className="font-medium">{result.auroc}</span>
                      </div>

                      <div>
                        <span className="text-muted-foreground">AUPRC:</span>{" "}
                        <span className="font-medium">{result.auprc}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          } catch (err) {
            console.error("Error loading recent runs:", err);
            return (
              <div className="text-sm mt-10 text-red-500 text-center">
                No Runs Yet, try to run a benchmark here:
                <Button
                  className="w-full mt-5 bg-primary hover:bg-primary/90"
                  onClick={() => (window.location.href = `/dataset/GSD`)}
                >
                  Run Benchmark
                </Button>

              </div>
            );
          }
        })()}
      </div> */}

      {/* Recent Results */}
<div className="rounded-lg border bg-card p-6 mt-5">
  <div className="mb-6">
    <h2 className="text-lg font-semibold">Recent Results</h2>
    <p className="text-sm text-muted-foreground">
      Last 6 benchmark runs
    </p>
  </div>

  {recentRuns.length === 0 ? (
    <div className="text-sm text-muted-foreground">
      No runs yet.
    </div>
  ) : (
    <div className="space-y-4">
      {recentRuns.map((run) => (
        <div
          key={run.id}
          className="p-3 rounded-lg border bg-accent/50"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-medium">
              {run.dataset}
            </div>

            {/* ✅ REAL TIME */}
            <div className="text-xs text-muted-foreground">
              {formatTimeAgo(run.timestamp)}
            </div>
          </div>

          <div className="text-xs text-muted-foreground mb-2">
            {run.algorithm}
          </div>

          <div className="flex gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">AUROC:</span>{" "}
              <span className="font-medium">
                {run?.metrics?.auroc ?? 0}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground">AUPRC:</span>{" "}
              <span className="font-medium">
                {run?.metrics?.auprc ?? 0}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
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

      {/* Dataset Detail Modal */}
      <DatasetDetailModal
        dataset={selectedDataset}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
      
    </div>
  );
}
