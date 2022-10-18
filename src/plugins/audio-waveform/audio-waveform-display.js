import React from 'react';
import urlUtils from '../../utils/url-utils.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function AudioWaveformDisplay({ content }) {
  const clientConfig = useService(ClientConfig);

  const { sourceType, sourceUrl, width } = content;

  const resolvedUrl = urlUtils.getImageUrl({
    cdnRootUrl: clientConfig.cdnRootUrl,
    sourceType,
    sourceUrl
  });

  return (
    <div className="AudioWaveformDisplay">
      <img className={`AudioWaveformDisplay-image u-width-${width}`} src={resolvedUrl} />
    </div>
  );
}

AudioWaveformDisplay.propTypes = {
  ...sectionDisplayProps
};

export default AudioWaveformDisplay;
