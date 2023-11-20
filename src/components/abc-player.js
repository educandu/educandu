import abcjs from 'abcjs';
import PropTypes from 'prop-types';
import Logger from '../common/logger.js';
import { useTranslation } from 'react-i18next';
import { handleError } from '../ui/error-helper.js';
import MediaPlayer from './media-player/media-player.js';
import { AudioContext } from 'standardized-audio-context';
import React, { useEffect, useRef, useState } from 'react';
import { useIsMounted, useOnComponentUnmount } from '../ui/hooks.js';
import MediaPlayerControls from './media-player/media-player-controls.js';
import MediaPlayerProgressBar from './media-player/media-player-progress-bar.js';
import { DEFAULT_MEDIA_PLAYBACK_RATE, MEDIA_SCREEN_MODE } from '../domain/constants.js';

const logger = new Logger(import.meta.url);

const synthOptions = {
  chordsOff: true,
  soundFontUrl: 'https://educandu.github.io/abcjs-soundfonts/FluidR3_Salamander_GM'
};

let globalAudioContext;

const registerUrlForDisposal = url => url && setTimeout(() => URL.revokeObjectURL(url), 1000);

function AbcPlayer({ renderResult }) {
  const { t } = useTranslation();
  const isMounted = useIsMounted();
  const mediaPlayerRef = useRef(null);
  const currentRenderResult = useRef(null);
  const [soundUrl, setSoundUrl] = useState(null);
  const [runningAudioContext, setRunningAudioContext] = useState(null);
  const [shouldPlayAfterRendering, setShouldPlayAfterRendering] = useState(false);

  currentRenderResult.current = renderResult;

  useEffect(() => {
    setShouldPlayAfterRendering(false);
  }, [renderResult]);

  useEffect(() => {
    if (!globalAudioContext) {
      globalAudioContext = new AudioContext();
    }

    if (globalAudioContext.state !== 'running') {
      const listener = () => {
        if (globalAudioContext.state === 'running') {
          setRunningAudioContext(globalAudioContext);
        }
      };

      globalAudioContext.addEventListener('statechange', listener);
      return () => globalAudioContext.removeEventListener('statechange', listener);
    }

    setRunningAudioContext(globalAudioContext);
    return () => {};
  }, []);

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
        if (renderResult === currentRenderResult.current && isMounted.current) {
          setSoundUrl(oldValue => {
            registerUrlForDisposal(oldValue);
            return createSynth.download();
          });
        }
      } catch (error) {
        handleError({ message: error.message, logger, t });
      }
    })();
  }, [renderResult, runningAudioContext, isMounted, t]);

  const handleAudioContextResumeRequested = () => {
    setShouldPlayAfterRendering(true);
    setTimeout(() => globalAudioContext.resume(), 0);
  };

  const handleMediaPlayerDuration = () => {
    if (shouldPlayAfterRendering) {
      setTimeout(() => mediaPlayerRef.current.play(), 0);
    }
    setShouldPlayAfterRendering(false);
  };

  if (!renderResult) {
    // No render result, show disabled audio player controls:
    return (
      <div>
        <MediaPlayerProgressBar disabled />
        <MediaPlayerControls
          volume={1}
          isPlaying={false}
          loopMedia={false}
          playedMilliseconds={0}
          durationInMilliseconds={0}
          screenMode={MEDIA_SCREEN_MODE.none}
          playbackRate={DEFAULT_MEDIA_PLAYBACK_RATE}
          onPlayClick={() => {}}
          onPauseClick={() => {}}
          onVolumeChange={() => {}}
          onLoopMediaChange={() => {}}
          onPlaybackRateChange={() => {}}
          />
      </div>
    );
  }

  if (!runningAudioContext) {
    // No audio context, wait for user pressing play (disable other controls):
    return (
      <div>
        <MediaPlayerProgressBar disabled />
        <MediaPlayerControls
          volume={1}
          isPlaying={false}
          loopMedia={false}
          playedMilliseconds={0}
          durationInMilliseconds={0}
          screenMode={MEDIA_SCREEN_MODE.none}
          playbackRate={DEFAULT_MEDIA_PLAYBACK_RATE}
          onPauseClick={() => {}}
          onVolumeChange={() => {}}
          onLoopMediaChange={() => {}}
          onPlaybackRateChange={() => {}}
          onPlayClick={handleAudioContextResumeRequested}
          />
      </div>
    );
  }

  if (!soundUrl) {
    // No sound URL for the current renderResult, wait for rendering (show loading state)
    return (
      <div>
        <MediaPlayerProgressBar disabled />
        <MediaPlayerControls
          volume={1}
          isPlaying={false}
          loopMedia={false}
          playedMilliseconds={0}
          durationInMilliseconds={0}
          screenMode={MEDIA_SCREEN_MODE.none}
          playbackRate={DEFAULT_MEDIA_PLAYBACK_RATE}
          onPlayClick={() => {}}
          onPauseClick={() => {}}
          onVolumeChange={() => {}}
          onLoopMediaChange={() => {}}
          onPlaybackRateChange={() => {}}
          />
      </div>
    );
  }

  // Otherwise everything is loaded and the user can play:
  return (
    <MediaPlayer
      allowLoop
      allowDownload
      sourceUrl={soundUrl}
      mediaPlayerRef={mediaPlayerRef}
      screenMode={MEDIA_SCREEN_MODE.none}
      downloadFileName="generated-audio.wav"
      onDuration={handleMediaPlayerDuration}
      />
  );
}

AbcPlayer.propTypes = {
  renderResult: PropTypes.arrayOf(PropTypes.object)
};

AbcPlayer.defaultProps = {
  renderResult: null
};

export default AbcPlayer;
