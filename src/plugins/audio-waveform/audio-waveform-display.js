import { Button } from 'antd';
import classNames from 'classnames';
import { DISPLAY_MODE } from './constants.js';
import { useTranslation } from 'react-i18next';
import React, { Fragment, useRef, useState } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import AudioWaveformCanvas from './audio-waveform-canvas.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import DimensionsProvider from '../../components/dimensions-provider.js';

function AudioWaveformDisplay({ content }) {
  const waveformApiRef = useRef();
  const { t } = useTranslation('audioWaveform');
  const clientConfig = useService(ClientConfig);
  const [isResolved, setIsResolved] = useState(false);

  const { sourceUrl, width, displayMode, interactivityConfig } = content;
  const { penColor, baselineColor, backgroundColor, opacityWhenResolved } = interactivityConfig;

  const url = getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

  const imageClasses = classNames({
    'AudioWaveformDisplay-image': true,
    'AudioWaveformDisplay-image--hidden': displayMode === DISPLAY_MODE.interactive && !isResolved
  });

  const userLayerClasses = classNames({
    'AudioWaveformDisplay-userLayer': true,
    'AudioWaveformDisplay-userLayer--active': displayMode === DISPLAY_MODE.interactive
  });

  const userLayerOpacity = isResolved ? opacityWhenResolved : 1;

  const handleToggleResolutionClick = () => {
    setIsResolved(oldValue => !oldValue);
  };

  const handleResetClick = () => {
    setIsResolved(false);
    waveformApiRef.current.clear();
  };

  return (
    <div className="AudioWaveformDisplay">
      <div className={`AudioWaveformDisplay-dimensionsWrapper u-width-${width}`}>
        <DimensionsProvider>
          {({ containerHeight, containerWidth }) => (
            <Fragment>
              <img className={imageClasses} src={url} />
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
            {t(isResolved ? 'hideResolution' : 'showResolution')}
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
