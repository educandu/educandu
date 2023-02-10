import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import React, { useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import cloneDeep from '../../utils/clone-deep.js';
import { Button, Form, Radio, Switch } from 'antd';
import UrlInput from '../../components/url-input.js';
import ItemPanel from '../../components/item-panel.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { analyzeMediaUrl } from '../../utils/media-utils.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { createDefaultTrack } from './multitrack-media-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import TrackEditor from '../../components/media-player/track-editor.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import TrackMixerEditor from '../../components/media-player/track-mixer-editor.js';
import MediaVolumeSlider from '../../components/media-player/media-volume-slider.js';
import { ensureIsExcluded, removeItemAt, swapItemsAt } from '../../utils/array-utils.js';
import MultitrackMediaPlayer from '../../components/media-player/multitrack-media-player.js';
import { FORM_ITEM_LAYOUT, MEDIA_ASPECT_RATIO, RESOURCE_TYPE, SOURCE_TYPE } from '../../domain/constants.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const shouldDisableVideo = sourceUrl => {
  const { resourceType } = analyzeMediaUrl(sourceUrl);
  return ![RESOURCE_TYPE.video, RESOURCE_TYPE.none, RESOURCE_TYPE.unknown].includes(resourceType);
};

function MultitrackMediaEditor({ content, onContentChanged }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('multitrackMedia');
  const [selectedVolumePresetIndex, setSelectedVolumePresetIndex] = useState(0);

  const { tracks, volumePresets, showVideo, aspectRatio, posterImage, width, initialVolume } = content;

  const sources = useMemo(() => {
    return tracks.map(track => ({
      ...track,
      sourceUrl: getAccessibleUrl({ url: track.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    }));
  }, [tracks, clientConfig]);

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChanged(newContent);
  };

  const handeTrackContentChanged = (index, value) => {
    const newTracks = cloneDeep(tracks);
    newTracks[index] = value;
    changeContent({ tracks: newTracks });
  };

  const handleAspectRatioChanged = event => {
    changeContent({ aspectRatio: event.target.value });
  };

  const handleShowVideoChanged = value => {
    const newContent = { showVideo: value };

    if (!newContent.showVideo) {
      newContent.posterImage = { sourceUrl: '' };
    }

    changeContent(newContent);
  };

  const handlePosterImageSourceUrlChange = url => {
    changeContent({ posterImage: { sourceUrl: url } });
  };

  const handleWidthChanged = newValue => {
    changeContent({ width: newValue });
  };

  const handleInitialVolumeChange = newValue => {
    changeContent({ initialVolume: newValue });
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

  const handleSelectedVolumePresetChange = volumePresetIndex => {
    setSelectedVolumePresetIndex(volumePresetIndex);
  };

  const handleVolumePresetsChange = updatedVolumePresets => {
    changeContent({ volumePresets: updatedVolumePresets });
  };

  const renderTrackPanel = (track, trackIndex) => {
    if (trackIndex === 0) {
      return (
        <ItemPanel
          collapsed
          header={t('common:mainTrack')}
          key={track.key}
          >
          <TrackEditor
            content={track}
            usePlaybackRange
            onContentChanged={value => handeTrackContentChanged(trackIndex, value)}
            />
        </ItemPanel>
      );
    }

    const indexWithinSecondaryTracks = trackIndex - 1;
    const secondaryTracksCount = tracks.length - 1;

    const headerPrefix = t('common:secondaryTrack', { number: indexWithinSecondaryTracks + 2 });
    const header = `${headerPrefix}${track.name ? ': ' : ''}${track.name}`;

    return (
      <ItemPanel
        collapsed
        header={header}
        index={indexWithinSecondaryTracks}
        itemsCount={secondaryTracksCount}
        key={track.key}
        onMoveUp={() => handleMoveTrackUp(trackIndex)}
        onMoveDown={() => handleMoveTrackDown(trackIndex)}
        onDelete={() => handleDeleteTrack(trackIndex)}
        >
        <TrackEditor
          content={track}
          onContentChanged={value => handeTrackContentChanged(trackIndex, value)}
          />
      </ItemPanel>
    );
  };

  return (
    <div className="MultitrackMediaEditor">
      <Form layout="horizontal" labelAlign="left">
        {tracks.map(renderTrackPanel)}

        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTrackButtonClick}>
          {t('common:addTrack')}
        </Button>

        <ItemPanel header={t('common:player')}>
          <FormItem label={t('common:aspectRatio')} {...FORM_ITEM_LAYOUT}>
            <RadioGroup
              value={aspectRatio}
              defaultValue={MEDIA_ASPECT_RATIO.sixteenToNine}
              disabled={shouldDisableVideo(tracks[0].sourceUrl)}
              onChange={handleAspectRatioChanged}
              >
              {Object.values(MEDIA_ASPECT_RATIO).map(ratio => (
                <RadioButton key={ratio} value={ratio}>{ratio}</RadioButton>
              ))}
            </RadioGroup>
          </FormItem>
          <FormItem label={t('common:videoDisplay')} {...FORM_ITEM_LAYOUT}>
            <Switch
              size="small"
              checked={showVideo}
              disabled={shouldDisableVideo(tracks[0].sourceUrl)}
              onChange={handleShowVideoChanged}
              />
          </FormItem>
          <FormItem label={t('common:posterImageUrl')} {...FORM_ITEM_LAYOUT}>
            <UrlInput
              value={posterImage.sourceUrl}
              allowedSourceTypes={ensureIsExcluded(Object.values(SOURCE_TYPE), SOURCE_TYPE.youtube)}
              disabled={shouldDisableVideo(tracks[0].sourceUrl) || !showVideo}
              onChange={handlePosterImageSourceUrlChange}
              />
          </FormItem>
          <FormItem
            label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
            {...FORM_ITEM_LAYOUT}
            >
            <ObjectWidthSlider value={width} onChange={handleWidthChanged} />
          </FormItem>
          <FormItem
            label={<Info tooltip={t('common:multitrackInitialVolumeInfo')}>{t('common:initialVolume')}</Info>}
            {...FORM_ITEM_LAYOUT}
            >
            <MediaVolumeSlider
              value={initialVolume}
              useValueLabel
              useButton={false}
              onChange={handleInitialVolumeChange}
              />
          </FormItem>
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
              showVideo={showVideo}
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
