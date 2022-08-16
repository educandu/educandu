import React from 'react';
import { MEDIA_KIND } from './constants.js';
import colorHelper from '../../ui/color-helper.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import { MEDIA_SCREEN_MODE, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';

function AnavisDisplay({ content }) {
  const clientConfig = useService(ClientConfig);

  const { parts, media, width } = content;

  let sourceUrl;
  switch (media.sourceType) {
    case MEDIA_SOURCE_TYPE.internal:
      sourceUrl = media.sourceUrl ? `${clientConfig.cdnRootUrl}/${media.sourceUrl}` : null;
      break;
    default:
      sourceUrl = media.sourceUrl || null;
      break;
  }

  const renderParts = () => {
    return parts.map((part, index) => (
      <div key={index.toString()} className="AnavisDisplay-partOuter" style={{ flex: `${part.length} 0 0%` }}>
        <div className="AnavisDisplay-partInner" style={{ color: colorHelper.getContrastColor(part.color), backgroundColor: part.color }} title={part.name}>
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
