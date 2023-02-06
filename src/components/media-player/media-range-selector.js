import PropTypes from 'prop-types';
import { Modal, Button, Spin } from 'antd';
import MediaPlayer from './media-player.js';
import { useTranslation } from 'react-i18next';
import { useService } from '../container-context.js';
import ClientConfig from '../../bootstrap/client-config.js';
import React, { Fragment, useEffect, useState } from 'react';
import { MEDIA_SCREEN_MODE, RESOURCE_TYPE } from '../../domain/constants.js';
import { getAccessibleUrl, getSourceDuration } from '../../utils/source-utils.js';
import { analyzeMediaUrl, formatMillisecondsAsDuration, ensureValidMediaPosition } from '../../utils/media-utils.js';

function MediaRangeSelector({ sourceUrl, range, onRangeChange }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('mediaRangeSelector');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRange, setCurrentRange] = useState(range);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [currentMediaInfo, setCurrentMediaInfo] = useState(null);
  const [isRetrievingMediaInfo, setIsRetrievingMediaInfo] = useState(false);

  useEffect(() => setCurrentRange(range), [range]);
  useEffect(() => {
    setCurrentPosition(currentMediaInfo?.duration ? currentProgress / currentMediaInfo.duration : 0);
  }, [currentProgress, currentMediaInfo]);

  const handleSelectButtonClick = async () => {
    setIsModalOpen(true);
    try {
      setIsRetrievingMediaInfo(true);
      const accessibleUrl = getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

      const { resourceType, sanitizedUrl } = analyzeMediaUrl(accessibleUrl);
      const duration = await getSourceDuration({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

      setCurrentMediaInfo({ resourceType, sanitizedUrl, duration });
    } catch (error) {
      setCurrentMediaInfo(null);
    } finally {
      setIsRetrievingMediaInfo(false);
    }
  };

  const handleApply = () => {
    setCurrentProgress(0);
    onRangeChange(currentRange);
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
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

  const renderFooter = () => (
    <div className="MediaRangeSelector-footer">
      <Button onClick={handleSetMaxRange}>
        {t('clearRange')}
      </Button>
      <div className="MediaRangeSelector-footerGroup">
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
        width="70%"
        open={isModalOpen}
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
        <div className="u-modal-body">
          {!!isRetrievingMediaInfo && (
            <div className="MediaRangeSelector-noMediaArea">
              <Spin tip={t('loadingMessage')} />
            </div>
          )}
          {!isRetrievingMediaInfo && !currentMediaInfo && (
            <div className="MediaRangeSelector-noMediaArea">
              {t('errorMessage')}
            </div>
          )}
          {!isRetrievingMediaInfo && !!currentMediaInfo && (
            <Fragment>
              <div className="MediaRangeSelector-player">
                <MediaPlayer
                  parts={getCurrentRangeParts()}
                  screenMode={getScreenMode()}
                  screenWidth={70}
                  sourceUrl={currentMediaInfo.sanitizedUrl}
                  onProgress={handleProgress}
                  />
              </div>
              <div className="MediaRangeSelector-rangeSelectorArea">
                <div className="MediaRangeSelector-rangeSelector">
                  <span>
                    {t('selectRangeLabel', { timecode: formatMillisecondsAsDuration(currentProgress) })}
                  </span>
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
                <section className="MediaRangeSelector-rangeFineTunning">
                  <div className="MediaRangeSelector-selectedTimecodesColumn">
                    <span>{t('common:startTimecode')}:</span>
                    <span>{t('endTimecode')}:</span>
                  </div>
                  <div className="MediaRangeSelector-selectedTimecodesColumn">
                    <div>
                      {formatMillisecondsAsDuration(currentRange[0] * currentMediaInfo.duration)}
                    </div>
                    <div>
                      {formatMillisecondsAsDuration(currentRange[1] * currentMediaInfo.duration)}
                    </div>
                  </div>
                </section>
              </div>
            </Fragment>
          )}
        </div>
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
