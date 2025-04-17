import React, { useCallback } from 'react';
import Markdown from '../../components/markdown.js';
import { WhiteboardCanvas } from './whiteboard-canvas.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { getHeightForAspectRatio } from '../../utils/aspect-ratio-utils.js';

const createInitialData = () => ({ canvasData: null });

export default function WhiteboardDisplay({ content, input, canModifyInput, onInputChanged }) {
  const data = input.data || createInitialData();
  const { label, width, viewportWidth, aspectRatio, image, isBorderVisible } = content;

  const clientConfig = useService(ClientConfig);
  const backgroundImageUrl = image.sourceUrl
    ? getAccessibleUrl({ url: image.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    : null;

  const handleCanvasDataChange = useCallback(newCanvasData => {
    onInputChanged({ canvasData: newCanvasData });
  }, [onInputChanged]);

  const viewportHeight = getHeightForAspectRatio(viewportWidth, aspectRatio);

  return (
    <div className={`WhiteboardDisplay u-horizontally-centered u-width-${width}`}>
      {!!label && (
        <div className="WhiteboardDisplay-label">
          <Markdown inline>{label}</Markdown>
        </div>
      )}
      <WhiteboardCanvas
        data={data.canvasData}
        disabled={!canModifyInput}
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        isBorderVisible={isBorderVisible}
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
