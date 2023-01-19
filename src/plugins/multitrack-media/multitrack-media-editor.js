import { Button, Form, Input } from 'antd';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import React, { useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import cloneDeep from '../../utils/clone-deep.js';
import ItemPanel from '../../components/item-panel.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { removeItemAt, swapItemsAt } from '../../utils/array-utils.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { createDefaultSecondaryTrack } from './multitrack-media-utils.js';
import { FORM_ITEM_LAYOUT, MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import MainTrackEditor from '../../components/media-player/main-track-editor.js';
import TrackMixerEditor from '../../components/media-player/track-mixer-editor.js';
import SecondaryTrackEditor from '../../components/media-player/secondary-track-editor.js';
import MultitrackMediaPlayer from '../../components/media-player/plyr/multitrack-media-player.js';

const FormItem = Form.Item;

function MultitrackMediaEditor({ content, onContentChanged }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('multitrackMedia');
  const [selectedVolumePresetIndex, setSelectedVolumePresetIndex] = useState(0);

  const { width, mainTrack, secondaryTracks, volumePresets } = content;

  const sources = useMemo(() => ({
    mainTrack: {
      name: mainTrack.name,
      sourceUrl: getAccessibleUrl({
        url: mainTrack.sourceUrl,
        cdnRootUrl: clientConfig.cdnRootUrl
      }),
      playbackRange: mainTrack.playbackRange
    },
    secondaryTracks: secondaryTracks.map(track => ({
      name: track.name,
      sourceUrl: getAccessibleUrl({
        url: track.sourceUrl,
        cdnRootUrl: clientConfig.cdnRootUrl
      })
    }))
  }), [clientConfig, mainTrack, secondaryTracks]);

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
    const newSecondaryTracks = swapItemsAt(secondaryTracks, index, index - 1);
    const newVolumePresets = cloneDeep(volumePresets);
    newVolumePresets.forEach(preset => {
      preset.secondaryTracks = swapItemsAt(preset.secondaryTracks, index, index - 1);
    });
    changeContent({ secondaryTracks: newSecondaryTracks, volumePresets: newVolumePresets });
  };

  const handleMoveTrackDown = index => {
    const newSecondaryTracks = swapItemsAt(secondaryTracks, index, index + 1);
    const newVolumePresets = cloneDeep(volumePresets);
    newVolumePresets.forEach(preset => {
      preset.secondaryTracks = swapItemsAt(preset.secondaryTracks, index, index + 1);
    });
    changeContent({ secondaryTracks: newSecondaryTracks, volumePresets: newVolumePresets });
  };

  const handleDeleteTrack = index => {
    const newSecondaryTracks = removeItemAt(secondaryTracks, index);
    const newVolumePresets = cloneDeep(volumePresets);
    newVolumePresets.forEach(preset => {
      preset.secondaryTracks = removeItemAt(preset.secondaryTracks, index);
    });
    changeContent({ secondaryTracks: newSecondaryTracks, volumePresets: newVolumePresets });
  };

  const handleAddTrackButtonClick = () => {
    const newSecondaryTracks = cloneDeep(secondaryTracks);
    newSecondaryTracks.push(createDefaultSecondaryTrack(newSecondaryTracks.length, t));
    const newVolumePresets = cloneDeep(volumePresets);
    newVolumePresets.forEach(preset => {
      preset.secondaryTracks.push(1);
    });
    changeContent({ secondaryTracks: newSecondaryTracks, volumePresets: newVolumePresets });
  };

  const handleSelectedVolumePresetChange = volumePresetIndex => {
    setSelectedVolumePresetIndex(volumePresetIndex);
  };

  const handleVolumePresetsChange = updatedVolumePresets => {
    changeContent({ volumePresets: updatedVolumePresets });
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
              playbackRange={mainTrack.playbackRange}
              aspectRatio={mainTrack.aspectRatio}
              screenMode={mainTrack.showVideo ? MEDIA_SCREEN_MODE.video : MEDIA_SCREEN_MODE.none}
              screenWidth={50}
              volumePresets={volumePresets}
              selectedVolumePresetIndex={selectedVolumePresetIndex}
              showTrackMixer={false}
              />
          </div>
          <TrackMixerEditor
            mainTrack={sources.mainTrack}
            secondaryTracks={sources.secondaryTracks}
            volumePresets={volumePresets}
            onVolumePresetsChange={handleVolumePresetsChange}
            selectedVolumePresetIndex={selectedVolumePresetIndex}
            onSelectedVolumePresetIndexChange={handleSelectedVolumePresetChange}
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
