import PropTypes from 'prop-types';
import { Modal, Button, Spin } from 'antd';
import MediaPlayer from './media-player.js';
import { useTranslation } from 'react-i18next';
import { useService } from '../container-context.js';
import ClientConfig from '../../bootstrap/client-config.js';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import TimecodeFineTunningInput from './timecode-fine-tunning-input.js';
import { MEDIA_SCREEN_MODE, RESOURCE_TYPE } from '../../domain/constants.js';
import { getAccessibleUrl, getSourceDuration } from '../../utils/source-utils.js';
import { analyzeMediaUrl, ensureValidMediaPosition } from '../../utils/media-utils.js';

function MediaRangeSelector({ sourceUrl, range, onRangeChange }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('mediaRangeSelector');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRange, setCurrentRange] = useState(range);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [currentMediaInfo, setCurrentMediaInfo] = useState(null);
  const [isRetrievingMediaInfo, setIsRetrievingMediaInfo] = useState(false);

  const currentStartTime = useMemo(() => Math.trunc(currentRange[0] * currentMediaInfo?.duration), [currentRange, currentMediaInfo]);
  const currentEndTime = useMemo(() => Math.trunc(currentRange[1] * currentMediaInfo?.duration), [currentRange, currentMediaInfo]);

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

  const handleStartFineTunningValueChange = newValue => {
    const newRangeStart = ensureValidMediaPosition(newValue / currentMediaInfo.duration);
    setCurrentRange([newRangeStart, currentRange[1]]);
  };

  const handleEndFineTunningValueChange = newValue => {
    const newRangeEnd = ensureValidMediaPosition(newValue / currentMediaInfo.duration);
    setCurrentRange([currentRange[0], newRangeEnd]);
  };

  function getCurrentRangeParts() {
    return [
      { startPosition: currentRange[0] || Number.MIN_VALUE, text: t('start') },
      { startPosition: currentRange[1] || 1, text: t('end') }
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
            <div className="MediaRangeSelector-noMedia">
              <Spin tip={t('loadingMessage')} />
            </div>
          )}
          {!isRetrievingMediaInfo && !currentMediaInfo && (
            <div className="MediaRangeSelector-noMedia">
              {t('errorMessage')}
            </div>
          )}
          {!isRetrievingMediaInfo && !!currentMediaInfo && (
            <Fragment>
              <div className="MediaRangeSelector-player">
                <MediaPlayer
                  allowPartClick
                  millisecondsLength={3}
                  parts={getCurrentRangeParts()}
                  screenMode={getScreenMode()}
                  screenWidth={70}
                  sourceUrl={currentMediaInfo.sanitizedUrl}
                  onProgress={handleProgress}
                  />
              </div>
              <div className="MediaRangeSelector-selector">
                <div className="MediaRangeSelector-selectorQuickSelect">
                  <span>
                    {t('selectRangeLabel')}
                  </span>
                  <Button
                    onClick={handleSetAsStartClick}
                    disabled={currentRange[1] <= currentPosition}
                    >
                    {`${t('as')} ${t('startTime')}`}
                  </Button>
                  <Button
                    onClick={handleSetAsEndClick}
                    disabled={currentPosition <= currentRange[0]}
                    >
                    {`${t('as')} ${t('endTime')}`}
                  </Button>
                </div>
                <div className="MediaRangeSelector-selectorFineTunning">
                  <div className="MediaRangeSelector-selectorFineTunningInput">
                    <span><b>{t('startTime')}:</b></span>
                    <TimecodeFineTunningInput
                      lowerLimit={0}
                      upperLimit={currentEndTime}
                      roundToLowerLimit
                      value={currentStartTime}
                      onValueChange={handleStartFineTunningValueChange}
                      />
                  </div>
                  <div className="MediaRangeSelector-selectorFineTunningInput">
                    <span><b>{t('endTime')}:</b></span>
                    <TimecodeFineTunningInput
                      lowerLimit={currentStartTime}
                      upperLimit={currentMediaInfo?.duration || 0}
                      roundToUpperLimit
                      value={currentEndTime}
                      onValueChange={handleEndFineTunningValueChange}
                      />
                  </div>
                </div>
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
