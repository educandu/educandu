import React from 'react';
import { SOURCE_TYPE } from './constants.js';
import Markdown from '../../components/markdown.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MusicXmlDocument from '../../components/music-xml-document.js';

function MusicXmlViewerDisplay({ content }) {
  const clientConfig = useService(ClientConfig);

  const { sourceType, sourceUrl, zoom, width, caption } = content;

  if (sourceType !== SOURCE_TYPE.internal) {
    throw new Error(`Invalid source type '${sourceType}'`);
  }

  const actualUrl = sourceUrl ? `${clientConfig.cdnRootUrl}/${sourceUrl}` : null;

  return (
    <div className="MusicXmlViewerDisplay">
      <div className={`MusicXmlViewerDisplay-viewer u-width-${width || 100}`}>
        <MusicXmlDocument url={actualUrl} zoom={zoom} />
      </div>
      {!!caption && (
        <div className={`MusicXmlViewerDisplay-caption u-width-${width || 100}`}>
          <Markdown inline>{caption}</Markdown>
        </div>
      )}
    </div>
  );
}

MusicXmlViewerDisplay.propTypes = {
  ...sectionDisplayProps
};

export default MusicXmlViewerDisplay;
