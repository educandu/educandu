import by from 'thenby';
import { Form, Input } from 'antd';
import classNames from 'classnames';
import Info from '../../components/info.js';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../../utils/clone-deep.js';
import * as reactDropzoneNs from 'react-dropzone';
import ItemPanel from '../../components/item-panel.js';
import HttpClient from '../../api-clients/http-client.js';
import { removeItemAt } from '../../utils/array-utils.js';
import { handleApiError } from '../../ui/error-helper.js';
import ColorPicker from '../../components/color-picker.js';
import ClientConfig from '../../bootstrap/client-config.js';
import MarkdownInput from '../../components/markdown-input.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import Timeline from '../../components/media-player/timeline.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import MediaPlayer from '../../components/media-player/media-player.js';
import TrackEditor from '../../components/media-player/track-editor.js';
import { usePercentageFormat } from '../../components/locale-context.js';
import { FORM_ITEM_LAYOUT, MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import EmptyState, { EMPTY_STATE_STATUS } from '../../components/empty-state.js';
import { useMediaDurations } from '../../components/media-player/media-hooks.js';
import { TableExportIcon, TableImportIcon } from '../../components/icons/icons.js';
import { formatMediaPosition, shouldDisableVideo } from '../../utils/media-utils.js';
import PlayerSettingsEditor from '../../components/media-player/player-settings-editor.js';
import TimecodeFineTunningInput from '../../components/media-player/timecode-fine-tunning-input.js';
import { createDefaultChapter, exportChaptersToCsv, importChaptersFromCsv } from './media-analysis-utils.js';

const useDropzone = reactDropzoneNs.default?.useDropzone || reactDropzoneNs.useDropzone;

const FormItem = Form.Item;

const logger = new Logger(import.meta.url);

const ensureChaptersOrder = chapters => chapters.sort(by(chapter => chapter.startPosition));

function MediaAnalysisEditor({ content, onContentChanged }) {
  const httpClient = useService(HttpClient);
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('mediaAnalysis');
  const formatPercentage = usePercentageFormat({ decimalPlaces: 2 });

  const { sourceUrl, playbackRange, chapters, showVideo, aspectRatio, posterImage, initialVolume } = content;

  const [mediaDuration] = useMediaDurations([getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })]);
  const sourceDuration = mediaDuration.duration;
  const canRenderMediaPlayer = !!sourceUrl;

  const playbackDuration = (playbackRange[1] - playbackRange[0]) * sourceDuration;

  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [selectedChapterFraction, setSelectedChapterFraction] = useState(0);
  const [disableVideo, setDisableVideo] = useState(shouldDisableVideo(content.sourceUrl));

  const playerParts = useMemo(() => chapters.map(chapter => ({ startPosition: chapter.startPosition })), [chapters]);

  const selectedChapterStartTimecode = useMemo(
    () => chapters[selectedChapterIndex].startPosition * playbackDuration,
    [chapters, selectedChapterIndex, playbackDuration]
  );

  const selectedChapterLowerTimecodeLimit = useMemo(
    () => {
      const previousChapter = chapters[selectedChapterIndex - 1];
      return previousChapter ? previousChapter.startPosition * playbackDuration : 0;
    },
    [chapters, selectedChapterIndex, playbackDuration]
  );

  const selectedChapterUpperTimecodeLimit = useMemo(
    () => {
      const nextChapter = chapters[selectedChapterIndex + 1];
      return nextChapter ? nextChapter.startPosition * playbackDuration : playbackDuration;
    },
    [chapters, selectedChapterIndex, playbackDuration]
  );

  useEffect(() => {
    const nextChapterStartPosition = chapters[selectedChapterIndex + 1]?.startPosition || 1;
    setSelectedChapterFraction(nextChapterStartPosition - chapters[selectedChapterIndex].startPosition);
  }, [chapters, selectedChapterIndex, playbackDuration]);

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

  const handeTrackContentChange = changedContent => {
    changeContent(changedContent);
  };

  const handlePlayerSettingsContentChange = changedContent => {
    changeContent(changedContent);
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
    const csv = exportChaptersToCsv(chapters);
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
    newChapters[selectedChapterIndex] = { ...newChapters[selectedChapterIndex], startPosition: newStartTime / playbackDuration };
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

  const segmentsDropzoneClasses = classNames(
    'MediaAnalysisEditor-segmentsDropzone',
    { 'is-dropping': csvImportDropzone.isDragAccept },
    { 'is-drop-rejected': csvImportDropzone.isDragReject }
  );

  return (
    <div className="MediaAnalysisEditor">
      <Form layout="horizontal" labelAlign="left">

        <ItemPanel collapsed header={t('common:track')}>
          <TrackEditor
            content={content}
            useName={false}
            onContentChange={handeTrackContentChange}
            />
        </ItemPanel>

        <ItemPanel header={t('common:player')}>
          <PlayerSettingsEditor
            useShowVideo
            useAspectRatio
            usePosterImage
            useWidth
            content={content}
            disableVideo={disableVideo}
            onContentChange={handlePlayerSettingsContentChange}
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
                icon: <div className="MediaAnalysisEditor-segmentsActionButton"><TableExportIcon /></div>
              },
              {
                key: 'import-from-csv',
                title: t('importFromCsv'),
                icon: <div className="MediaAnalysisEditor-segmentsActionButton"><TableImportIcon /></div>
              }
            ]}
            onExtraActionButtonClick={handleExtraActionButtonClick}
            >
            <div className="MediaAnalysisEditor-playerPreview">
              <div className="MediaAnalysisEditor-playerPreviewLabel">{t('common:preview')}</div>
              {!canRenderMediaPlayer && (
                <EmptyState
                  title={t('common:cannotPlayMediaEmptyStateTitle')}
                  subtitle={t('common:cannotPlayMediaEmptyStateSubtitle')}
                  status={EMPTY_STATE_STATUS.error}
                  />
              )}
              {!!canRenderMediaPlayer && (
                <MediaPlayer
                  allowLoop
                  allowMediaInfo
                  allowPartClick
                  allowPlaybackRate
                  aspectRatio={aspectRatio}
                  parts={playerParts}
                  playbackRange={playbackRange}
                  posterImageUrl={getAccessibleUrl({ url: posterImage.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
                  screenWidth={50}
                  screenMode={!disableVideo && showVideo ? MEDIA_SCREEN_MODE.video : MEDIA_SCREEN_MODE.none}
                  sourceUrl={getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
                  volume={initialVolume}
                  />
              )}
            </div>

            <Timeline
              durationInMilliseconds={playbackDuration}
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
                  {!playbackDuration && formatPercentage(chapters[selectedChapterIndex].startPosition)}
                  {!!playbackDuration && (
                    <TimecodeFineTunningInput
                      key={selectedChapterIndex}
                      disabled={selectedChapterIndex === 0}
                      lowerLimit={selectedChapterLowerTimecodeLimit}
                      upperLimit={selectedChapterUpperTimecodeLimit}
                      value={selectedChapterStartTimecode}
                      onValueChange={handleChapterStartTimecodeChange}
                      />
                  )}
                </FormItem>
                <FormItem label={t('common:duration')} {...FORM_ITEM_LAYOUT}>
                  {formatMediaPosition({ formatPercentage, position: selectedChapterFraction, duration: playbackDuration })}
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
