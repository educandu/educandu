import React from 'react';
import classNames from 'classnames';
import routes from '../../utils/routes.js';
import urlUtils from '../../utils/url-utils.js';
import Markdown from '../../components/markdown.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { TILES_HOVER_EFFECT, LINK_SOURCE_TYPE } from './constants.js';

const getItemLinkUrl = item => {
  const link = item.link || {};
  switch (link.sourceType) {
    case LINK_SOURCE_TYPE.external:
      return link.sourceUrl;
    case LINK_SOURCE_TYPE.document:
      return link.documentId ? routes.getDocUrl({ id: link.documentId }) : '';
    default:
      return '';
  }
};

function CatalogDisplay({ content }) {
  const clientConfig = useService(ClientConfig);

  const renderItem = (item, index) => {
    const linkUrl = getItemLinkUrl(item);

    const imageUrl = urlUtils.getImageUrl({
      cdnRootUrl: clientConfig.cdnRootUrl,
      sourceType: item.image.sourceType,
      sourceUrl: item.image.sourceUrl
    });

    const classes = classNames({
      'CatalogDisplay-item': true,
      'CatalogDisplay-item--noLink': !linkUrl,
      'u-img-color-flip': content.imageTilesConfig.hoverEffect === TILES_HOVER_EFFECT.colorizeZoom && linkUrl,
      'u-img-color-flip-hover-disabled': content.imageTilesConfig.hoverEffect === TILES_HOVER_EFFECT.colorizeZoom && !linkUrl
    });

    const image = (
      <img className="CatalogDisplay-image" src={imageUrl} />
    );

    const title = (
      <div className="CatalogDisplay-title">
        <Markdown inline>{item.title}</Markdown>
      </div>
    );

    return linkUrl
      ? <a key={index.toString()} className={classes} href={linkUrl}>{image}{title}</a>
      : <span key={index.toString()} className={classes}>{image}{title}</span>;
  };

  return (
    <div className="CatalogDisplay">
      <div
        className={`CatalogDisplay-grid u-width-${content.width}`}
        style={{ gridTemplateColumns: `repeat(${content.imageTilesConfig.maxTilesPerRow}, 1fr)` }}
        >
        {content.items.map(renderItem)}
      </div>
    </div>
  );
}

CatalogDisplay.propTypes = {
  ...sectionDisplayProps
};

export default CatalogDisplay;
