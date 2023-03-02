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
import Timeline from '../../components/media-player/timeline.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import TrackEditor from '../../components/media-player/track-editor.js';
import { usePercentageFormat } from '../../components/locale-context.js';
import DragAndDropContainer from '../../components/drag-and-drop-container.js';
import { useMediaDurations } from '../../components/media-player/media-hooks.js';
import { moveItem, removeItemAt, swapItemsAt } from '../../utils/array-utils.js';
import { ExportOutlined, ImportOutlined, PlusOutlined } from '@ant-design/icons';
import TrackMixerEditor from '../../components/media-player/track-mixer-editor.js';
import { formatMediaPosition, shouldDisableVideo } from '../../utils/media-utils.js';
import React, { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import PlayerSettingsEditor from '../../components/media-player/player-settings-editor.js';
import MultitrackMediaPlayer from '../../components/media-player/multitrack-media-player.js';
import TimecodeFineTunningInput from '../../components/media-player/timecode-fine-tunning-input.js';
import { createDefaultChapter, createDefaultTrack, exportChaptersToCsv as exportChaptersAsCsv, importChaptersFromCsv } from './media-analysis-utils.js';

const useDropzone = reactDropzoneNs.default?.useDropzone || reactDropzoneNs.useDropzone;

const FormItem = Form.Item;

const logger = new Logger(import.meta.url);

const ensureChaptersOrder = chapters => chapters.sort(by(chapter => chapter.startPosition));

function MediaAnalysisEditor({ content, onContentChanged }) {
  const droppableIdRef = useRef(useId());
  const httpClient = useService(HttpClient);
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('mediaAnalysis');
  const formatPercentage = usePercentageFormat({ decimalPlaces: 2 });

  const { tracks, volumePresets, chapters, showVideo, aspectRatio, posterImage, initialVolume } = content;

  const [mainTrackMediaDuration] = useMediaDurations([
    getAccessibleUrl({
      url: tracks[0].sourceUrl,
      cdnRootUrl: clientConfig.cdnRootUrl
    })
  ]);

  const mainTrackSourceDuration = mainTrackMediaDuration.duration;
  const mainTrackPlaybackDuration = (tracks[0].playbackRange[1] - tracks[0].playbackRange[0]) * mainTrackSourceDuration;

  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [selectedChapterFraction, setSelectedChapterFraction] = useState(0);
  const [selectedVolumePresetIndex, setSelectedVolumePresetIndex] = useState(0);
  const [disableVideo, setDisableVideo] = useState(shouldDisableVideo(content.tracks[0].sourceUrl));

  const sources = useMemo(() => {
    return tracks.map(track => ({
      ...track,
      sourceUrl: getAccessibleUrl({ url: track.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    }));
  }, [tracks, clientConfig]);

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

  const segmentsDropzoneClasses = classNames(
    'MediaAnalysisEditor-segmentsDropzone',
    { 'is-dropping': csvImportDropzone.isDragAccept },
    { 'is-drop-rejected': csvImportDropzone.isDragReject }
  );

  return (
    <div className="MediaAnalysisEditor">
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
          <div className="MediaAnalysisEditor-trackMixerPreview">
            <div className="MediaAnalysisEditor-trackMixerPreviewLabel">
              {t('common:preview')}
            </div>
            <MultitrackMediaPlayer
              aspectRatio={aspectRatio}
              initialVolume={initialVolume}
              parts={playerParts}
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

        <div {...csvImportDropzone.getRootProps({ className: segmentsDropzoneClasses })}>
          <input {...csvImportDropzone.getInputProps()} hidden />
          <ItemPanel
            header={t('common:segments')}
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
