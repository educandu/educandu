import React from 'react';
import colorHelper from '../../ui/color-helper.js';
import Markdown from '../../components/markdown.js';
import { MEDIA_KIND, SOURCE_TYPE } from './constants.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MediaPlayer, { ASPECT_RATIO } from '../../components/media-player.js';

function AnavisDisplay({ content }) {
  const clientConfig = useService(ClientConfig);

  const { parts, media, width } = content;

  let sourceUrl;
  switch (media.sourceType) {
    case SOURCE_TYPE.internal:
      sourceUrl = media.sourceUrl ? `${clientConfig.cdnRootUrl}/${media.sourceUrl}` : null;
      break;
    default:
      sourceUrl = media.sourceUrl || null;
      break;
  }

  const aspectRatio = media.aspectRatio?.h === 4 && media.aspectRatio?.v === 3
    ? ASPECT_RATIO.fourToThree
    : ASPECT_RATIO.sixteenToNine;

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
            sourceUrl={sourceUrl}
            aspectRatio={aspectRatio}
            audioOnly={media.kind === MEDIA_KIND.audio}
            />
        )}
        {media.text && (
          <div className="AnavisDisplay-text">
            <Markdown>{media.text}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}

AnavisDisplay.propTypes = {
  ...sectionDisplayProps
};

export default AnavisDisplay;
