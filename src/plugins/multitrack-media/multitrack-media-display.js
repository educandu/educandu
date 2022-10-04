import urlUtils from '../../utils/url-utils.js';
import React, { useRef, useState } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import { MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MultitrackMediaPlayer from '../../components/media-player/multitrack-media-player.js';

function MultitrackMediaDisplay({ content }) {
  const playerRef = useRef(null);
  const clientConfig = useService(ClientConfig);

  const { width, mainTrack, secondaryTracks, volumePresets } = content;

  const [selectedVolumePresetIndex, setSelectedVolumePresetIndex] = useState(0);

  const sources = {
    mainTrack: {
      name: mainTrack.name,
      sourceUrl: urlUtils.getMediaUrl({
        sourceUrl: mainTrack.sourceUrl,
        sourceType: mainTrack.sourceType,
        cdnRootUrl: clientConfig.cdnRootUrl
      }),
      volume: volumePresets[selectedVolumePresetIndex].mainTrack,
      playbackRange: mainTrack.playbackRange
    },
    secondaryTracks: secondaryTracks.map((track, index) => ({
      name: track.name,
      sourceUrl: urlUtils.getMediaUrl({
        sourceUrl: track.sourceUrl,
        sourceType: track.sourceType,
        cdnRootUrl: clientConfig.cdnRootUrl
      }),
      volume: volumePresets[selectedVolumePresetIndex].secondaryTracks[index]
    }))
  };

  const combinedCopyrightNotice = [mainTrack.copyrightNotice, ...secondaryTracks.map(track => track.copyrightNotice)].filter(text => !!text).join('\n\n');

  const handleSelectedVolumePresetChange = volumePresetIndex => {
    setSelectedVolumePresetIndex(volumePresetIndex);
  };

  return (
    <div className="MultitrackMediaDisplay">
      <div className={`MultitrackMediaDisplay-content u-width-${width || 100}`}>
        <MultitrackMediaPlayer
          sources={sources}
          aspectRatio={mainTrack.aspectRatio}
          screenMode={mainTrack.showVideo ? MEDIA_SCREEN_MODE.video : MEDIA_SCREEN_MODE.none}
          mediaPlayerRef={playerRef}
          showTrackMixer
          selectedVolumePreset={selectedVolumePresetIndex}
          onSelectedVolumePresetChange={handleSelectedVolumePresetChange}
          volumePresetOptions={volumePresets.map((preset, index) => ({ label: preset.name, value: index }))}
          />
        <CopyrightNotice value={combinedCopyrightNotice} />
      </div>
    </div>
  );
}

MultitrackMediaDisplay.propTypes = {
  ...sectionDisplayProps
};

export default MultitrackMediaDisplay;
