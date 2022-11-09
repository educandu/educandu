import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import Markdown from '../../components/markdown.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { analyzeMediaUrl } from '../../utils/media-utils.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import { MEDIA_SCREEN_MODE, RESOURCE_TYPE } from '../../domain/constants.js';

function MemoryTile({ text, sourceUrl, isFlipped }) {
  const mediaPlayerRef = useRef();
  const clientConfig = useService(ClientConfig);
  const { resourceType } = sourceUrl ? analyzeMediaUrl(sourceUrl) : { resourceType: RESOURCE_TYPE.none };

  useEffect(() => {
    if (mediaPlayerRef?.current) {
      if (isFlipped) {
        mediaPlayerRef.current.play?.();
      } else {
        mediaPlayerRef.current.stop?.();
      }
    }
  }, [isFlipped]);

  const renderMedia = () => {
    const url = getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

    switch (resourceType) {
      case RESOURCE_TYPE.audio:
        return (
          <MediaPlayer
            source={url}
            showControls={false}
            showProgressBar={false}
            mediaPlayerRef={mediaPlayerRef}
            screenMode={MEDIA_SCREEN_MODE.audio}
            />
        );
      case RESOURCE_TYPE.video:
        return (
          <MediaPlayer
            source={url}
            showControls={false}
            showProgressBar={false}
            mediaPlayerRef={mediaPlayerRef}
            />
        );
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
  isFlipped: PropTypes.bool,
  sourceUrl: PropTypes.string,
  text: PropTypes.string
};

MemoryTile.defaultProps = {
  isFlipped: false,
  sourceUrl: '',
  text: ''
};

export default MemoryTile;
