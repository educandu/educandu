import { Button, Form } from 'antd';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import cloneDeep from '../../utils/clone-deep.js';
import ItemPanel from '../../components/item-panel.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { shouldDisableVideo } from '../../utils/media-utils.js';
import React, { useId, useMemo, useRef, useState } from 'react';
import { createDefaultTrack } from './multitrack-media-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import TrackEditor from '../../components/media-player/track-editor.js';
import DragAndDropContainer from '../../components/drag-and-drop-container.js';
import { removeItemAt, swapItemsAt, moveItem } from '../../utils/array-utils.js';
import TrackMixerEditor from '../../components/media-player/track-mixer-editor.js';
import PlayerSettingsEditor from '../../components/media-player/player-settings-editor.js';
import MultitrackMediaPlayer from '../../components/media-player/multitrack-media-player.js';

function MultitrackMediaEditor({ content, onContentChanged }) {
  const droppableIdRef = useRef(useId());
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('multitrackMedia');

  const [selectedVolumePresetIndex, setSelectedVolumePresetIndex] = useState(0);
  const [disableVideo, setDisableVideo] = useState(shouldDisableVideo(content.tracks[0].sourceUrl));

  const { tracks, volumePresets, showVideo, aspectRatio, posterImage, initialVolume } = content;

  const sources = useMemo(() => {
    return tracks.map(track => ({
      ...track,
      sourceUrl: getAccessibleUrl({ url: track.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    }));
  }, [tracks, clientConfig]);

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const shouldDisableVideoOnNewUrl = shouldDisableVideo(newContent.sourceUrl);
    const shouldDisableVideoOnOldUrl = shouldDisableVideo(content.sourceUrl);

    const autoEnableVideo = !!shouldDisableVideoOnOldUrl && !shouldDisableVideoOnNewUrl;
    const autoDisableVideo = !!shouldDisableVideoOnNewUrl;
    newContent.showVideo = autoDisableVideo ? false : autoEnableVideo || newContent.showVideo;
    newContent.posterImage = autoDisableVideo ? { sourceUrl: '' } : newContent.posterImage;

    setDisableVideo(autoDisableVideo);
    onContentChanged(newContent);
  };

  const handeTrackContentChange = (index, value) => {
    const newTracks = cloneDeep(tracks);
    newTracks[index] = value;
    changeContent({ tracks: newTracks });
  };

  const handleMoveTrackUp = index => {
    const newTracks = swapItemsAt(tracks, index, index - 1);
    const newVolumePresets = cloneDeep(volumePresets);
    newVolumePresets.forEach(preset => {
      preset.tracks = swapItemsAt(preset.tracks, index, index - 1);
    });
    changeContent({ tracks: newTracks, volumePresets: newVolumePresets });
  };

  const handleMoveTrackDown = index => {
    const newTracks = swapItemsAt(tracks, index, index + 1);
    const newVolumePresets = cloneDeep(volumePresets);
    newVolumePresets.forEach(preset => {
      preset.tracks = swapItemsAt(preset.tracks, index, index + 1);
    });
    changeContent({ tracks: newTracks, volumePresets: newVolumePresets });
  };

  const handleMoveSecondaryTrack = (fromSecondaryTrackIndex, toSecondaryTrackIndex) => {
    const fromIndex = fromSecondaryTrackIndex + 1;
    const toIndex = toSecondaryTrackIndex + 1;
    const newTracks = moveItem(tracks, fromIndex, toIndex);
    const newVolumePresets = cloneDeep(volumePresets);
    newVolumePresets.forEach(preset => {
      preset.tracks = moveItem(preset.tracks, fromIndex, toIndex);
    });
    changeContent({ tracks: newTracks, volumePresets: newVolumePresets });
  };

  const handleDeleteTrack = index => {
    const newTracks = removeItemAt(tracks, index);
    const newVolumePresets = cloneDeep(volumePresets);
    newVolumePresets.forEach(preset => {
      preset.tracks = removeItemAt(preset.tracks, index);
    });
    changeContent({ tracks: newTracks, volumePresets: newVolumePresets });
  };

  const handleAddTrackButtonClick = () => {
    const newTracks = cloneDeep(tracks);
    newTracks.push(createDefaultTrack());
    const newVolumePresets = cloneDeep(volumePresets);
    newVolumePresets.forEach(preset => preset.tracks.push(1));
    changeContent({ tracks: newTracks, volumePresets: newVolumePresets });
  };

  const handlePlayerSettingsContentChange = changedContent => {
    changeContent(changedContent);
  };

  const handleSelectedVolumePresetChange = volumePresetIndex => {
    setSelectedVolumePresetIndex(volumePresetIndex);
  };

  const handleVolumePresetsChange = updatedVolumePresets => {
    changeContent({ volumePresets: updatedVolumePresets });
  };

  const secondaryTracksCount = tracks.length - 1;

  const dragAndDropSecondaryTracks = tracks.slice(1).map((track, secondaryTrackIndex) => {
    const headerPrefix = t('common:secondaryTrack', { number: secondaryTrackIndex + 2 });
    const header = `${headerPrefix}${track.name ? ': ' : ''}${track.name}`;
    const trackIndex = secondaryTrackIndex + 1;

    return {
      key: track.key,
      render: ({ dragHandleProps, isDragged, isOtherDragged }) => {
        return (
          <ItemPanel
            collapsed
            canDeleteLastItem
            header={header}
            isDragged={isDragged}
            isOtherDragged={isOtherDragged}
            dragHandleProps={dragHandleProps}
            index={secondaryTrackIndex}
            itemsCount={secondaryTracksCount}
            key={track.key}
            onMoveUp={() => handleMoveTrackUp(trackIndex)}
            onMoveDown={() => handleMoveTrackDown(trackIndex)}
            onDelete={() => handleDeleteTrack(trackIndex)}
            >
            <TrackEditor
              content={track}
              usePlaybackRange={false}
              onContentChange={value => handeTrackContentChange(trackIndex, value)}
              />
          </ItemPanel>
        );
      }
    };
  });

  return (
    <div className="MultitrackMediaEditor">
      <Form layout="horizontal" labelAlign="left">
        <ItemPanel
          collapsed
          key={tracks[0].key}
          header={`${t('common:mainTrack')}${tracks[0].name ? ': ' : ''}${tracks[0].name}`}
          >
          <TrackEditor
            content={tracks[0]}
            onContentChange={value => handeTrackContentChange(0, value)}
            />
        </ItemPanel>
        <DragAndDropContainer droppableId={droppableIdRef.current} items={dragAndDropSecondaryTracks} onItemMove={handleMoveSecondaryTrack} />

        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTrackButtonClick}>
          {t('common:addTrack')}
        </Button>

        <ItemPanel header={t('common:player')}>
          <PlayerSettingsEditor
            content={content}
            disableVideo={disableVideo}
            onContentChange={handlePlayerSettingsContentChange}
            />
        </ItemPanel>

        <ItemPanel header={t('common:trackMixer')}>
          <div className="MultitrackMediaEditor-trackMixerPreview">
            <div className="MultitrackMediaEditor-trackMixerPreviewLabel">
              {t('common:preview')}
            </div>
            <MultitrackMediaPlayer
              aspectRatio={aspectRatio}
              initialVolume={initialVolume}
              posterImageUrl={getAccessibleUrl({ url: posterImage.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
              screenWidth={50}
              selectedVolumePresetIndex={selectedVolumePresetIndex}
              showVideo={!disableVideo && showVideo}
              showTrackMixer={false}
              sources={sources}
              volumePresets={volumePresets}
              />
          </div>
          <TrackMixerEditor
            tracks={sources}
            volumePresets={volumePresets}
            onVolumePresetsChange={handleVolumePresetsChange}
            selectedVolumePresetIndex={selectedVolumePresetIndex}
            onSelectedVolumePresetIndexChange={handleSelectedVolumePresetChange}
            />
        </ItemPanel>
      </Form>
    </div>
  );
}

MultitrackMediaEditor.propTypes = {
  ...sectionEditorProps
};

export default MultitrackMediaEditor;
