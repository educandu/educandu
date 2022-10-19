import by from 'thenby';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import cloneDeep from '../../utils/clone-deep.js';
import { cssUrl } from '../../utils/css-utils.js';
import Markdown from '../../components/markdown.js';
import UrlInput from '../../components/url-input.js';
import { Divider, Form, Radio, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { CHAPTER_TYPE, IMAGE_FIT } from './constants.js';
import MediaSlideshowInfo from './media-slideshow-info.js';
import ClientConfig from '../../bootstrap/client-config.js';
import React, { Fragment, useEffect, useState } from 'react';
import MarkdownInput from '../../components/markdown-input.js';
import Timeline from '../../components/media-player/timeline.js';
import { formatMediaPosition } from '../../utils/media-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { useNumberFormat } from '../../components/locale-context.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import validation, { URL_VALIDATION_STATUS } from '../../ui/validation.js';
import { ensureIsExcluded, removeItemAt } from '../../utils/array-utils.js';
import ChapterSelector from '../../components/media-player/chapter-selector.js';
import MainTrackEditor from '../../components/media-player/main-track-editor.js';
import { useMediaDurations } from '../../components/media-player/media-hooks.js';
import { getAccessibleUrl, isInternalSourceType } from '../../utils/source-utils.js';
import { FORM_ITEM_LAYOUT, MEDIA_SCREEN_MODE, SOURCE_TYPE } from '../../domain/constants.js';

const FormItem = Form.Item;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

const ensureChaptersOrder = chapters => chapters.sort(by(chapter => chapter.startPosition));

function MediaSlideshowEditor({ content, onContentChanged }) {
  const clientConfig = useService(ClientConfig);
  const { formatPercentage } = useNumberFormat();
  const { t } = useTranslation('mediaSlideshow');
  const mediaSlideshowInfo = useService(MediaSlideshowInfo);
  const [playingChapterIndex, setPlayingChapterIndex] = useState(-1);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [selectedChapterFraction, setSelectedChapterFraction] = useState(0);

  const { sourceUrl, playbackRange, chapters, width } = content;

  const [mediaDuration] = useMediaDurations([getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })]);
  const sourceDuration = mediaDuration.duration;

  const playbackDuration = (playbackRange[1] - playbackRange[0]) * sourceDuration;

  useEffect(() => {
    const nextChapterStartPosition = chapters[selectedChapterIndex + 1]?.startPosition || 1;
    setSelectedChapterFraction(nextChapterStartPosition - chapters[selectedChapterIndex].startPosition);
  }, [chapters, selectedChapterIndex, playbackDuration]);

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isNewSourceTypeInternal = isInternalSourceType({ url: newContent.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    const isInvalid = !isNewSourceTypeInternal && validation.getUrlValidationStatus(newContent.sourceUrl) === URL_VALIDATION_STATUS.error;

    onContentChanged(newContent, isInvalid);
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

  const handleSelectedChapterIndexChange = newSelectedChapterIndex => {
    setSelectedChapterIndex(newSelectedChapterIndex);
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
    setPlayingChapterIndex(partIndex);
  };

  const renderPlayingChapterImage = () => {
    if (playingChapterIndex === -1) {
      return null;
    }

    const {
      sourceUrl: imageSourceUrl,
      fit: imageFit
    } = chapters[playingChapterIndex].image;

    const imageUrl = urlUtils.getImageUrl({
      cdnRootUrl: clientConfig.cdnRootUrl,
      sourceUrl: imageSourceUrl
    });

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

  const getValidationProps = url => isInternalSourceType({ url, cdnRootUrl: clientConfig.cdnRootUrl })
    ? {}
    : validation.validateUrl(url, t, { allowEmpty: true });

  const timelineParts = chapters.map((chapter, index) => ({
    ...chapter,
    title: `${t('common:chapter')} ${index + 1}`
  }));

  const allowedImageSourceTypes = ensureIsExcluded(Object.values(SOURCE_TYPE), SOURCE_TYPE.youtube);

  return (
    <div className="MediaSlideshowEditor">
      <Form layout="horizontal">
        <MainTrackEditor
          content={content}
          useShowVideo={false}
          useAspectRatio={false}
          onContentChanged={handleMainTrackContentChange}
          />
        <FormItem
          label={
            <Fragment>
              <Tooltip title={t('common:widthInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
              <span>{t('common:width')}</span>
            </Fragment>
          }
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChanged} />
        </FormItem>

        <Divider className="MediaSlideshowEditor-chapterEditorDivider" plain>{t('common:editChapter')}</Divider>

        <MediaPlayer
          parts={chapters}
          screenMode={MEDIA_SCREEN_MODE.overlay}
          screenWidth={50}
          playbackRange={playbackRange}
          screenOverlay={renderPlayingChapterImage()}
          onPlayingPartIndexChange={handlePlayingPartIndexChange}
          source={getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
          />

        <Timeline
          parts={timelineParts}
          durationInMilliseconds={playbackDuration}
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
              selectedChapterTitle={`${t('common:chapter')} ${selectedChapterIndex + 1}`}
              onChapterIndexChange={handleSelectedChapterIndexChange}
              />

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
                  {...getValidationProps(chapters[selectedChapterIndex].image.sourceUrl)}
                  >
                  <UrlInput
                    value={chapters[selectedChapterIndex].image.sourceUrl}
                    onChange={handleChapterImageSourceUrlChange}
                    allowedSourceTypes={allowedImageSourceTypes}
                    />
                </FormItem>
                <FormItem
                  label={
                    <Fragment>
                      <Tooltip title={<Markdown>{t('imageFitInfoMarkdown')}</Markdown>}>
                        <InfoCircleOutlined className="u-info-icon" />
                      </Tooltip>
                      <span>{t('imageFit')}</span>
                    </Fragment>
                  }
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
