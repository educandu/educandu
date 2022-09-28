import { SOURCE_TYPE } from './constants.js';
import React, { useEffect, useRef } from 'react';
import Markdown from '../../components/markdown.js';
import ClientConfig from '../../bootstrap/client-config.js';
import OpenSheetMusicDisplayExport from 'opensheetmusicdisplay';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

const { OpenSheetMusicDisplay } = OpenSheetMusicDisplayExport;

const osmdOptions = {
  autoResize: true,
  drawTitle: true
};

function MusicXmlViewerDisplay({ content }) {
  const { sourceType, sourceUrl, zoom, width, caption } = content;

  const osmd = useRef(null);
  const divRef = useRef(null);
  const clientConfig = useService(ClientConfig);

  if (sourceType !== SOURCE_TYPE.internal) {
    throw new Error(`Invalid source type '${sourceType}'`);
  }

  const actualUrl = sourceUrl ? `${clientConfig.cdnRootUrl}/${sourceUrl}` : null;

  useEffect(() => {
    let currentOsmd = osmd.current;
    if (!currentOsmd) {
      currentOsmd = new OpenSheetMusicDisplay(divRef.current, osmdOptions);
      osmd.current = currentOsmd;
    }

    if (actualUrl) {
      currentOsmd.load(actualUrl).then(() => {
        currentOsmd.zoom = zoom;
        currentOsmd.render();
      });
    } else {
      currentOsmd.clear();
    }
  }, [actualUrl, zoom, osmd]);

  return (
    <div className="MusicXmlViewerDisplay">
      <div className={`MusicXmlViewerDisplay-viewer u-width-${width || 100}`}>
        <div ref={divRef} />
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
