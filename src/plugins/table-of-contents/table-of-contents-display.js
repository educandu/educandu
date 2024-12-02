import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import Markdown from '../../components/markdown.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

export default function TableOfContentsDisplay({ context, content }) {
  const { t } = useTranslation('tableOfContents');
  const [nodes, setNodes] = useState([]);

  const { minLevel, maxLevel, text } = content;

  useEffect(() => {
    if (context.isPreview) {
      return;
    }

    const nodeList = [...window.document.querySelectorAll('[data-header="true"]')]
      .map(element => ({
        id: element.id,
        text: element.textContent,
        level: Number.parseInt(element.tagName.replace(/\D/g, ''), 10) || null
      }))
      .filter(node => typeof node.level === 'number' && node.level >= minLevel && node.level <= maxLevel);

    setNodes(nodeList);
  }, [minLevel, maxLevel, context]);

  const handleNodeClick = nodeId => {
    setTimeout(() => {
      const minimumTopInPx = 150;
      const nodeTopInPx = document.getElementById(nodeId)?.getBoundingClientRect().top;
      if (nodeTopInPx < minimumTopInPx) {
        window.scrollBy({ top: -minimumTopInPx, behavior: 'smooth' });
      }
    }, 50);

    return true;
  };

  return (
    <div className="TableOfContentsDisplay">
      <div className="TableOfContentsDisplay-content">
        {!!text && (
          <Markdown className="TableOfContentsDisplay-text">{text}</Markdown>
        )}
        {!!context.isPreview && (
          <div className="TableOfContentsDisplay-previewWarning">{t('previewWarning')}</div>
        )}
        {!context.isPreview && !!nodes.length && (
          <ul role="list" className="TableOfContentsDisplay-nodeList">
            {nodes.map(node => (
              <li
                key={node.id}
                className={`TableOfContentsDisplay-node TableOfContentsDisplay-node--indent${node.level - minLevel}`}
                >
                <a href={`#${node.id}`} onClick={() => handleNodeClick(node.id)}>{node.text}</a>
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
