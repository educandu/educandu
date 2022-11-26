import { Button, Form, Input } from 'antd';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import React, { useRef, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import cloneDeep from '../../utils/clone-deep.js';
import ItemPanel from '../../components/item-panel.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import TrackMixer from '../../components/media-player/track-mixer.js';
import { removeItemAt, swapItemsAt } from '../../utils/array-utils.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { createDefaultSecondaryTrack } from './multitrack-media-utils.js';
import { FORM_ITEM_LAYOUT, MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import MainTrackEditor from '../../components/media-player/main-track-editor.js';
import SecondaryTrackEditor from '../../components/media-player/secondary-track-editor.js';
import MultitrackMediaPlayer from '../../components/media-player/multitrack-media-player.js';

const FormItem = Form.Item;

function MultitrackMediaEditor({ content, onContentChanged }) {
  const playerRef = useRef(null);
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('multitrackMedia');

  const { width, mainTrack, secondaryTracks, volumePresets } = content;

  const [selectedVolumePresetIndex, setSelectedVolumePresetIndex] = useState(0);

  const sources = {
    mainTrack: {
      name: mainTrack.name,
      sourceUrl: getAccessibleUrl({
        url: mainTrack.sourceUrl,
        cdnRootUrl: clientConfig.cdnRootUrl
      }),
      volume: volumePresets[selectedVolumePresetIndex].mainTrack,
      playbackRange: mainTrack.playbackRange
    },
    secondaryTracks: secondaryTracks.map((track, index) => ({
      name: track.name,
      sourceUrl: getAccessibleUrl({
        url: track.sourceUrl,
        cdnRootUrl: clientConfig.cdnRootUrl
      }),
      volume: volumePresets[selectedVolumePresetIndex].secondaryTracks[index]
    }))
  };

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isInvalid = false;
    onContentChanged(newContent, isInvalid);
  };

  const handleMainTrackNameChanged = event => {
    const { value } = event.target;
    changeContent({ mainTrack: { ...mainTrack, name: value } });
  };

  const handeSecondaryTrackContentChanged = (index, value) => {
    const newSecondaryTracks = cloneDeep(secondaryTracks);
    newSecondaryTracks[index] = value;
    changeContent({ secondaryTracks: newSecondaryTracks });
  };

  const handleMainTrackContentChanged = newMainTrackContent => {
    changeContent({ mainTrack: newMainTrackContent });
  };

  const handleWidthChanged = newValue => {
    changeContent({ width: newValue });
  };

  const handleMoveTrackUp = index => {
    changeContent({ secondaryTracks: swapItemsAt(secondaryTracks, index, index - 1) });
  };

  const handleMoveTrackDown = index => {
    changeContent({ secondaryTracks: swapItemsAt(secondaryTracks, index, index + 1) });
  };

  const handleDeleteTrack = index => {
    changeContent({ secondaryTracks: removeItemAt(secondaryTracks, index) });
  };

  const handleAddTrackButtonClick = () => {
    const newSecondaryTracks = secondaryTracks.slice();
    newSecondaryTracks.push(createDefaultSecondaryTrack(newSecondaryTracks.length, t));
    const newVolumePresets = volumePresets.slice();
    newVolumePresets.forEach(preset => preset.secondaryTracks.push(1));
    changeContent({ secondaryTracks: newSecondaryTracks, volumePresets: newVolumePresets });
  };

  const handleSelectedVolumePresetChange = volumePresetIndex => {
    setSelectedVolumePresetIndex(volumePresetIndex);
  };

  const handleVolumePresetsChange = updatedVolumePresets => {
    changeContent({ volumePresets: updatedVolumePresets });
  };

  const handleMainTrackVolumeChange = volume => {
    const newVolumePresets = cloneDeep(volumePresets);
    newVolumePresets[selectedVolumePresetIndex].mainTrack = volume;
    changeContent({ volumePresets: newVolumePresets });
  };

  const handleSecondaryTrackVolumeChange = (volume, secondaryTrackIndex) => {
    const newVolumePresets = cloneDeep(volumePresets);
    newVolumePresets[selectedVolumePresetIndex].secondaryTracks[secondaryTrackIndex] = volume;
    changeContent({ volumePresets: newVolumePresets });
  };

  return (
    <div className="MultitrackMediaEditor">
      <Form layout="horizontal">
        <ItemPanel header={t('common:mainTrack')}>
          <FormItem label={t('common:name')} {...FORM_ITEM_LAYOUT}>
            <Input value={mainTrack?.name} onChange={handleMainTrackNameChanged} />
          </FormItem>
          <MainTrackEditor
            content={mainTrack}
            onContentChanged={handleMainTrackContentChanged}
            />
        </ItemPanel>

        {secondaryTracks.map((secondaryTrack, index) => (
          <ItemPanel
            index={index}
            collapsed
            canDeleteLastItem
            key={index.toString()}
            itemsCount={secondaryTracks.length}
            header={t('common:secondaryTrack', { number: index + 2 })}
            onMoveUp={handleMoveTrackUp}
            onMoveDown={handleMoveTrackDown}
            onDelete={handleDeleteTrack}
            >
            <SecondaryTrackEditor
              content={secondaryTrack}
              onContentChanged={value => handeSecondaryTrackContentChanged(index, value)}
              />
          </ItemPanel>
        ))}
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTrackButtonClick}>
          {t('common:addTrack')}
        </Button>
        <ItemPanel header={t('common:trackMixer')}>
          <div className="MultitrackMediaEditor-trackMixerPreview">
            <MultitrackMediaPlayer
              sources={sources}
              aspectRatio={mainTrack.aspectRatio}
              screenMode={mainTrack.showVideo ? MEDIA_SCREEN_MODE.video : MEDIA_SCREEN_MODE.none}
              mediaPlayerRef={playerRef}
              screenWidth={50}
              />
          </div>
          <TrackMixer
            volumePresets={volumePresets}
            mainTrack={sources.mainTrack}
            secondaryTracks={sources.secondaryTracks}
            selectedVolumePreset={selectedVolumePresetIndex}
            onVolumePresetsChange={handleVolumePresetsChange}
            onMainTrackVolumeChange={handleMainTrackVolumeChange}
            onSecondaryTrackVolumeChange={handleSecondaryTrackVolumeChange}
            onSelectedVolumePresetChange={handleSelectedVolumePresetChange}
            />
        </ItemPanel>

        <FormItem
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChanged} />
        </FormItem>
      </Form>
    </div>
  );
}

MultitrackMediaEditor.propTypes = {
  ...sectionEditorProps
};

export default MultitrackMediaEditor;
