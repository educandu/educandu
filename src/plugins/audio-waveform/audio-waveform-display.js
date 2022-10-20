import { Button } from 'antd';
import classNames from 'classnames';
import { DISPLAY_MODE } from './constants.js';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import React, { Fragment, useRef, useState } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import AudioWaveformCanvas from './audio-waveform-canvas.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import DimensionsProvider from '../../components/dimensions-provider.js';

function AudioWaveformDisplay({ content }) {
  const waveformApiRef = useRef();
  const { t } = useTranslation('audioWaveform');
  const clientConfig = useService(ClientConfig);
  const [showResolution, setShowResolution] = useState(false);

  const { sourceType, sourceUrl, width, displayMode, interactivityConfig } = content;
  const { penColor, baselineColor, backgroundColor, opacityWhenResolved } = interactivityConfig;

  const resolvedUrl = urlUtils.getImageUrl({
    cdnRootUrl: clientConfig.cdnRootUrl,
    sourceType,
    sourceUrl
  });

  const imageClasses = classNames({
    'AudioWaveformDisplay-image': true,
    'AudioWaveformDisplay-image--hidden': displayMode === DISPLAY_MODE.interactive && !showResolution
  });

  const userLayerClasses = classNames({
    'AudioWaveformDisplay-userLayer': true,
    'AudioWaveformDisplay-userLayer--active': displayMode === DISPLAY_MODE.interactive
  });

  const userLayerOpacity = showResolution ? opacityWhenResolved : 1;

  const handleToggleResolutionClick = () => {
    setShowResolution(oldValue => !oldValue);
  };

  const handleResetClick = () => {
    setShowResolution(false);
    waveformApiRef.current.clear();
  };

  return (
    <div className="AudioWaveformDisplay">
      <div className={`AudioWaveformDisplay-dimensionsWrapper u-width-${width}`}>
        <DimensionsProvider>
          {({ containerHeight, containerWidth }) => (
            <Fragment>
              <img className={imageClasses} src={resolvedUrl} />
              <div className={userLayerClasses} style={{ opacity: userLayerOpacity }}>
                <AudioWaveformCanvas
                  apiRef={waveformApiRef}
                  width={containerWidth}
                  height={containerHeight}
                  penColor={penColor}
                  baselineColor={baselineColor}
                  backgroundColor={backgroundColor}
                  />
              </div>
            </Fragment>
          )}
        </DimensionsProvider>
      </div>
      {displayMode === DISPLAY_MODE.interactive && (
        <div className={`AudioWaveformDisplay-controls u-width-${width}`}>
          <Button onClick={handleResetClick}>
            {t('common:reset')}
          </Button>
          <Button onClick={handleToggleResolutionClick}>
            {t(showResolution ? 'hideResolution' : 'showResolution')}
          </Button>
        </div>
      )}
    </div>
  );
}

AudioWaveformDisplay.propTypes = {
  ...sectionDisplayProps
};

export default AudioWaveformDisplay;
