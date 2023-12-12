import abcjs from 'abcjs';
import PropTypes from 'prop-types';
import Logger from '../common/logger.js';
import slugify from '@sindresorhus/slugify';
import { useTranslation } from 'react-i18next';
import { handleError } from '../ui/error-helper.js';
import MediaPlayer from './media-player/media-player.js';
import { MEDIA_SCREEN_MODE } from '../domain/constants.js';
import React, { useEffect, useRef, useState } from 'react';
import { useIsMounted, useOnComponentUnmount } from '../ui/hooks.js';
import { useRunningAudioContext } from './media-player/media-hooks.js';
import MediaPlayerProgressBar from './media-player/media-player-progress-bar.js';
import { hasMoreWordCharactersThanNonWordCharacters } from '../utils/string-utils.js';
import MediaPlayerControls, { MEDIA_PLAYER_CONTROLS_STATE } from './media-player/media-player-controls.js';

const logger = new Logger(import.meta.url);

const synthOptions = {
  chordsOff: true,
  soundFontUrl: 'https://educandu.github.io/abcjs-soundfonts/FluidR3_Salamander_GM'
};

const registerUrlForDisposal = url => url && setTimeout(() => URL.revokeObjectURL(url), 1000);

const createDownloadFileName = renderResult => {
  const songTitleBaseName = slugify(renderResult?.[0]?.metaText?.title || '');
  return songTitleBaseName.length > 3 && songTitleBaseName.length < 100 && hasMoreWordCharactersThanNonWordCharacters(songTitleBaseName)
    ? `${songTitleBaseName}.wav`
    : 'generated-audio.wav';
};

function AbcPlayer({ renderResult, initialVolume }) {
  const { t } = useTranslation();
  const isMounted = useIsMounted();
  const mediaPlayerRef = useRef(null);
  const lastRenderResult = useRef(null);
  const [soundUrl, setSoundUrl] = useState(null);
  const [shouldPlayAfterRendering, setShouldPlayAfterRendering] = useState(false);
  const [runningAudioContext, createRunningAudioContext] = useRunningAudioContext();
  const [downloadFileName, setDownloadTitle] = useState(createDownloadFileName(renderResult));

  lastRenderResult.current = renderResult;

  useEffect(() => {
    setShouldPlayAfterRendering(false);
  }, [renderResult]);

  useOnComponentUnmount(() => {
    registerUrlForDisposal(soundUrl);
  });

  useEffect(() => {
    if (!renderResult || !runningAudioContext || !isMounted) {
      return;
    }

    (async () => {
      const createSynth = new abcjs.synth.CreateSynth();
      try {
        await createSynth.init({ audioContext: runningAudioContext, visualObj: renderResult[0], options: synthOptions });
        await createSynth.prime();
        if (renderResult === lastRenderResult.current && isMounted.current) {
          setSoundUrl(oldValue => {
            registerUrlForDisposal(oldValue);
            return createSynth.download();
          });
          setDownloadTitle(createDownloadFileName(renderResult));
        }
      } catch (error) {
        handleError({ message: error.message, logger, t });
      }
    })();
  }, [renderResult, runningAudioContext, isMounted, t]);

  const handlePlayClick = () => {
    setShouldPlayAfterRendering(true);
    createRunningAudioContext();
  };

  const handleMediaPlayerDuration = () => {
    if (shouldPlayAfterRendering) {
      setTimeout(() => mediaPlayerRef.current.play(), 0);
    }
    setShouldPlayAfterRendering(false);
  };

  let controlsState;
  if (!renderResult) {
    controlsState = MEDIA_PLAYER_CONTROLS_STATE.disabled;
  } else if (!runningAudioContext) {
    controlsState = MEDIA_PLAYER_CONTROLS_STATE.waiting;
  } else if (!soundUrl) {
    controlsState = MEDIA_PLAYER_CONTROLS_STATE.loading;
  } else {
    controlsState = null;
  }

  if (controlsState) {
    return (
      <div className="AbcPlayer">
        <div className="AbcPlayer-controls">
          <MediaPlayerProgressBar disabled />
          <MediaPlayerControls
            allowLoop
            allowDownload
            allowPlaybackRate
            state={controlsState}
            volume={initialVolume}
            onPlayClick={handlePlayClick}
            />
        </div>
      </div>
    );
  }

  return (
    <div className="AbcPlayer">
      <MediaPlayer
        allowLoop
        allowDownload
        sourceUrl={soundUrl}
        volume={initialVolume}
        mediaPlayerRef={mediaPlayerRef}
        screenMode={MEDIA_SCREEN_MODE.none}
        downloadFileName={downloadFileName}
        onDuration={handleMediaPlayerDuration}
        />
    </div>
  );
}

AbcPlayer.propTypes = {
  renderResult: PropTypes.arrayOf(PropTypes.object),
  initialVolume: PropTypes.number
};

AbcPlayer.defaultProps = {
  renderResult: null,
  initialVolume: 1
};

export default AbcPlayer;
