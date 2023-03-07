import React, { useEffect, useState } from 'react';
import Markdown from '../../components/markdown.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

export default function TableOfContentsDisplay({ content }) {
  const [nodes, setNodes] = useState([]);

  const { minLevel, maxLevel, text } = content;

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

  return (
    <div className="TableOfContentsDisplay">
      <div className="TableOfContentsDisplay-content">
        {!!text && (
          <Markdown className="TableOfContentsDisplay-text">{text}</Markdown>
        )}
        {!!nodes.length && (
          <ul role="list" className="TableOfContentsDisplay-nodeList">
            {nodes.map(node => (
              <li
                key={node.id}
                className={`TableOfContentsDisplay-node TableOfContentsDisplay-node--indent${node.level - minLevel}`}
                >
                <a href={`#${node.id}`}>{node.text}</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

TableOfContentsDisplay.propTypes = {
  ...sectionDisplayProps
};
