import PropTypes from 'prop-types';
import classNames from 'classnames';
import Markdown from './markdown.js';
import routes from '../utils/routes.js';
import React, { Fragment } from 'react';
import slugify from '@sindresorhus/slugify';
import { useTranslation } from 'react-i18next';
import { useService } from './container-context.js';
import ClientConfig from '../bootstrap/client-config.js';
import { getAccessibleUrl } from '../utils/source-utils.js';
import { documentCategoryShape } from '../ui/default-prop-types.js';

function DocumentCategoryDisplay({ documentCategory, bordered, detailed, asLink, minimizable }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('documentCategoryDisplay');

  const iconUrl = documentCategory.iconUrl
    ? getAccessibleUrl({ url: documentCategory.iconUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    : null;

  const getDocumentCategoryUrl = () => routes.getDocumentCategoryUrl({ id: documentCategory._id, slug: slugify(documentCategory.name) });

  const rootClasses = classNames({
    'DocumentCategoryDisplay': true,
    'DocumentCategoryDisplay--bordered': bordered,
    'DocumentCategoryDisplay--detailed': detailed,
    'DocumentCategoryDisplay--minimizable': minimizable
  });

  const iconClasses = classNames({
    'DocumentCategoryDisplay-icon': true,
    'DocumentCategoryDisplay-icon--detailed': detailed
  });

  const nameClasses = classNames({
    'DocumentCategoryDisplay-name': true,
    'DocumentCategoryDisplay-name--detailed': detailed,
    'DocumentCategoryDisplay-name--minimizable': minimizable
  });

  const renderContent = () => {
    return (
      <Fragment>
        <div className='DocumentCategoryDisplay-iconContainer'>
          {!!iconUrl && <img src={iconUrl} className={iconClasses} />}
        </div>
        <div>
          <div className={nameClasses}>{documentCategory.name}</div>
          {!!detailed && !!documentCategory.description && (
          <Markdown className="DocumentCategoryDisplay-description">
            {documentCategory.description}
          </Markdown>
          )}
          {!!detailed && (
          <div className="DocumentCategoryDisplay-documentCategoryPageLink">
            <a href={getDocumentCategoryUrl()}>
              {t('navigateToDocumentCategoryPage', { documentCategoryName: documentCategory.name })}
            </a>
          </div>
          )}
        </div>
      </Fragment>
    );
  };

  if (asLink) {
    return (
      <a href={getDocumentCategoryUrl()} className={rootClasses}>
        {renderContent()}
      </a>
    );
  }

  return (
    <div className={rootClasses}>
      {renderContent()}
    </div>
  );
}

DocumentCategoryDisplay.propTypes = {
  documentCategory: documentCategoryShape.isRequired,
  asLink: PropTypes.bool,
  bordered: PropTypes.bool,
  detailed: PropTypes.bool,
  minimizable: PropTypes.bool
};

DocumentCategoryDisplay.defaultProps = {
  asLink: false,
  bordered: false,
  detailed: false,
  minimizable: false
};

export default DocumentCategoryDisplay;
