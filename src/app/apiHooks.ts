// apiHooks.ts
import { useState, useEffect, useCallback } from "react";

const API_BASE = "https://ukandu-webgenie_api.hf.space";


// ----------------------
// Datasets
// ----------------------
export function useDatasets() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/datasets`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Failed to fetch datasets");
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, []);

  return { data, loading, error };
}

export function useUploadDataset() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const json = await res.json();
      return json;
    } catch (err: any) {
      setError(err.message || "Upload failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { upload, loading, error };
}

// ----------------------
// Jobs / Dashboard
// ----------------------
export function useJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/jobs`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const json = await res.json();
        setJobs(json);
      } catch (err: any) {
        setError(err.message || "Failed to fetch jobs");
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  return { jobs, loading, error };
}

// ----------------------
// Submit new job / run
// ----------------------
export function useSubmitJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitJob = useCallback(async (jobConfig: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobConfig),
      });
      if (!res.ok) throw new Error(`Job submission failed: ${res.status}`);
      const json = await res.json();
      return json;
    } catch (err: any) {
      setError(err.message || "Job submission failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { submitJob, loading, error };
}

// ----------------------
// Compare
// ----------------------
export function useCompareResults(jobIds: string[]) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobIds.length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }

    const fetchComparison = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/compare?jobs=${jobIds.join(",")}`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const json = await res.json();
        setResults(json);
      } catch (err: any) {
        setError(err.message || "Failed to fetch comparison");
      } finally {
        setLoading(false);
      }
    };
    fetchComparison();
  }, [jobIds]);

  return { results, loading, error };
}

// ----------------------
// Explore / Analytics
// ----------------------
export function useExplore(datasetId: string) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!datasetId) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchExplore = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/explore/${datasetId}`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Failed to fetch explore data");
      } finally {
        setLoading(false);
      }
    };
    fetchExplore();
  }, [datasetId]);

  return { data, loading, error };
}