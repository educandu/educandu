import React from 'react';
import classNames from 'classnames';
import { IMAGE_POSITION } from './constants.js';
import Markdown from '../../components/markdown.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

export default function MarkdownWithImageDisplay({ content }) {
  const clientConfig = useService(ClientConfig);
  const { text, image } = content;

  const imageSrc = getAccessibleUrl({ url: image.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
  const imageWrapperStyle = { float: image.position };
  if (image.position === IMAGE_POSITION.left) {
    imageWrapperStyle.paddingLeft = 0;
  } else {
    imageWrapperStyle.paddingRight = 0;
  }

  return (
    <div className="MarkdownWithImageDisplay">
      <div className="MarkdownWithImageDisplay-verticallyStretchedContent">
        <div
          style={imageWrapperStyle}
          className={classNames('MarkdownWithImageDisplay-imageWrapper', `u-width-${image.width}`)}
          >
          <img src={imageSrc} className="MarkdownWithImageDisplay-image" />
          {!!image.copyrightNotice && <CopyrightNotice value={image.copyrightNotice} />}
        </div>
        <Markdown renderAnchors>{text}</Markdown>
      </div>
    </div>
  );
}

MarkdownWithImageDisplay.propTypes = {
  ...sectionDisplayProps
};
