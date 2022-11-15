import PropTypes from 'prop-types';
import reactPlayerNs from 'react-player';
import Markdown from '../../components/markdown.js';
import { RESOURCE_TYPE } from '../../domain/constants.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { analyzeMediaUrl } from '../../utils/media-utils.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import AudioIcon from '../../components/icons/general/audio-icon.js';
import CheckIcon from '../../components/icons/general/check-icon.js';
import React, { Fragment, useEffect, useRef, useState } from 'react';

const ReactPlayer = reactPlayerNs.default || reactPlayerNs;

function MatchingCardsTile({ text, sourceUrl, playMedia, showMatched }) {
  const playerRef = useRef();
  const isMounted = useRef(false);
  const timeoutToPlayMedia = useRef();
  const playerHandlersRef = useRef({});
  const clientConfig = useService(ClientConfig);

  const accessibleUrl = getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
  const { resourceType } = sourceUrl ? analyzeMediaUrl(sourceUrl) : { resourceType: RESOURCE_TYPE.none };

  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    setIsPlaying(false);
    clearTimeout(timeoutToPlayMedia.current);

    if (playMedia) {
      playerRef.current?.seekTo(0);
      timeoutToPlayMedia.current = setTimeout(() => {
        if (isMounted.current) {
          setIsPlaying(playMedia);
        }
      }, 500);
    }
  }, [playerRef, playMedia]);

  const ensureStopStateIsRegistered = () => {
    setIsPlaying(true);
    setIsPlaying(false);
  };

  playerHandlersRef.current.handleBufferEnd = () => {
    if (!playMedia) {
      clearTimeout(timeoutToPlayMedia.current);
      ensureStopStateIsRegistered();
    }
  };

  // This workaround fixes a react-player bug in which the bufferEnd callback is not updated
  const handleBufferEnd = () => {
    playerHandlersRef.current.handleBufferEnd();
  };

  const renderReactPlayer = () => (
    <ReactPlayer
      width="100%"
      height="100%"
      ref={playerRef}
      url={accessibleUrl}
      playing={isPlaying}
      onBufferEnd={handleBufferEnd}
      />
  );

  const renderMedia = () => {
    switch (resourceType) {
      case RESOURCE_TYPE.audio:
        return (
          <Fragment>
            {renderReactPlayer()}
            <div className="MatchingCardsTile-audio"><AudioIcon /></div>
          </Fragment>
        );
      case RESOURCE_TYPE.video:
        return renderReactPlayer();
      case RESOURCE_TYPE.image:
        return <img className="MatchingCardsTile-image" src={accessibleUrl} />;
      default:
        return null;
    }
  };

  return (
    <div className="MatchingCardsTile">
      <div>
        {!!text && (<div className="MatchingCardsTile-markdown"><Markdown>{text}</Markdown></div>)}
        {!!accessibleUrl && renderMedia()}
      </div>
      <div className="MatchingCardsTile-noInnerClickMask" />
      {showMatched && <div className="MatchingCardsTile-match"><CheckIcon /></div>}
    </div>
  );
}

MatchingCardsTile.propTypes = {
  playMedia: PropTypes.bool,
  showMatched: PropTypes.bool,
  sourceUrl: PropTypes.string,
  text: PropTypes.string
};

MatchingCardsTile.defaultProps = {
  playMedia: false,
  showMatched: false,
  sourceUrl: '',
  text: ''
};

export default MatchingCardsTile;
