import React from 'react';
import PropTypes from 'prop-types';
import { Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

function ChapterSelector({
  chaptersCount,
  selectedChapterIndex,
  selectedChapterTitle,
  onChapterIndexChange
}) {
  const { t } = useTranslation('chapterSelector');

  return (
    <div className="ChapterSelector">
      <Tooltip title={t('selectPreviousChapter')}>
        <Button
          type="link"
          size="small"
          shape="circle"
          icon={<LeftOutlined />}
          onClick={() => onChapterIndexChange(selectedChapterIndex - 1)}
          disabled={selectedChapterIndex === 0}
          className="ChapterSelector-arrow"
          />
      </Tooltip>
      <span className="ChapterSelector-title">{selectedChapterTitle}</span>
      <Tooltip title={t('selectNextChapter')}>
        <Button
          type="link"
          size="small"
          shape="circle"
          icon={<RightOutlined />}
          onClick={() => onChapterIndexChange(selectedChapterIndex + 1)}
          disabled={selectedChapterIndex === chaptersCount - 1}
          className="ChapterSelector-arrow"
          />
      </Tooltip>
    </div>
  );
}

ChapterSelector.propTypes = {
  chaptersCount: PropTypes.number.isRequired,
  onChapterIndexChange: PropTypes.func.isRequired,
  selectedChapterIndex: PropTypes.number.isRequired,
  selectedChapterTitle: PropTypes.string.isRequired
};

export default ChapterSelector;
