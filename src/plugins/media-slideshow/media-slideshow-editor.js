import by from 'thenby';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import urlUtils from '../../utils/url-utils.js';
import cloneDeep from '../../utils/clone-deep.js';
import Markdown from '../../components/markdown.js';
import { InfoCircleOutlined } from '@ant-design/icons';
import { CHAPTER_TYPE, IMAGE_FIT } from './constants.js';
import { removeItemAt } from '../../utils/array-utils.js';
import MediaSlideshowInfo from './media-slideshow-info.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { Divider, Form, Input, Radio, Tooltip } from 'antd';
import React, { Fragment, useEffect, useState } from 'react';
import MarkdownInput from '../../components/markdown-input.js';
import Timeline from '../../components/media-player/timeline.js';
import { formatMediaPosition } from '../../utils/media-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { useNumberFormat } from '../../components/locale-context.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import ChapterSelector from '../../components/media-player/chapter-selector.js';
import ResourcePicker from '../../components/resource-picker/resource-picker.js';
import MainTrackEditor from '../../components/media-player/main-track-editor.js';
import { useMediaDurations } from '../../components/media-player/media-hooks.js';
import { storageLocationPathToUrl, urlToStorageLocationPath } from '../../utils/storage-utils.js';
import { CDN_URL_PREFIX, IMAGE_SOURCE_TYPE, MEDIA_SCREEN_MODE, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';

const FormItem = Form.Item;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

const ensureChaptersOrder = chapters => chapters.sort(by(chapter => chapter.startPosition));

function MediaSlideshowEditor({ content, onContentChanged }) {
  const clientConfig = useService(ClientConfig);
  const { formatPercentage } = useNumberFormat();
  const { t } = useTranslation('mediaSlideshow');
  const mediaSlideshowInfo = useService(MediaSlideshowInfo);
  const [playingChapterIndex, setPlayingChapterIndex] = useState(-1);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [selectedChapterFraction, setSelectedChapterFraction] = useState(0);
  const { sourceType, sourceUrl, playbackRange, chapters, width } = content;

  const [mediaDuration] = useMediaDurations([urlUtils.getMediaUrl({ cdnRootUrl: clientConfig.cdnRootUrl, sourceType, sourceUrl })]);
  const sourceDuration = mediaDuration.duration;

  const playbackDuration = (playbackRange[1] - playbackRange[0]) * sourceDuration;

  useEffect(() => {
    const nextChapterStartPosition = chapters[selectedChapterIndex + 1]?.startPosition || 1;
    setSelectedChapterFraction(nextChapterStartPosition - chapters[selectedChapterIndex].startPosition);
  }, [chapters, selectedChapterIndex, playbackDuration]);

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };

    const isInvalidSourceUrl
      = newContent.sourceType !== MEDIA_SOURCE_TYPE.internal
      && validation.validateUrl(newContent.sourceUrl, t).validateStatus === 'error';

    onContentChanged(newContent, isInvalidSourceUrl);
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

  const handleChapterImageSourceTypeChange = event => {
    const { value } = event.target;
    const newChapters = cloneDeep(chapters);
    newChapters[selectedChapterIndex].image.sourceUrl = '';
    newChapters[selectedChapterIndex].image.sourceType = value;
    changeContent({ chapters: newChapters });
  };

  const handleChapterImageSourceUrlChange = event => {
    const { value } = event.target;
    const newChapters = cloneDeep(chapters);
    newChapters[selectedChapterIndex].image.sourceUrl = value;
    changeContent({ chapters: newChapters });
  };

  const handleChapterImageInternalResourceUrlChange = value => {
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
      sourceType: imageSourceType,
      sourceUrl: imageSourceUrl,
      fit: imageFit
    } = chapters[playingChapterIndex].image;

    const imageUrl = urlUtils.getImageUrl({
      cdnRootUrl: clientConfig.cdnRootUrl,
      sourceType: imageSourceType,
      sourceUrl: imageSourceUrl
    });

    if (!imageUrl) {
      return null;
    }

    return (
      <div className="MediaSlideshow-chapterImageOverlayWrapper">
        <div
          className="MediaSlideshow-chapterImageOverlay"
          style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: imageFit }}
          />
      </div>
    );
  };

  const timelineParts = chapters.map((chapter, index) => ({
    ...chapter,
    title: `${t('common:chapter')} ${index + 1}`
  }));

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
          {...formItemLayout}
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
          source={urlUtils.getMediaUrl({ sourceUrl, sourceType, cdnRootUrl: clientConfig.cdnRootUrl })}
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

            <FormItem label={t('common:startTimecode')} {...formItemLayout}>
              <span className="MediaSlideshowEditor-readonlyValue">
                {formatMediaPosition({ formatPercentage, position: chapters[selectedChapterIndex].startPosition, duration: playbackDuration })}
              </span>
            </FormItem>
            <FormItem label={t('common:duration')} {...formItemLayout}>
              <span className="MediaSlideshowEditor-readonlyValue">
                {formatMediaPosition({ formatPercentage, position: selectedChapterFraction, duration: playbackDuration })}
              </span>
            </FormItem>
            <FormItem label={t('common:type')} {...formItemLayout}>
              <RadioGroup value={chapters[selectedChapterIndex].type} onChange={handleChapterTypeChange}>
                <RadioButton value={CHAPTER_TYPE.image}>{t('chapterType_image')}</RadioButton>
                <RadioButton value={CHAPTER_TYPE.text}>{t('chapterType_text')}</RadioButton>
              </RadioGroup>
            </FormItem>
            {chapters[selectedChapterIndex].type === CHAPTER_TYPE.image && (
              <Fragment>
                <FormItem label={t('common:imageSource')} {...formItemLayout}>
                  <RadioGroup value={chapters[selectedChapterIndex].image.sourceType} onChange={handleChapterImageSourceTypeChange}>
                    <RadioButton value={IMAGE_SOURCE_TYPE.internal}>{t('common:internalCdn')}</RadioButton>
                    <RadioButton value={IMAGE_SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
                  </RadioGroup>
                </FormItem>
                {chapters[selectedChapterIndex].image.sourceType === IMAGE_SOURCE_TYPE.external && (
                  <FormItem
                    label={t('common:externalUrl')}
                    {...formItemLayout}
                    {...validation.validateUrl(chapters[selectedChapterIndex].image.sourceUrl, t)}
                    hasFeedback
                    >
                    <Input value={chapters[selectedChapterIndex].image.sourceUrl} onChange={handleChapterImageSourceUrlChange} />
                  </FormItem>
                )}
                {chapters[selectedChapterIndex].image.sourceType === IMAGE_SOURCE_TYPE.internal && (
                <FormItem label={t('common:internalUrl')} {...formItemLayout}>
                  <div className="u-input-and-button">
                    <Input
                      addonBefore={CDN_URL_PREFIX}
                      value={chapters[selectedChapterIndex].image.sourceUrl}
                      onChange={handleChapterImageSourceUrlChange}
                      />
                    <ResourcePicker
                      url={storageLocationPathToUrl(chapters[selectedChapterIndex].image.sourceUrl)}
                      onUrlChange={url => handleChapterImageInternalResourceUrlChange(urlToStorageLocationPath(url))}
                      />
                  </div>
                </FormItem>
                )}
                <FormItem
                  label={
                    <Fragment>
                      <Tooltip title={<Markdown>{t('imageFitInfoMarkdown')}</Markdown>}>
                        <InfoCircleOutlined className="u-info-icon" />
                      </Tooltip>
                      <span>{t('imageFit')}</span>
                    </Fragment>
                  }
                  {...formItemLayout}
                  >
                  <RadioGroup value={chapters[selectedChapterIndex].image.fit} onChange={handleChapterImageFitChange}>
                    <RadioButton value={IMAGE_FIT.cover}>{t('imageFit_cover')}</RadioButton>
                    <RadioButton value={IMAGE_FIT.contain}>{t('imageFit_contain')}</RadioButton>
                  </RadioGroup>
                </FormItem>
                <FormItem label={t('common:copyrightNotice')} {...formItemLayout}>
                  <MarkdownInput value={chapters[selectedChapterIndex].image.copyrightNotice} onChange={handleChapterImageCopyrightNoticeChanged} />
                </FormItem>
              </Fragment>
            )}
            {chapters[selectedChapterIndex].type === CHAPTER_TYPE.text && (
              <FormItem label={t('common:text')} {...formItemLayout}>
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
