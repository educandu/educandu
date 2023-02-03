import by from 'thenby';
import Info from '../../components/info.js';
import { Divider, Form, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../../utils/clone-deep.js';
import { cssUrl } from '../../utils/css-utils.js';
import Markdown from '../../components/markdown.js';
import UrlInput from '../../components/url-input.js';
import { CHAPTER_TYPE, IMAGE_FIT } from './constants.js';
import MediaSlideshowInfo from './media-slideshow-info.js';
import ClientConfig from '../../bootstrap/client-config.js';
import React, { Fragment, useEffect, useState } from 'react';
import MarkdownInput from '../../components/markdown-input.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import Timeline from '../../components/media-player/timeline.js';
import { formatMediaPosition } from '../../utils/media-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import { usePercentageFormat } from '../../components/locale-context.js';
import { ensureIsExcluded, removeItemAt } from '../../utils/array-utils.js';
import MainTrackEditor from '../../components/media-player/main-track-editor.js';
import { useMediaDurations } from '../../components/media-player/media-hooks.js';
import MediaVolumeSlider from '../../components/media-player/media-volume-slider.js';
import { FORM_ITEM_LAYOUT, MEDIA_SCREEN_MODE, SOURCE_TYPE } from '../../domain/constants.js';

const FormItem = Form.Item;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

const ensureChaptersOrder = chapters => chapters.sort(by(chapter => chapter.startPosition));

function MediaSlideshowEditor({ content, onContentChanged }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('mediaSlideshow');
  const mediaSlideshowInfo = useService(MediaSlideshowInfo);
  const formatPercentage = usePercentageFormat({ decimalPlaces: 2 });
  const [playingChapterIndex, setPlayingChapterIndex] = useState(0);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [selectedChapterFraction, setSelectedChapterFraction] = useState(0);

  const { sourceUrl, playbackRange, width, initialVolume, chapters } = content;

  const [mediaDuration] = useMediaDurations([getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })]);
  const sourceDuration = mediaDuration.duration;

  const playbackDuration = (playbackRange[1] - playbackRange[0]) * sourceDuration;

  useEffect(() => {
    const nextChapterStartPosition = chapters[selectedChapterIndex + 1]?.startPosition || 1;
    setSelectedChapterFraction(nextChapterStartPosition - chapters[selectedChapterIndex].startPosition);
  }, [chapters, selectedChapterIndex, playbackDuration]);

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChanged(newContent);
  };

  const handleMainTrackContentChange = changedContent => {
    changeContent({ ...changedContent });
  };

  const handleChapterStartPositionChange = (key, newStartPosition) => {
    const chapter = chapters.find(p => p.key === key);
    chapter.startPosition = newStartPosition;
    const newChapters = [...chapters];
    changeContent({ chapters: newChapters });
  };

  const handleWidthChanged = newValue => {
    changeContent({ width: newValue });
  };

  const handleInitialVolumeChange = newValue => {
    changeContent({ initialVolume: newValue });
  };

  const handleChapterAdd = startPosition => {
    const chapter = { ...mediaSlideshowInfo.getDefaultChapter(t), startPosition };
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

  const handleChapterTypeChange = event => {
    const { value } = event.target;
    const newChapters = cloneDeep(chapters);
    newChapters[selectedChapterIndex].type = value;
    newChapters[selectedChapterIndex].text = '';
    newChapters[selectedChapterIndex].image = mediaSlideshowInfo.getDefaultChapterImage();
    changeContent({ chapters: newChapters });
  };

  const handleChapterImageSourceUrlChange = value => {
    const newChapters = cloneDeep(chapters);
    newChapters[selectedChapterIndex].image.sourceUrl = value;
    changeContent({ chapters: newChapters });
  };

  const handleChapterImageFitChange = event => {
    const { value } = event.target;
    const newChapters = cloneDeep(chapters);
    newChapters[selectedChapterIndex].image.fit = value;
    changeContent({ chapters: newChapters });
  };

  const handleChapterImageCopyrightNoticeChanged = event => {
    const { value } = event.target;
    const newChapters = cloneDeep(chapters);
    newChapters[selectedChapterIndex].image.copyrightNotice = value;
    changeContent({ chapters: newChapters });
  };

  const handleChapterTextChanged = event => {
    const { value } = event.target;
    const newChapters = cloneDeep(chapters);
    newChapters[selectedChapterIndex].text = value;
    changeContent({ chapters: newChapters });
  };

  const handlePlayingPartIndexChange = partIndex => {
    setPlayingChapterIndex(Math.max(partIndex, 0));
  };

  const renderPlayingChapterImage = () => {
    if (playingChapterIndex === -1) {
      return null;
    }

    const {
      sourceUrl: imageSourceUrl,
      fit: imageFit
    } = chapters[playingChapterIndex].image;

    const imageUrl = getAccessibleUrl({ url: imageSourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

    if (!imageUrl) {
      return null;
    }

    return (
      <div className="MediaSlideshow-chapterImageOverlayWrapper">
        <div
          className="MediaSlideshow-chapterImageOverlay"
          style={{ backgroundImage: cssUrl(imageUrl), backgroundSize: imageFit }}
          />
      </div>
    );
  };

  const timelineParts = chapters.map((chapter, index) => ({
    ...chapter,
    title: `${t('common:chapter')} ${index + 1}`
  }));

  const allowedImageSourceTypes = ensureIsExcluded(Object.values(SOURCE_TYPE), SOURCE_TYPE.youtube);

  return (
    <div className="MediaSlideshowEditor">
      <Form layout="horizontal" labelAlign="left">
        <MainTrackEditor
          content={content}
          useShowVideo={false}
          useAspectRatio={false}
          onContentChanged={handleMainTrackContentChange}
          />
        <FormItem
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChanged} />
        </FormItem>
        <FormItem label={t('common:initialVolume')} {...FORM_ITEM_LAYOUT} >
          <MediaVolumeSlider
            value={initialVolume}
            useValueLabel
            useButton={false}
            onChange={handleInitialVolumeChange}
            />
        </FormItem>

        <div className="MediaSlideshowEditor-playerPreview">
          <div className="MediaSlideshowEditor-playerPreviewLabel">{t('common:preview')}</div>
          <MediaPlayer
            volume={initialVolume}
            parts={chapters}
            screenWidth={50}
            playbackRange={playbackRange}
            screenMode={MEDIA_SCREEN_MODE.audio}
            customScreenOverlay={renderPlayingChapterImage()}
            onPlayingPartIndexChange={handlePlayingPartIndexChange}
            sourceUrl={getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
            />
        </div>

        <Timeline
          parts={timelineParts}
          durationInMilliseconds={playbackDuration}
          selectedPartIndex={selectedChapterIndex}
          onPartAdd={handleChapterAdd}
          onPartClick={handleChapterClick}
          onPartDelete={handleChapterDelete}
          onStartPositionChange={handleChapterStartPositionChange}
          />

        {!!chapters.length && (
          <Fragment>
            <FormItem label={t('common:startTimecode')} {...FORM_ITEM_LAYOUT}>
              <span className="MediaSlideshowEditor-readonlyValue">
                {formatMediaPosition({ formatPercentage, position: chapters[selectedChapterIndex].startPosition, duration: playbackDuration })}
              </span>
            </FormItem>
            <FormItem label={t('common:duration')} {...FORM_ITEM_LAYOUT}>
              <span className="MediaSlideshowEditor-readonlyValue">
                {formatMediaPosition({ formatPercentage, position: selectedChapterFraction, duration: playbackDuration })}
              </span>
            </FormItem>
            <FormItem label={t('common:type')} {...FORM_ITEM_LAYOUT}>
              <RadioGroup value={chapters[selectedChapterIndex].type} onChange={handleChapterTypeChange}>
                <RadioButton value={CHAPTER_TYPE.image}>{t('chapterType_image')}</RadioButton>
                <RadioButton value={CHAPTER_TYPE.text}>{t('chapterType_text')}</RadioButton>
              </RadioGroup>
            </FormItem>
            {chapters[selectedChapterIndex].type === CHAPTER_TYPE.image && (
              <Fragment>
                <FormItem
                  label={t('common:url')}
                  {...FORM_ITEM_LAYOUT}
                  >
                  <UrlInput
                    value={chapters[selectedChapterIndex].image.sourceUrl}
                    onChange={handleChapterImageSourceUrlChange}
                    allowedSourceTypes={allowedImageSourceTypes}
                    />
                </FormItem>
                <FormItem
                  label={<Info tooltip={<Markdown>{t('imageFitInfoMarkdown')}</Markdown>}>{t('imageFit')}</Info>}
                  {...FORM_ITEM_LAYOUT}
                  >
                  <RadioGroup value={chapters[selectedChapterIndex].image.fit} onChange={handleChapterImageFitChange}>
                    <RadioButton value={IMAGE_FIT.cover}>{t('imageFit_cover')}</RadioButton>
                    <RadioButton value={IMAGE_FIT.contain}>{t('imageFit_contain')}</RadioButton>
                  </RadioGroup>
                </FormItem>
                <FormItem label={t('common:copyrightNotice')} {...FORM_ITEM_LAYOUT}>
                  <MarkdownInput value={chapters[selectedChapterIndex].image.copyrightNotice} onChange={handleChapterImageCopyrightNoticeChanged} />
                </FormItem>
              </Fragment>
            )}
            {chapters[selectedChapterIndex].type === CHAPTER_TYPE.text && (
              <FormItem label={t('common:text')} {...FORM_ITEM_LAYOUT}>
                <MarkdownInput value={chapters[selectedChapterIndex].text} onChange={handleChapterTextChanged} />
              </FormItem>
            )}
          </Fragment>
        )}
      </Form>
    </div>
  );
}

MediaSlideshowEditor.propTypes = {
  ...sectionEditorProps
};

export default MediaSlideshowEditor;
