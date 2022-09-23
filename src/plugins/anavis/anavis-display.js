import React from 'react';
import { MEDIA_KIND } from './constants.js';
import urlUtils from '../../utils/url-utils.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getContrastColor } from '../../ui/color-helper.js';
import { MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MediaPlayer from '../../components/media-player/media-player.js';

function AnavisDisplay({ content }) {
  const clientConfig = useService(ClientConfig);

  const { parts, media, width } = content;

  const sourceUrl = urlUtils.getMediaUrl({
    cdnRootUrl: clientConfig.cdnRootUrl,
    sourceType: media.sourceType,
    sourceUrl: media.sourceUrl
  });

  const renderParts = () => {
    return parts.map((part, index) => (
      <div key={index.toString()} className="AnavisDisplay-partOuter" style={{ flex: `${part.length} 0 0%` }}>
        <div className="AnavisDisplay-partInner" style={{ color: getContrastColor(part.color), backgroundColor: part.color }} title={part.name}>
          <div className="AnavisDisplay-partName">{part.name}</div>
        </div>
      </div>
    ));
  };

  const renderAnnotations = () => {
    const annotationCount = parts.reduce((maxCount, part) => Math.max(maxCount, part.annotations.length), 0);

    return Array.from({ length: annotationCount }, (_, index) => index)
      .map((item, annotationIndex) => (
        <div key={annotationIndex.toString()} className="AnavisDisplay-annotation">
          {parts.map((part, partIndex) => (
            <div
              key={partIndex.toString()}
              className="AnavisDisplay-annotationItem"
              title={part.annotations[annotationIndex]}
              style={{ flex: `${part.length} 0 0%` }}
              >
              <div className="AnavisDisplay-annotationItemText">
                {part.annotations[annotationIndex]}
              </div>
            </div>
          ))}
        </div>
      ));
  };

  return (
    <div className="AnavisDisplay">
      <div className="AnavisDisplay-row">
        <div className={`AnavisDisplay-parts u-width-${width || 100}`}>
          {renderParts()}
        </div>
      </div>
      <div className="AnavisDisplay-row">
        <div className={`AnavisDisplay-annotations u-width-${width || 100}`}>
          {renderAnnotations()}
        </div>
      </div>
      <div className={`AnavisDisplay-players u-width-${width || 100}`}>
        {sourceUrl && (
          <MediaPlayer
            source={sourceUrl}
            aspectRatio={media.aspectRatio}
            screenMode={media.kind === MEDIA_KIND.audio ? MEDIA_SCREEN_MODE.none : MEDIA_SCREEN_MODE.video}
            />
        )}
        <CopyrightNotice value={media.copyrightNotice} />
      </div>
    </div>
  );
}

AnavisDisplay.propTypes = {
  ...sectionDisplayProps
};

export default AnavisDisplay;
