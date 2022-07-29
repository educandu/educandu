import PropTypes from 'prop-types';
import MediaPlayer from './media-player.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { Modal, Button, Spin, Slider } from 'antd';
import { analyzeMediaUrl, determineMediaDuration, formatMillisecondsAsDuration } from '../utils/media-utils.js';

function MediaRangeSelector({ sourceUrl, range, onRangeChange }) {
  const { t } = useTranslation('mediaRangeSelector');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentMediaInfo, setCurrentMediaInfo] = useState(null);
  const [isRetrievingMediaInfo, setIsRetrievingMediaInfo] = useState(false);
  const [currentRange, setCurrentRange] = useState(range);

  useEffect(() => setCurrentRange(range), [range]);

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
    setCurrentRange(range);
  };

  const modalRender = modal => <div onClick={event => event.stopPropagation()}>{modal}</div>;

  const renderRangeText = () => {
    return t('playbackRange', {
      from: currentRange[0] !== 0 ? formatMillisecondsAsDuration(currentRange[0] * currentMediaInfo.duration) : 'start',
      to: currentRange[1] !== 1 ? formatMillisecondsAsDuration(currentRange[1] * currentMediaInfo.duration) : 'end'
    });
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
            extraCustomContent={(
              <div className="MediaRangeSelector-rangeSelectorArea">
                <div className="MediaRangeSelector-rangeDisplay">
                  {renderRangeText()}
                </div>
                <Slider
                  min={0}
                  max={1}
                  value={currentRange}
                  step={Number.EPSILON}
                  onChange={setCurrentRange}
                  tooltipVisible={false}
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
  range: PropTypes.arrayOf(PropTypes.number),
  sourceUrl: PropTypes.string
};

MediaRangeSelector.defaultProps = {
  onRangeChange: () => {},
  range: [0, 1],
  sourceUrl: ''
};

export default MediaRangeSelector;
