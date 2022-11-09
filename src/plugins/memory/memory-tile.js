import PropTypes from 'prop-types';
import reactPlayerNs from 'react-player';
import Markdown from '../../components/markdown.js';
import { RESOURCE_TYPE } from '../../domain/constants.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { analyzeMediaUrl } from '../../utils/media-utils.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import AudioIcon from '../../components/icons/general/audio-icon.js';
import React, { Fragment, useEffect, useRef, useState } from 'react';

const ReactPlayer = reactPlayerNs.default || reactPlayerNs;

function MemoryTile({ text, sourceUrl, isFlipped }) {
  const playerRef = useRef();
  const isMounted = useRef(false);
  const clientConfig = useService(ClientConfig);

  const accessibleUrl = getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
  const { resourceType } = sourceUrl ? analyzeMediaUrl(sourceUrl) : { resourceType: RESOURCE_TYPE.none };

  const [isPlaying, setIsPlaying] = useState(isFlipped);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isFlipped) {
      playerRef.current?.seekTo(0);
      setTimeout(() => {
        if (isMounted.current) {
          setIsPlaying(true);
        }
      }, 500);
    } else {
      setIsPlaying(false);
    }
  }, [playerRef, isFlipped]);

  const renderReactPlayer = () => (
    <ReactPlayer width="100%" height="100%" ref={playerRef} url={accessibleUrl} playing={isPlaying} />
  );

  const renderMedia = () => {
    switch (resourceType) {
      case RESOURCE_TYPE.audio:
        return (
          <Fragment>
            {renderReactPlayer()}
            <div className="MemoryTile-audio"><AudioIcon /></div>
          </Fragment>
        );
      case RESOURCE_TYPE.video:
        return renderReactPlayer();
      case RESOURCE_TYPE.image:
        return <img className="MemoryTile-image" src={accessibleUrl} />;
      default:
        return null;
    }
  };

  return (
    <div className="MemoryTile">
      {!!text && (<div className="MemoryTile-markdown"><Markdown>{text}</Markdown></div>)}
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
