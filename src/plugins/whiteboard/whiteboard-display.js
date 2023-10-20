import React, { useCallback } from 'react';
import { WhiteboardCanvas } from './whiteboard-canvas.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { MEDIA_ASPECT_RATIO } from '../../domain/constants.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

const createInitialData = () => ({ canvasData: null });

export default function WhiteboardDisplay({ content, input, onInputChanged }) {
  const { width, viewportWidth, aspectRatio, image } = content;
  const data = input.data || createInitialData();

  const clientConfig = useService(ClientConfig);
  const backgroundImageUrl = image.sourceUrl
    ? getAccessibleUrl({ url: image.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    : null;

  const handleCanvasDataChange = useCallback(newCanvasData => {
    onInputChanged({ canvasData: newCanvasData });
  }, [onInputChanged]);

  const numericalAspectRatio = aspectRatio === MEDIA_ASPECT_RATIO.fourToThree ? 4 / 3 : 16 / 9;
  const viewportHeight = Math.round(viewportWidth / numericalAspectRatio);

  return (
    <div className={`u-horizontally-centered u-width-${width}`}>
      <WhiteboardCanvas
        data={data.canvasData}
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        backgroundImageUrl={backgroundImageUrl}
        onChange={handleCanvasDataChange}
        />
      {!!image.copyrightNotice && <CopyrightNotice value={image.copyrightNotice} />}
    </div>
  );
}

WhiteboardDisplay.propTypes = {
  ...sectionDisplayProps
};
