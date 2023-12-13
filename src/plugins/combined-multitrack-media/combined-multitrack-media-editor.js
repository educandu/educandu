import { Button, Form } from 'antd';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import cloneDeep from '../../utils/clone-deep.js';
import ItemPanel from '../../components/item-panel.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { shouldDisableVideo } from '../../utils/media-utils.js';
import React, { useId, useMemo, useRef, useState } from 'react';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import TrackEditor from '../../components/media-player/track-editor.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import WarningIcon from '../../components/icons/general/warning-icon.js';
import DragAndDropContainer from '../../components/drag-and-drop-container.js';
import { createDefaultPlayer2Track } from './combined-multitrack-media-utils.js';
import TrackMixerEditor from '../../components/media-player/track-mixer-editor.js';
import PlayerSettingsEditor from '../../components/media-player/player-settings-editor.js';
import MultitrackMediaPlayer from '../../components/media-player/multitrack-media-player.js';
import { moveItem, removeItemAt, replaceItemAt, swapItemsAt } from '../../utils/array-utils.js';

function CombinedMultitrackMediaEditor({ content, onContentChanged }) {
  const droppableIdRef = useRef(useId());
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('combinedMultitrackMedia');

  const { note, width, player1, player2 } = content;

  const [selectedVolumePresetIndex, setSelectedVolumePresetIndex] = useState(0);
  const [disableVideo, setDisableVideo] = useState(shouldDisableVideo(player1.track.sourceUrl));

  const player2Sources = useMemo(() => {
    return player2.tracks.map(track => ({
      ...track,
      sourceUrl: getAccessibleUrl({ url: track.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    }));
  }, [player2.tracks, clientConfig]);

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };

    const shouldDisableVideoOnNewUrl = shouldDisableVideo(newContent.player1.track.sourceUrl);
    const shouldDisableVideoOnOldUrl = shouldDisableVideo(content.player1.track.sourceUrl);

    console.log('shouldDisableVideoOnNewUrl', shouldDisableVideoOnNewUrl);
    console.log('shouldDisableVideoOnOldUrl', shouldDisableVideoOnOldUrl);
    const autoEnableVideo = !!shouldDisableVideoOnOldUrl && !shouldDisableVideoOnNewUrl;
    const autoDisableVideo = !!shouldDisableVideoOnNewUrl;
    newContent.player1.showVideo = autoDisableVideo ? false : autoEnableVideo || newContent.player1.showVideo;
    newContent.player1.posterImage = autoDisableVideo ? { sourceUrl: '' } : newContent.player1.posterImage;

    setDisableVideo(autoDisableVideo);
    onContentChanged(newContent);
  };

  const handleNoteChange = event => {
    changeContent({ note: event.target.value });
  };

  const handleWidthChange = newValue => {
    changeContent({ width: newValue });
  };

  const handlePlayer1TrackContentChange = newTrack => {
    changeContent({ player1: { ...player1, track: newTrack } });
  };

  const handlePlayer2TrackContentChange = (index, newTrack) => {
    const newTracks = replaceItemAt(player2.tracks, newTrack, index);
    changeContent({ player2: { ...player2, tracks: newTracks } });
  };

  const handlePlayer1SettingsContentChange = newSettings => {
    changeContent({ player1: { ...player1, ...newSettings } });
  };

  const handleMovePlayer2TrackUp = index => {
    const newTracks = swapItemsAt(player2.tracks, index, index - 1);
    const newVolumePresets = cloneDeep(player2.volumePresets);
    newVolumePresets.forEach(preset => {
      preset.tracks = swapItemsAt(preset.tracks, index, index - 1);
    });
    changeContent({ player2: { ...player2, tracks: newTracks, volumePresets: newVolumePresets } });
  };

  const handleMovePlayer2TrackDown = index => {
    const newTracks = swapItemsAt(player2.tracks, index, index + 1);
    const newVolumePresets = cloneDeep(player2.volumePresets);
    newVolumePresets.forEach(preset => {
      preset.tracks = swapItemsAt(preset.tracks, index, index + 1);
    });
    changeContent({ player2: { ...player2, tracks: newTracks, volumePresets: newVolumePresets } });
  };

  const handleMovePlayer2Track = (fromIndex, toIndex) => {
    const newTracks = moveItem(player2.tracks, fromIndex, toIndex);
    const newVolumePresets = cloneDeep(player2.volumePresets);
    newVolumePresets.forEach(preset => {
      preset.tracks = moveItem(preset.tracks, fromIndex, toIndex);
    });
    changeContent({ player2: { ...player2, tracks: newTracks, volumePresets: newVolumePresets } });
  };

  const handleAddPlayer2TrackButtonClick = () => {
    const newTracks = cloneDeep(player2.tracks);
    newTracks.push(createDefaultPlayer2Track());
    const newVolumePresets = cloneDeep(player2.volumePresets);
    newVolumePresets.forEach(preset => preset.tracks.push(1));
    changeContent({ player2: { ...player2, tracks: newTracks, volumePresets: newVolumePresets } });
  };

  const handleDeletePlayer2Track = index => {
    const newTracks = removeItemAt(player2.tracks, index);
    const newVolumePresets = cloneDeep(player2.volumePresets);
    newVolumePresets.forEach(preset => {
      preset.tracks = removeItemAt(preset.tracks, index);
    });
    changeContent({ player2: { ...player2, tracks: newTracks, volumePresets: newVolumePresets } });
  };

  const handleSelectedVolumePresetChange = volumePresetIndex => {
    setSelectedVolumePresetIndex(volumePresetIndex);
  };

  const handleVolumePresetsChange = updatedVolumePresets => {
    changeContent({ player2: { ...player2, volumePresets: updatedVolumePresets } });
  };

  const dragAndDropPlayer2Tracks = player2.tracks.map((track, index) => {
    const headerPrefix1 = t('playerNumber', { number: 2 });
    const headerPrefix2 = t('common:secondaryTrack', { number: index + 1 });
    const header = `${headerPrefix1} - ${headerPrefix2}${track.name ? ': ' : ''}${track.name}`;

    return {
      key: track.key,
      render: ({ dragHandleProps, isDragged, isOtherDragged }) => {
        return (
          <ItemPanel
            collapsed
            canDeleteLastItem={false}
            header={header}
            isDragged={isDragged}
            isOtherDragged={isOtherDragged}
            dragHandleProps={dragHandleProps}
            index={index}
            itemsCount={player2.tracks.length}
            key={track.key}
            onMoveUp={() => handleMovePlayer2TrackUp(index)}
            onMoveDown={() => handleMovePlayer2TrackDown(index)}
            onDelete={() => handleDeletePlayer2Track(index)}
            >
            <TrackEditor
              content={track}
              usePlaybackRange={false}
              onContentChange={value => handlePlayer2TrackContentChange(index, value)}
              />
          </ItemPanel>
        );
      }
    };
  });

  return (
    <div className="CombinedMultitrackMediaEditor">
      <Form layout="horizontal" labelAlign="left">
        <div className="CombinedMultitrackMediaEditor-warning">
          <WarningIcon className="CombinedMultitrackMediaEditor-warningIcon" />
          {t('common:playerNotSupportedOnIOS')}
        </div>

        <Form.Item
          {...FORM_ITEM_LAYOUT}
          label={<Info tooltip={t('noteInfo')}>{t('note')}</Info>}
          >
          <MarkdownInput inline value={note} onChange={handleNoteChange} />
        </Form.Item>

        <Form.Item
          {...FORM_ITEM_LAYOUT}
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </Form.Item>

        <ItemPanel header={t('playerNumber', { number: 1 })}>
          <TrackEditor
            content={player1.track}
            useName={false}
            onContentChange={handlePlayer1TrackContentChange}
            />
          <PlayerSettingsEditor
            content={player1}
            useWidth={false}
            disableVideo={disableVideo}
            onContentChange={handlePlayer1SettingsContentChange}
            />
        </ItemPanel>

        <DragAndDropContainer
          droppableId={droppableIdRef.current}
          items={dragAndDropPlayer2Tracks}
          onItemMove={handleMovePlayer2Track}
          />

        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPlayer2TrackButtonClick}>
          {t('addPlayer2Track')}
        </Button>

        <ItemPanel header={`${t('playerNumber', { number: 2 } )} - ${t('common:trackMixer')}`}>
          <div className="CombinedMultitrackMediaEditor-trackMixerPreview">
            <div className="CombinedMultitrackMediaEditor-trackMixerPreviewLabel">
              {t('common:preview')}
            </div>
            <MultitrackMediaPlayer
              initialVolume={player2.initialVolume}
              selectedVolumePresetIndex={selectedVolumePresetIndex}
              showVideo={false}
              showTrackMixer={false}
              sources={player2Sources}
              volumePresets={player2.volumePresets}
              />
          </div>
          <TrackMixerEditor
            tracks={player2Sources}
            volumePresets={player2.volumePresets}
            onVolumePresetsChange={handleVolumePresetsChange}
            selectedVolumePresetIndex={selectedVolumePresetIndex}
            onSelectedVolumePresetIndexChange={handleSelectedVolumePresetChange}
            />
        </ItemPanel>
      </Form>
    </div>
  );
}

CombinedMultitrackMediaEditor.propTypes = {
  ...sectionEditorProps
};

export default CombinedMultitrackMediaEditor;
