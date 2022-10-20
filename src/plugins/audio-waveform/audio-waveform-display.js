import React from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function AudioWaveformDisplay({ content }) {
  const clientConfig = useService(ClientConfig);

  const { sourceUrl, width } = content;

  const url = getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

  return (
    <div className="AudioWaveformDisplay">
      <img className={`AudioWaveformDisplay-image u-width-${width}`} src={url} />
    </div>
  );
}

AudioWaveformDisplay.propTypes = {
  ...sectionDisplayProps
};

export default AudioWaveformDisplay;
