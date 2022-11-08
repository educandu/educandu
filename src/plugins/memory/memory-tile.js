import React from 'react';
import PropTypes from 'prop-types';
import Markdown from '../../components/markdown.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { getResourceType } from '../../utils/resource-utils.js';
import { useService } from '../../components/container-context.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import { MEDIA_SCREEN_MODE, RESOURCE_TYPE } from '../../domain/constants.js';

function MemoryTile({ text, sourceUrl }) {
  const clientConfig = useService(ClientConfig);
  const resourceType = sourceUrl ? getResourceType(sourceUrl) : RESOURCE_TYPE.none;

  const renderMedia = () => {
    const url = getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

    switch (resourceType) {
      case RESOURCE_TYPE.audio:
        return <MediaPlayer source={url} canDownload screenMode={MEDIA_SCREEN_MODE.none} />;
      case RESOURCE_TYPE.video:
        return <MediaPlayer source={url} canDownload />;
      case RESOURCE_TYPE.image:
        return <img className="MemoryTile-image" src={url} />;
      default:
        return null;
    }
  };

  return (
    <div className="MemoryTile">
      {!!text && (<Markdown>{text}</Markdown>)}
      {!!sourceUrl && renderMedia()}
    </div>
  );
}

MemoryTile.propTypes = {
  sourceUrl: PropTypes.string,
  text: PropTypes.string
};

MemoryTile.defaultProps = {
  sourceUrl: '',
  text: ''
};

export default MemoryTile;
