import PropTypes from 'prop-types';
import { Modal, Button, Spin, Slider } from 'antd';
import MediaPlayer from './media-player.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { analyzeMediaUrl, determineMediaDuration, formatMillisecondsAsDuration } from '../utils/media-utils.js';

function MediaRangeSelector({ sourceUrl, range, onRangeChange }) {
  const { t } = useTranslation('mediaRangeSelector');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentMediaInfo, setCurrentMediaInfo] = useState(null);
  const [isRetrievingMediaInfo, setIsRetrievingMediaInfo] = useState(false);
  const [currentRange, setCurrentRange] = useState({ startTimecode: range.startTimecode, stopTimecode: range.stopTimecode });

  useEffect(() => {
    setCurrentRange({ startTimecode: range.startTimecode, stopTimecode: range.stopTimecode });
  }, [range.startTimecode, range.stopTimecode]);

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
    onRangeChange(currentRange);
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentMediaInfo(null);
  };

  const handleRangeChange = ([newStartTimecode, newStopTimecode]) => {
    setCurrentRange({
      startTimecode: newStartTimecode === 0 ? null : newStartTimecode,
      stopTimecode: newStopTimecode === currentMediaInfo.duration ? null : newStopTimecode
    });
  };

  const modalRender = modal => <div onClick={event => event.stopPropagation()}>{modal}</div>;

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
            sourceUrl={currentMediaInfo.sanitizedUrl}
            extraContentTop={(
              <div className="MediaRangeSelector-rangeSelectorArea">
                <div className="MediaRangeSelector-rangeDisplay">
                  {t('playbackRange', {
                    from: currentRange.startTimecode ? formatMillisecondsAsDuration(currentRange.startTimecode) : 'start',
                    to: currentRange.stopTimecode ? formatMillisecondsAsDuration(currentRange.stopTimecode) : 'end'
                  })}
                </div>
                <Slider
                  min={0}
                  max={currentMediaInfo.duration}
                  value={[currentRange.startTimecode ?? 0, currentRange.stopTimecode ?? currentMediaInfo.duration]}
                  tipFormatter={formatMillisecondsAsDuration}
                  onChange={handleRangeChange}
                  range
                  />
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
  range: PropTypes.shape({
    startTimecode: PropTypes.number,
    stopTimecode: PropTypes.number
  }),
  sourceUrl: PropTypes.string
};

MediaRangeSelector.defaultProps = {
  onRangeChange: () => {},
  range: {
    startTimecode: null,
    stopTimecode: null
  },
  sourceUrl: null
};

export default MediaRangeSelector;
