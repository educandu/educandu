import reactVisForceNs from 'react-vis-force';
import React, { useEffect, useState } from 'react';

const { InteractiveForceGraph, ForceGraphNode, ForceGraphLink } = reactVisForceNs;

function createGraphData(docs) {
  console.log('Creating graph data');
  const nodes = new Map();
  const links = new Set();

  for (const doc of docs) {
    for (const tag of doc.tags) {
      const existingTag = nodes.get(tag) || { id: tag, documents: [] };
      nodes.set(tag, { ...existingTag, documents: [...existingTag.documents, doc] });
      for (const otherTag of doc.tags) {
        if (tag !== otherTag) {
          links.add([tag, otherTag].sort().join());
        }
      }
    }
  }

  return {
    nodes: [...nodes.values()],
    links: [...links.values()].map(l => l.split(',')).map(([source, target]) => ({ source, target }))
  };
}

function DocumentTagsForceGraph({ docs }) {
  const [graphData, setGraphData] = useState(null);

  useEffect(() => setGraphData(createGraphData(docs)), [docs]);

  return (
    <div>
      {!!graphData && (
        <InteractiveForceGraph
          simulationOptions={{ height: 600, width: 1100 }}
          labelAttr="id"
          onSelectNode={node => console.log(node)}
          highlightDependencies
          showLabels
          >
          {graphData.nodes.map(node => (
            <ForceGraphNode key={node.id} node={node} fill="red" />
          ))}
          {graphData.links.map(link => (
            <ForceGraphLink key={link.source} link={link} />
          ))}
        </InteractiveForceGraph>
      )}
    </div>
  );
}

export default DocumentTagsForceGraph;
