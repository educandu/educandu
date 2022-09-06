import by from 'thenby';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import { removeItemAt } from '../../utils/array-utils.js';
import MediaSlideshowInfo from './media-slideshow-info.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { Button, Divider, Form, Spin, Tooltip } from 'antd';
import React, { Fragment, useEffect, useState } from 'react';
import Timeline from '../../components/media-player/timeline.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { useNumberFormat } from '../../components/locale-context.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import MainTrackEditor from '../../components/media-player/main-track-editor.js';
import { MEDIA_SCREEN_MODE, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';
import { formatMediaPosition, getFullSourceUrl } from '../../utils/media-utils.js';
import { InfoCircleOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';

const FormItem = Form.Item;

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

const ensureChaptersOrder = chapters => chapters.sort(by(chapter => chapter.startPosition));

function MediaSlideshowEditor({ content, onContentChanged }) {
  const clientConfig = useService(ClientConfig);
  const { formatPercentage } = useNumberFormat();
  const { t } = useTranslation('mediaSlideshow');
  const [sourceDuration, setSourceDuration] = useState(0);
  const mediaSlideshowInfo = useService(MediaSlideshowInfo);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [selectedChapterFraction, setSelectedChapterFraction] = useState(0);
  const [isDeterminingDuration, setIsDeterminingDuration] = useState(false);
  const { sourceType, sourceUrl, playbackRange, chapters, width } = content;

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

  const handleDeterminingDuration = () => {
    setIsDeterminingDuration(true);
  };

  const handleDurationDetermined = duration => {
    setIsDeterminingDuration(false);
    setSourceDuration(duration);
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

  const handlePreviousChapterClick = () => {
    setSelectedChapterIndex(selectedChapterIndex - 1);
  };

  const handleNextChapterClick = () => {
    setSelectedChapterIndex(selectedChapterIndex + 1);
  };

  return (
    <div className="MediaSlideshowEditor">
      <Form layout="horizontal">
        <MainTrackEditor
          content={content}
          useShowVideo={false}
          useAspectRatio={false}
          onDeterminingDuration={handleDeterminingDuration}
          onDurationDetermined={handleDurationDetermined}
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

        <Divider className="MediaSlideshowEditor-chapterEditorDivider" plain>{t('editChapter')}</Divider>

        <MediaPlayer
          source={getFullSourceUrl({ url: sourceUrl, sourceType, cdnRootUrl: clientConfig.cdnRootUrl })}
          screenMode={MEDIA_SCREEN_MODE.none}
          />

        <Timeline
          durationInMilliseconds={playbackDuration}
          parts={chapters}
          selectedPartIndex={selectedChapterIndex}
          onPartAdd={handleChapterAdd}
          onPartDelete={handleChapterDelete}
          onStartPositionChange={handleChapterStartPositionChange}
          />

        {chapters.length && (
          <Fragment>
            <div className="MediaSlideshowEditor-chapterSelector">
              <Tooltip title={t('selectPreviousChapter')}>
                <Button
                  type="link"
                  size="small"
                  shape="circle"
                  icon={<LeftOutlined />}
                  onClick={handlePreviousChapterClick}
                  disabled={selectedChapterIndex === 0}
                  className="MediaSlideshowEditor-chapterSelectorArrow"
                  />
              </Tooltip>
              <span className="MediaSlideshowEditor-selectedChapterTitle">{chapters[selectedChapterIndex].title}</span>
              <Tooltip title={t('selectNextChapter')}>
                <Button
                  type="link"
                  size="small"
                  shape="circle"
                  icon={<RightOutlined />}
                  onClick={handleNextChapterClick}
                  disabled={selectedChapterIndex === chapters.length - 1}
                  className="MediaSlideshowEditor-chapterSelectorArrow"
                  />
              </Tooltip>
            </div>

            <FormItem label={t('startTimecode')} {...formItemLayout}>
              <span className="MediaSlideshowEditor-readonlyValue">
                {formatMediaPosition({ formatPercentage, position: chapters[selectedChapterIndex].startPosition, duration: playbackDuration })}
              </span>
            </FormItem>
            <FormItem label={t('duration')} {...formItemLayout}>
              <span className="MediaSlideshowEditor-readonlyValue">
                {formatMediaPosition({ formatPercentage, position: selectedChapterFraction, duration: playbackDuration })}
              </span>
            </FormItem>
          </Fragment>
        )}
      </Form>

      {isDeterminingDuration && (
        <Fragment>
          <div className="MediaSlideshowEditor-overlay" />
          <Spin className="MediaSlideshowEditor-overlaySpinner" tip={t('determiningDuration')} size="large" />
        </Fragment>
      )}
    </div>
  );
}

MediaSlideshowEditor.propTypes = {
  ...sectionEditorProps
};

export default MediaSlideshowEditor;
