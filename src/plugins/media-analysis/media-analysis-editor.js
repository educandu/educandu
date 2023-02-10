import by from 'thenby';
import classNames from 'classnames';
import { Button, Form, Input } from 'antd';
import Info from '../../components/info.js';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../../utils/clone-deep.js';
import * as reactDropzoneNs from 'react-dropzone';
import ItemPanel from '../../components/item-panel.js';
import HttpClient from '../../api-clients/http-client.js';
import { handleApiError } from '../../ui/error-helper.js';
import ColorPicker from '../../components/color-picker.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { formatMediaPosition } from '../../utils/media-utils.js';
import Timeline from '../../components/media-player/timeline.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { removeItemAt, swapItemsAt } from '../../utils/array-utils.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { usePercentageFormat } from '../../components/locale-context.js';
import MainTrackEditor from '../../components/media-player/main-track-editor.js';
import { useMediaDurations } from '../../components/media-player/media-hooks.js';
import { ExportOutlined, ImportOutlined, PlusOutlined } from '@ant-design/icons';
import TrackMixerEditor from '../../components/media-player/track-mixer-editor.js';
import MediaVolumeSlider from '../../components/media-player/media-volume-slider.js';
import SecondaryTrackEditor from '../../components/media-player/secondary-track-editor.js';
import MultitrackMediaPlayer from '../../components/media-player/multitrack-media-player.js';
import TimecodeFineTunningInput from '../../components/media-player/timecode-fine-tunning-input.js';
import { createDefaultChapter, createDefaultSecondaryTrack, exportChaptersToCsv as exportChaptersAsCsv, importChaptersFromCsv } from './media-analysis-utils.js';

const useDropzone = reactDropzoneNs.default?.useDropzone || reactDropzoneNs.useDropzone;

const FormItem = Form.Item;

const logger = new Logger(import.meta.url);

const ensureChaptersOrder = chapters => chapters.sort(by(chapter => chapter.startPosition));

function MediaAnalysisEditor({ content, onContentChanged }) {
  const httpClient = useService(HttpClient);
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('mediaAnalysis');
  const formatPercentage = usePercentageFormat({ decimalPlaces: 2 });

  const { width, mainTrack, secondaryTracks, chapters, initialVolume, volumePresets } = content;

  const [mainTrackMediaDuration] = useMediaDurations([
    getAccessibleUrl({
      url: mainTrack.sourceUrl,
      cdnRootUrl: clientConfig.cdnRootUrl
    })
  ]);

  const mainTrackSourceDuration = mainTrackMediaDuration.duration;
  const mainTrackPlaybackDuration = (mainTrack.playbackRange[1] - mainTrack.playbackRange[0]) * mainTrackSourceDuration;

  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [selectedChapterFraction, setSelectedChapterFraction] = useState(0);
  const [selectedVolumePresetIndex, setSelectedVolumePresetIndex] = useState(0);

  const sources = useMemo(() => ({
    mainTrack: {
      ...mainTrack,
      sourceUrl: getAccessibleUrl({ url: mainTrack.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    },
    secondaryTracks: secondaryTracks.map(track => ({
      ...track,
      sourceUrl: getAccessibleUrl({ url: track.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    }))
  }), [mainTrack, secondaryTracks, clientConfig]);

  const playerParts = useMemo(() => chapters.map(chapter => ({ startPosition: chapter.startPosition })), [chapters]);

  const selectedChapterStartTimecode = useMemo(
    () => chapters[selectedChapterIndex].startPosition * mainTrackPlaybackDuration,
    [chapters, selectedChapterIndex, mainTrackPlaybackDuration]
  );

  const selectedChapterLowerTimecodeLimit = useMemo(
    () => {
      const previousChapter = chapters[selectedChapterIndex - 1];
      return previousChapter ? previousChapter.startPosition * mainTrackPlaybackDuration : 0;
    },
    [chapters, selectedChapterIndex, mainTrackPlaybackDuration]
  );

  const selectedChapterUpperTimecodeLimit = useMemo(
    () => {
      const nextChapter = chapters[selectedChapterIndex + 1];
      return nextChapter ? nextChapter.startPosition * mainTrackPlaybackDuration : mainTrackPlaybackDuration;
    },
    [chapters, selectedChapterIndex, mainTrackPlaybackDuration]
  );

  useEffect(() => {
    const nextChapterStartPosition = chapters[selectedChapterIndex + 1]?.startPosition || 1;
    setSelectedChapterFraction(nextChapterStartPosition - chapters[selectedChapterIndex].startPosition);
  }, [chapters, selectedChapterIndex, mainTrackPlaybackDuration]);

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChanged(newContent);
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

  const handleInitialVolumeChange = newValue => {
    changeContent({ initialVolume: newValue });
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
    newSecondaryTracks.push(createDefaultSecondaryTrack());
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

  const handleExtraActionButtonClick = key => {
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
    const chapter = { ...createDefaultChapter(), startPosition };
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

  const handleChapterClick = key => {
    const chapterIndex = chapters.findIndex(p => p.key === key);
    setSelectedChapterIndex(chapterIndex);
  };

  const handleChapterStartTimecodeChange = newStartTime => {
    const newChapters = cloneDeep(chapters);
    newChapters[selectedChapterIndex] = { ...newChapters[selectedChapterIndex], startPosition: newStartTime / mainTrackPlaybackDuration };
    changeContent({ chapters: newChapters });
  };

  const handleChapterStartPositionChange = (key, newStartPosition) => {
    const chapter = chapters.find(p => p.key === key);
    chapter.startPosition = newStartPosition;
    const newChapters = [...chapters];
    changeContent({ chapters: newChapters });
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
    'MediaAnalysisEditor-segmentsDropzone': true,
    'u-can-drop': csvImportDropzone.isDragAccept,
    'u-cannot-drop': csvImportDropzone.isDragReject
  });

  return (
    <div className="MediaAnalysisEditor">
      <Form layout="horizontal" labelAlign="left">
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
        <ItemPanel header={t('common:playerSettings')}>
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
          <div className="MediaAnalysisEditor-trackMixerPreview">
            <div className="MediaAnalysisEditor-trackMixerPreviewLabel">
              {t('common:preview')}
            </div>
            <MultitrackMediaPlayer
              initialVolume={initialVolume}
              posterImageUrl={getAccessibleUrl({ url: mainTrack.posterImage.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
              screenWidth={50}
              selectedVolumePresetIndex={selectedVolumePresetIndex}
              showTrackMixer={false}
              sources={sources}
              volumePresets={volumePresets}
              parts={playerParts}
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
        <div {...csvImportDropzone.getRootProps({ className: segmentsDropzoneClasses })}>
          <input {...csvImportDropzone.getInputProps()} hidden />
          <ItemPanel
            header={t('segmentsPanelHeader')}
            extraActionButtons={[
              {
                key: 'export-as-csv',
                title: t('exportAsCsv'),
                icon: <div className="MediaAnalysisEditor-segmentsActionButton"><ExportOutlined /></div>
              },
              {
                key: 'import-from-csv',
                title: t('importFromCsv'),
                icon: <div className="MediaAnalysisEditor-segmentsActionButton"><ImportOutlined /></div>
              }
            ]}
            onExtraActionButtonClick={handleExtraActionButtonClick}
            >
            <Timeline
              durationInMilliseconds={mainTrackPlaybackDuration}
              parts={chapters}
              selectedPartIndex={selectedChapterIndex}
              onPartAdd={handleChapterAdd}
              onPartClick={handleChapterClick}
              onPartDelete={handleChapterDelete}
              onStartPositionChange={handleChapterStartPositionChange}
              />
            {!!chapters.length && (
            <Fragment>
              <FormItem label={t('common:startTimecode')} {...FORM_ITEM_LAYOUT}>
                {!mainTrackPlaybackDuration && formatPercentage(chapters[selectedChapterIndex].startPosition)}
                {!!mainTrackPlaybackDuration && (
                  <TimecodeFineTunningInput
                    disabled={selectedChapterIndex === 0}
                    lowerLimit={selectedChapterLowerTimecodeLimit}
                    upperLimit={selectedChapterUpperTimecodeLimit}
                    value={selectedChapterStartTimecode}
                    onValueChange={handleChapterStartTimecodeChange}
                    />
                )}
              </FormItem>
              <FormItem label={t('common:duration')} {...FORM_ITEM_LAYOUT}>
                {formatMediaPosition({ formatPercentage, position: selectedChapterFraction, duration: mainTrackPlaybackDuration })}
              </FormItem>
              <FormItem label={t('common:title')} {...FORM_ITEM_LAYOUT}>
                <Input
                  disabled={!selectedChapterFraction}
                  onChange={handleChapterTitleChange}
                  value={chapters[selectedChapterIndex].title}
                  />
              </FormItem>
              <FormItem label={t('chapterColorLabel')} {...FORM_ITEM_LAYOUT}>
                <ColorPicker
                  color={chapters[selectedChapterIndex].color}
                  onChange={handleChapterColorChange}
                  />
              </FormItem>
              <FormItem label={t('chapterTextLabel')} {...FORM_ITEM_LAYOUT}>
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
          <div className="MediaAnalysisEditor-segmentsDropzoneInfo">
            <Info tooltip={t('segmentsDropzoneInfo')} />
          </div>
        </div>
      </Form>
    </div>
  );
}

MediaAnalysisEditor.propTypes = {
  ...sectionEditorProps
};

export default MediaAnalysisEditor;
