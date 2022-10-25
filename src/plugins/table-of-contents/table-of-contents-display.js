import React, { useEffect, useState } from 'react';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

export default function TableOfContentsDisplay({ content }) {
  const [nodes, setNodes] = useState([]);

  const { minLevel, maxLevel } = content;

  useEffect(() => {
    const nodeList = [...window.document.querySelectorAll('[data-header="true"]')]
      .map(element => ({
        id: element.id,
        text: element.textContent,
        level: Number.parseInt(element.tagName.replace(/\D/g, ''), 10) || null
      }))
      .filter(node => typeof node.level === 'number' && node.level >= minLevel && node.level <= maxLevel);

    setNodes(nodeList);
  }, [minLevel, maxLevel]);

  if (!nodes.length) {
    return null;
  }

  return (
    <ul className="TableOfContentsDisplay">
      {nodes.map(node => (
        <li
          key={node.id}
          className={`TableOfContentsDisplay-node TableOfContentsDisplay-node--indent${node.level - minLevel}`}
          >
          <a href={`#${node.id}`}>{node.text}</a>
        </li>
      ))}
    </ul>
  );
}

TableOfContentsDisplay.propTypes = {
  ...sectionDisplayProps
};
