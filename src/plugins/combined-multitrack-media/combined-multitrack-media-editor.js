import { Button, Form } from 'antd';
import Info from '../../components/info.js';
import React, { useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import cloneDeep from '../../utils/clone-deep.js';
import ItemPanel from '../../components/item-panel.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import TrackEditor from '../../components/media-player/track-editor.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import WarningIcon from '../../components/icons/general/warning-icon.js';
import DragAndDropContainer from '../../components/drag-and-drop-container.js';
import { createDefaultPlayer2Track } from './combined-multitrack-media-utils.js';
import PlayerSettingsEditor from '../../components/media-player/player-settings-editor.js';
import { moveItem, removeItemAt, replaceItemAt, swapItemsAt } from '../../utils/array-utils.js';

function CombinedMultitrackMediaEditor({ content, onContentChanged }) {
  const droppableIdRef = useRef(useId());
  const { t } = useTranslation('combinedMultitrackMedia');

  const { player1, player2, width } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChanged(newContent);
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

  const handleWidthChanged = newValue => {
    changeContent({ width: newValue });
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

  const dragAndDropPlayer2Tracks = player2.tracks.map((track, index) => {
    const headerPrefix = t('playerNumberTrackNumber', { playerNumber: 2, trackNumber: index + 1 });
    const header = `${headerPrefix}${track.name ? ': ' : ''}${track.name}`;

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
    <div className="MultitrackMediaEditor">
      <Form layout="horizontal" labelAlign="left">
        <div className="MultitrackMediaEditor-warning">
          <WarningIcon className="MultitrackMediaEditor-warningIcon" />
          {t('common:playerNotSupportedOnIOS')}
        </div>

        <ItemPanel header={t('playerNumber', { number: 1 })}>
          <TrackEditor
            content={player1.track}
            useName={false}
            onContentChange={handlePlayer1TrackContentChange}
            />
          <PlayerSettingsEditor
            content={player1}
            useWidth={false}
            onContentChange={handlePlayer1SettingsContentChange}
            />
        </ItemPanel>

        <DragAndDropContainer
          droppableId={droppableIdRef.current}
          items={dragAndDropPlayer2Tracks}
          onItemMove={handleMovePlayer2Track}
          />

        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPlayer2TrackButtonClick}>
          {t('common:addTrack')}
        </Button>

        <Form.Item
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChanged} />
        </Form.Item>
      </Form>
    </div>
  );
}

CombinedMultitrackMediaEditor.propTypes = {
  ...sectionEditorProps
};

export default CombinedMultitrackMediaEditor;
