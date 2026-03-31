
export function useGraphData(edges, selectedAlgorithms, minSupport) {
  const filtered = edges.filter(e => {
    const matchesK = e.support_count >= minSupport;
    const matchesAlgorithms = selectedAlgorithms.every(a =>
      e.supporting_algorithms.includes(a)
    );
    return matchesK && matchesAlgorithms;
  });

  const nodes = new Set();

  filtered.forEach(e => {
    nodes.add(e.source);
    nodes.add(e.target);
  });

  return {
    elements: [
      ...Array.from(nodes).map(g => ({
        data: { id: g, label: g }
      })),
      ...filtered.map(e => ({
        data: {
          id: e.edge_id,
          source: e.source,
          target: e.target,
          support_count: e.support_count,
          consensus_score: e.consensus_score
        }
      }))
    ],
    edgeCount: filtered.length,
    nodeCount: nodes.size
  };
}
