import by from 'thenby';
import classNames from 'classnames';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import { COLOR_SWATCHES } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';
import * as reactDropzoneNs from 'react-dropzone';
import { Button, Form, Input, Tooltip } from 'antd';
import ItemPanel from '../../components/item-panel.js';
import HttpClient from '../../api-clients/http-client.js';
import { handleApiError } from '../../ui/error-helper.js';
import ColorPicker from '../../components/color-picker.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { formatMediaPosition } from '../../utils/media-utils.js';
import Timeline from '../../components/media-player/timeline.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { useNumberFormat } from '../../components/locale-context.js';
import TrackMixer from '../../components/media-player/track-mixer.js';
import { removeItemAt, swapItemsAt } from '../../utils/array-utils.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import ChapterSelector from '../../components/media-player/chapter-selector.js';
import MainTrackEditor from '../../components/media-player/main-track-editor.js';
import { useMediaDurations } from '../../components/media-player/media-hooks.js';
import SecondaryTrackEditor from '../../components/media-player/secondary-track-editor.js';
import MultitrackMediaPlayer from '../../components/media-player/multitrack-media-player.js';
import { ExportOutlined, ImportOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { createDefaultChapter, createDefaultSecondaryTrack, exportChaptersToCsv as exportChaptersAsCsv, importChaptersFromCsv } from './media-analysis-utils.js';

const useDropzone = reactDropzoneNs.default?.useDropzone || reactDropzoneNs.useDropzone;

const FormItem = Form.Item;

const logger = new Logger(import.meta.url);

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

const ensureChaptersOrder = chapters => chapters.sort(by(chapter => chapter.startPosition));

function MediaAnalysisEditor({ content, onContentChanged }) {
  const playerRef = useRef(null);
  const httpClient = useService(HttpClient);
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('mediaAnalysis');
  const { formatPercentage } = useNumberFormat();

  const { width, mainTrack, secondaryTracks, chapters, volumePresets } = content;

  const [mainTrackMediaDuration] = useMediaDurations([
    urlUtils.getMediaUrl({
      cdnRootUrl: clientConfig.cdnRootUrl,
      sourceType: mainTrack.sourceType,
      sourceUrl: mainTrack.sourceUrl
    })
  ]);

  const mainTrackSourceDuration = mainTrackMediaDuration.duration;
  const mainTrackPlaybackDuration = (mainTrack.playbackRange[1] - mainTrack.playbackRange[0]) * mainTrackSourceDuration;

  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [selectedChapterFraction, setSelectedChapterFraction] = useState(0);
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

  useEffect(() => {
    const nextChapterStartPosition = chapters[selectedChapterIndex + 1]?.startPosition || 1;
    setSelectedChapterFraction(nextChapterStartPosition - chapters[selectedChapterIndex].startPosition);
  }, [chapters, selectedChapterIndex, mainTrackPlaybackDuration]);

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
    const newVolumePresets = volumePresets.slice();
    newVolumePresets.forEach(preset => {
      preset.secondaryTracks = swapItemsAt(preset.secondaryTracks, index, index - 1);
    });
    changeContent({ secondaryTracks: newSecondaryTracks, volumePresets: newVolumePresets });
  };

  const handleMoveTrackDown = index => {
    const newSecondaryTracks = swapItemsAt(secondaryTracks, index, index + 1);
    const newVolumePresets = volumePresets.slice();
    newVolumePresets.forEach(preset => {
      preset.secondaryTracks = swapItemsAt(preset.secondaryTracks, index, index + 1);
    });
    changeContent({ secondaryTracks: newSecondaryTracks, volumePresets: newVolumePresets });
  };

  const handleDeleteTrack = index => {
    const newSecondaryTracks = removeItemAt(secondaryTracks, index);
    const newVolumePresets = volumePresets.slice();
    newVolumePresets.forEach(preset => {
      preset.secondaryTracks = removeItemAt(preset.secondaryTracks, index);
    });
    changeContent({ secondaryTracks: newSecondaryTracks, volumePresets: newVolumePresets });
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

  const handleFileDrop = async fs => {
    if (!fs.length) {
      return;
    }

    try {
      const newChapters = await importChaptersFromCsv(fs[0]);
      setSelectedChapterIndex(0);
      changeContent({ chapters: newChapters });
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const csvImportDropzone = useDropzone({
    maxFiles: 1,
    // We have to disable the FS Access API due to some Chrome bug when setting `accept`,
    // see also https://github.com/react-dropzone/react-dropzone/issues/1127
    useFsAccessApi: false,
    accept: { 'text/csv': ['.csv'] },
    onDrop: handleFileDrop,
    noKeyboard: true,
    noClick: true
  });

  const startCsvExport = async () => {
    const csv = exportChaptersAsCsv(chapters);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    await httpClient.download(url, 'segments.csv');
    URL.revokeObjectURL(url);
  };

  const handleExtraItemClick = key => {
    switch (key) {
      case 'export-as-csv':
        startCsvExport();
        break;
      case 'import-from-csv':
        csvImportDropzone.open();
        break;
      default:
        throw new Error(`Invalid key '${key}'`);
    }
  };

  const handleChapterAdd = startPosition => {
    const chapter = { ...createDefaultChapter(t), startPosition };
    const newChapters = ensureChaptersOrder([...chapters, chapter]);
    changeContent({ chapters: newChapters });
  };

  const handleChapterDelete = key => {
    const chapterIndex = chapters.findIndex(p => p.key === key);
    const deletedChapterStartPosition = chapters[chapterIndex].startPosition;
    const newChapters = removeItemAt(chapters, chapterIndex);
    const followingChapter = newChapters[chapterIndex];
    if (followingChapter) {
      followingChapter.startPosition = deletedChapterStartPosition;
    }
    if (selectedChapterIndex > newChapters.length - 1) {
      setSelectedChapterIndex(newChapters.length - 1);
    }
    changeContent({ chapters: newChapters });
  };

  const handleChapterStartPositionChange = (key, newStartPosition) => {
    const chapter = chapters.find(p => p.key === key);
    chapter.startPosition = newStartPosition;
    const newChapters = [...chapters];
    changeContent({ chapters: newChapters });
  };

  const handleChapterIndexChange = newSelectedChapterIndex => {
    setSelectedChapterIndex(newSelectedChapterIndex);
  };

  const handleChapterTitleChange = event => {
    const { value } = event.target;
    const newChapters = cloneDeep(chapters);
    newChapters[selectedChapterIndex] = { ...newChapters[selectedChapterIndex], title: value };
    changeContent({ chapters: newChapters });
  };

  const handleChapterColorChange = value => {
    const newChapters = cloneDeep(chapters);
    newChapters[selectedChapterIndex] = { ...newChapters[selectedChapterIndex], color: value };
    changeContent({ chapters: newChapters });
  };

  const handleChapterTextChange = event => {
    const { value } = event.target;
    const newChapters = cloneDeep(chapters);
    newChapters[selectedChapterIndex] = { ...newChapters[selectedChapterIndex], text: value };
    changeContent({ chapters: newChapters });
  };

  const segmentsDropzoneClasses = classNames({
    'MediaAnalysisEditor-segments': true,
    'u-can-drop': csvImportDropzone.isDragAccept,
    'u-cannot-drop': csvImportDropzone.isDragReject
  });

  return (
    <div className="MediaAnalysisEditor">
      <Form layout="horizontal">
        <ItemPanel header={t('common:mainTrack')}>
          <FormItem label={t('common:name')} {...formItemLayout}>
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
          <div className="MediaAnalysisEditor-trackMixerPreview">
            <MultitrackMediaPlayer
              parts={chapters}
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
        <div {...csvImportDropzone.getRootProps({ className: segmentsDropzoneClasses })}>
          <input {...csvImportDropzone.getInputProps()} hidden />
          <ItemPanel
            header={t('segmentsPanelHeader')}
            extraItems={[
              {
                key: 'export-as-csv',
                label: t('exportAsCsv'),
                icon: <ExportOutlined className="u-dropdown-icon" />
              },
              {
                key: 'import-from-csv',
                label: t('importFromCsv'),
                icon: <ImportOutlined className="u-dropdown-icon" />
              }
            ]}
            onExtraItemClick={handleExtraItemClick}
            >
            <Timeline
              durationInMilliseconds={mainTrackPlaybackDuration}
              parts={chapters}
              selectedPartIndex={selectedChapterIndex}
              onPartAdd={handleChapterAdd}
              onPartDelete={handleChapterDelete}
              onStartPositionChange={handleChapterStartPositionChange}
              />
            {chapters.length && (
            <Fragment>
              <ChapterSelector
                chaptersCount={chapters.length}
                selectedChapterIndex={selectedChapterIndex}
                selectedChapterTitle={chapters[selectedChapterIndex].title}
                onChapterIndexChange={handleChapterIndexChange}
                />
              <FormItem label={t('common:startTimecode')} {...formItemLayout}>
                <span className="InteractiveMediaEditor-readonlyValue">
                  {formatMediaPosition({ formatPercentage, position: chapters[selectedChapterIndex].startPosition, duration: mainTrackPlaybackDuration })}
                </span>
              </FormItem>
              <FormItem label={t('common:duration')} {...formItemLayout}>
                <span className="InteractiveMediaEditor-readonlyValue">
                  {formatMediaPosition({ formatPercentage, position: selectedChapterFraction, duration: mainTrackPlaybackDuration })}
                </span>
              </FormItem>
              <FormItem label={t('common:title')} {...formItemLayout}>
                <Input
                  disabled={!selectedChapterFraction}
                  onChange={handleChapterTitleChange}
                  value={chapters[selectedChapterIndex].title}
                  />
              </FormItem>
              <FormItem label={t('chapterColorLabel')} {...formItemLayout}>
                <ColorPicker
                  width={382}
                  colors={COLOR_SWATCHES}
                  color={chapters[selectedChapterIndex].color}
                  onChange={handleChapterColorChange}
                  />
              </FormItem>
              <FormItem label={t('chapterTextLabel')} {...formItemLayout}>
                <MarkdownInput
                  preview
                  disabled={!selectedChapterFraction}
                  onChange={handleChapterTextChange}
                  value={chapters?.[selectedChapterIndex].text || ''}
                  />
              </FormItem>
            </Fragment>
            )}
          </ItemPanel>
        </div>
        <FormItem
          label={
            <Fragment>
              <Tooltip title={t('common:widthInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
              <span>{t('common:width')}</span>
            </Fragment>
          }
          {...formItemLayout}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChanged} />
        </FormItem>
      </Form>
    </div>
  );
}

MediaAnalysisEditor.propTypes = {
  ...sectionEditorProps
};

export default MediaAnalysisEditor;
