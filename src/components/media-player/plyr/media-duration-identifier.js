import Plyr from 'plyr';
import PropTypes from 'prop-types';
import { useStableCallback } from '../../../ui/hooks.js';
import { memoAndTransformProps } from '../../../ui/react-helper.js';
import { isYoutubeSourceType } from '../../../utils/source-utils.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';

function MediaDurationIdentifier({ sourceUrl, onDuration }) {
  const plyrRef = useRef(null);

  const [player, setPlayer] = useState(null);

  useEffect(() => {
    const playerInstance = new Plyr(plyrRef.current, {
      controls: [],
      clickToPlay: true,
      loadSprite: false,
      blankVideo: '',
      fullscreen: { enabled: false, fallback: false }
    });
    setPlayer(playerInstance);
  }, [plyrRef]);

  useEffect(() => {
    if (player) {
      player.source = {
        type: 'video',
        sources: [{ src: sourceUrl, provider: isYoutubeSourceType(sourceUrl) ? 'youtube' : 'html5' }]
      };
    }
  }, [player, sourceUrl]);

  const handleDuration = useCallback(() => {
    if (player.duration) {
      const durationInMs = player.duration * 1000;
      onDuration(durationInMs);
    }
  }, [player, onDuration]);

  useEffect(() => {
    if (player) {
      player.once('loadedmetadata', handleDuration);
      player.once('ready', handleDuration);
    }
  }, [player, handleDuration]);

  if (!sourceUrl) {
    return null;
  }

  return (
    <div>
      <video ref={plyrRef} />
    </div>
  );
}

MediaDurationIdentifier.propTypes = {
  sourceUrl: PropTypes.string,
  onDuration: PropTypes.func.isRequired
};

MediaDurationIdentifier.defaultProps = {
  sourceUrl: ''
};

export default memoAndTransformProps(MediaDurationIdentifier, ({
  onReady,
  ...rest
}) => ({
  onReady: useStableCallback(onReady),
  ...rest
}));
