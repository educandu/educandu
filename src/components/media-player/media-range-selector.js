import PropTypes from 'prop-types';
import { Modal, Button, Spin } from 'antd';
import MediaPlayer from './media-player.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { MEDIA_SCREEN_MODE, RESOURCE_TYPE } from '../../domain/constants.js';
import { analyzeMediaUrl, determineMediaDuration, formatMillisecondsAsDuration, ensureValidMediaPosition } from '../../utils/media-utils.js';

function MediaRangeSelector({ sourceUrl, range, onRangeChange }) {
  const { t } = useTranslation('mediaRangeSelector');
  const [currentRange, setCurrentRange] = useState(range);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentMediaInfo, setCurrentMediaInfo] = useState(null);
  const [isRetrievingMediaInfo, setIsRetrievingMediaInfo] = useState(false);

  useEffect(() => setCurrentRange(range), [range]);
  useEffect(() => {
    setCurrentPosition(currentMediaInfo?.duration ? currentProgress / currentMediaInfo.duration : 0);
  }, [currentProgress, currentMediaInfo]);

  const handleSelectButtonClick = async () => {
    setIsModalVisible(true);
    try {
      setIsRetrievingMediaInfo(true);
      const info = analyzeMediaUrl(sourceUrl);
      const duration = await determineMediaDuration(sourceUrl);
      setCurrentMediaInfo({ ...info, duration });
    } catch (error) {
      setCurrentMediaInfo(null);
    } finally {
      setIsRetrievingMediaInfo(false);
    }
  };

  const handleApply = () => {
    setCurrentProgress(0);
    onRangeChange(currentRange);
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentProgress(0);
    setCurrentRange(range);
    setCurrentMediaInfo(null);
  };

  const handleSetMaxRange = () => {
    setCurrentRange([0, 1]);
  };

  const modalRender = modal => <div onClick={event => event.stopPropagation()}>{modal}</div>;

  const handleSetAsStartClick = () => {
    const newRangeStart = ensureValidMediaPosition(currentProgress / currentMediaInfo.duration);
    setCurrentRange([newRangeStart, currentRange[1]]);
  };

  const handleSetAsEndClick = () => {
    const newRangeEnd = ensureValidMediaPosition(currentProgress / currentMediaInfo.duration);
    setCurrentRange([currentRange[0], newRangeEnd]);
  };

  const handleProgress = timecode => {
    setCurrentProgress(timecode);
  };

  function getCurrentRangeParts() {
    return [
      { startPosition: currentRange[0] || Number.MIN_VALUE },
      { startPosition: currentRange[1] || 1 }
    ];
  }

  const renderRangeText = () => {
    return t('playbackRange', {
      from: currentRange[0] !== 0 ? formatMillisecondsAsDuration(currentRange[0] * currentMediaInfo.duration) : 'start',
      to: currentRange[1] !== 1 ? formatMillisecondsAsDuration(currentRange[1] * currentMediaInfo.duration) : 'end'
    });
  };

  const renderFooter = () => (
    <div className="MediaRangeSelector-footer">
      <Button onClick={handleSetMaxRange}>
        {t('setMaxRange')}
      </Button>
      <div>
        <Button onClick={handleCancel}>
          {t('common:cancel')}
        </Button>
        <Button type="primary" onClick={handleApply}>
          {t('common:apply')}
        </Button>
      </div>
    </div>
  );

  const getScreenMode = () => {
    return currentMediaInfo?.resourceType === RESOURCE_TYPE.video ? MEDIA_SCREEN_MODE.video : MEDIA_SCREEN_MODE.none;
  };

  return (
    <div className="MediaRangeSelector">
      <Button type="primary" onClick={handleSelectButtonClick}>{t('common:select')}</Button>
      <Modal
        width="80%"
        visible={isModalVisible}
        title={t('modalTitle')}
        onOk={handleApply}
        okText={t('common:apply')}
        okButtonProps={{ disabled: isRetrievingMediaInfo || !currentMediaInfo }}
        onCancel={handleCancel}
        cancelText={t('common:cancel')}
        modalRender={modalRender}
        footer={renderFooter()}
        destroyOnClose
        centered
        >
        {isRetrievingMediaInfo && (
          <div className="MediaRangeSelector-noMediaArea">
            <Spin tip={t('loadingMessage')} />
          </div>
        )}
        {!isRetrievingMediaInfo && !currentMediaInfo && (
          <div className="MediaRangeSelector-noMediaArea">
            {t('errorMessage')}
          </div>
        )}
        {!isRetrievingMediaInfo && currentMediaInfo && (
          <MediaPlayer
            source={currentMediaInfo.sanitizedUrl}
            onProgress={handleProgress}
            parts={getCurrentRangeParts()}
            screenMode={getScreenMode()}
            extraCustomContent={(
              <div className="MediaRangeSelector-rangeSelectorArea">
                <div className="MediaRangeSelector-rangeDisplay">
                  {renderRangeText()}
                </div>
                <div className="MediaRangeSelector-rangeSelector">
                  {t('selectRangeLabel', { timecode: formatMillisecondsAsDuration(currentProgress) })}
                  <div className="MediaRangeSelector-rangeSelectorButtons">
                    <Button
                      onClick={handleSetAsStartClick}
                      disabled={currentRange[1] <= currentPosition}
                      >
                      {t('setAsStart')}
                    </Button>
                    <Button
                      onClick={handleSetAsEndClick}
                      disabled={currentPosition <= currentRange[0]}
                      >
                      {t('setAsEnd')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            />
        )}
      </Modal>
    </div>
  );
}

MediaRangeSelector.propTypes = {
  onRangeChange: PropTypes.func,
  range: PropTypes.arrayOf(PropTypes.number),
  sourceUrl: PropTypes.string
};

MediaRangeSelector.defaultProps = {
  onRangeChange: () => {},
  range: [0, 1],
  sourceUrl: ''
};

export default MediaRangeSelector;
