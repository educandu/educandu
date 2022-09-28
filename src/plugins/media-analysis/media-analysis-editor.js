import by from 'thenby';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import { COLOR_SWATCHES } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';
import { Button, Form, Input, Tooltip } from 'antd';
import ItemPanel from '../../components/item-panel.js';
import ColorPicker from '../../components/color-picker.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import Timeline from '../../components/media-player/timeline.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { useNumberFormat } from '../../components/locale-context.js';
import TrackMixer from '../../components/media-player/track-mixer.js';
import { removeItemAt, swapItemsAt } from '../../utils/array-utils.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import ChapterSelector from '../../components/media-player/chapter-selector.js';
import MainTrackEditor from '../../components/media-player/main-track-editor.js';
import { useMediaDurations } from '../../components/media-player/media-hooks.js';
import { formatMediaPosition, getFullSourceUrl } from '../../utils/media-utils.js';
import SecondaryTrackEditor from '../../components/media-player/secondary-track-editor.js';
import MultitrackMediaPlayer from '../../components/media-player/multitrack-media-player.js';
import { createDefaultChapter, createDefaultSecondaryTrack } from './media-analysis-utils.js';

const FormItem = Form.Item;

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

const ensureChaptersOrder = chapters => chapters.sort(by(chapter => chapter.startPosition));

function MediaAnalysisEditor({ content, onContentChanged }) {
  const playerRef = useRef(null);
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('mediaAnalysis');
  const { formatPercentage } = useNumberFormat();

  const { width, mainTrack, secondaryTracks, chapters } = content;
  const sources = {
    mainTrack: {
      name: mainTrack.name,
      sourceUrl: getFullSourceUrl({
        url: mainTrack.sourceUrl,
        sourceType: mainTrack.sourceType,
        cdnRootUrl: clientConfig.cdnRootUrl
      }),
      volume: mainTrack.volume,
      playbackRange: mainTrack.playbackRange
    },
    secondaryTracks: secondaryTracks.map(track => ({
      name: track.name,
      sourceUrl: getFullSourceUrl({
        url: track.sourceUrl,
        sourceType: track.sourceType,
        cdnRootUrl: clientConfig.cdnRootUrl
      }),
      volume: track.volume
    }))
  };

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
    changeContent({ secondaryTracks: newSecondaryTracks });
  };

  const handleMainTrackSettingsChange = ({ volume }) => {
    changeContent({ mainTrack: { ...mainTrack, volume } });
  };

  const handleSecondaryTrackSettingsChange = (index, { volume }) => {
    const newSecondaryTracks = cloneDeep(secondaryTracks);
    newSecondaryTracks[index] = { ...secondaryTracks[index], volume };
    changeContent({ secondaryTracks: newSecondaryTracks });
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
            mainTrack={sources.mainTrack}
            secondaryTracks={sources.secondaryTracks}
            onMainTrackSettingsChange={handleMainTrackSettingsChange}
            onSecondaryTrackSettingsChange={handleSecondaryTrackSettingsChange}
            />
        </ItemPanel>
        <ItemPanel header={t('segmentsPanelHeader')}>
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
