import classNames from 'classnames';
import React, { Fragment } from 'react';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import Markdown from '../../components/markdown.js';
import Collapsible from '../../components/collapsible.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { TILES_HOVER_EFFECT, LINK_SOURCE_TYPE, DISPLAY_MODE } from './constants.js';

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
  const { t } = useTranslation('catalog');
  const clientConfig = useService(ClientConfig);

  const { title, displayMode, width, items, imageTilesConfig } = content;

  const renderLinkListItem = (item, index) => {
    const itemLinkUrl = getItemLinkUrl(item);

    const itemTitle = item.title
      ? <Markdown inline>{item.title}</Markdown>
      : `[${t('noTitle')}]`;

    return (
      <li key={index.toString()} className="CatalogDisplay-linkListItem">
        {!itemLinkUrl && itemTitle}
        {!!itemLinkUrl && <a href={itemLinkUrl}>{itemTitle}</a>}
        <div className="CatalogDisplay-itemLinkDescription">{item.link.description}</div>
      </li>
    );
  };

  const renderImageTileItem = (item, index) => {
    const itemLinkUrl = getItemLinkUrl(item);
    const itemImageUrl = getAccessibleUrl({ url: item.image.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

    const itemClasses = classNames({
      'CatalogDisplay-imageTile': true,
      'CatalogDisplay-imageTile--noLink': !itemLinkUrl,
      'u-img-color-flip': imageTilesConfig.hoverEffect === TILES_HOVER_EFFECT.colorizeZoom && itemLinkUrl,
      'u-img-color-flip-hover-disabled': imageTilesConfig.hoverEffect === TILES_HOVER_EFFECT.colorizeZoom && !itemLinkUrl
    });

    const itemImage = <img className="CatalogDisplay-imageTileImage" src={itemImageUrl} />;
    const itemTitle = <Markdown className="CatalogDisplay-imageTileTitle" inline>{item.title}</Markdown>;

    return (
      <li key={index.toString()} className={itemClasses}>
        {!itemLinkUrl && (
          <Fragment>
            {itemImage}
            {itemTitle}
          </Fragment>
        )}
        {!!itemLinkUrl && <a href={itemLinkUrl}>{itemImage}{itemTitle}</a>}
        <div className="CatalogDisplay-itemLinkDescription">{item.link.description}</div>
      </li>
    );
  };

  const renderLinkListItems = () => {
    return (
      <ol className="CatalogDisplay-linkList">
        {items.map(renderLinkListItem)}
      </ol>
    );
  };

  const renderImageTileItems = () => {
    return (
      <ol
        className="CatalogDisplay-imageTiles"
        style={{ gridTemplateColumns: `repeat(${imageTilesConfig.maxTilesPerRow}, 1fr)` }}
        >
        {items.map(renderImageTileItem)}
      </ol>
    );
  };

  const renderItems = () => {
    switch (displayMode) {
      case DISPLAY_MODE.linkList:
        return renderLinkListItems();
      case DISPLAY_MODE.imageTiles:
        return renderImageTileItems();
      default:
        throw new Error(`Invalid display mode: '${displayMode}'`);
    }
  };

  return (
    <div className="CatalogDisplay">
      <div className={`CatalogDisplay-container u-width-${width}`}>
        {!!title && (
          <Collapsible width={width} isCollapsible isCollapsed={false} title={<Markdown inline>{title}</Markdown>}>
            {renderItems()}
          </Collapsible>
        )}
        {!title && renderItems()}
      </div>
    </div>
  );
}

CatalogDisplay.propTypes = {
  ...sectionDisplayProps
};

export default CatalogDisplay;
