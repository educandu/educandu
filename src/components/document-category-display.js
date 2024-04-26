import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Markdown from './markdown.js';
import routes from '../utils/routes.js';
import slugify from '@sindresorhus/slugify';
import { useTranslation } from 'react-i18next';
import { useService } from './container-context.js';
import ClientConfig from '../bootstrap/client-config.js';
import { getAccessibleUrl } from '../utils/source-utils.js';
import { documentCategoryShape } from '../ui/default-prop-types.js';

function DocumentCategoryDisplay({ documentCategory, bordered, detailed }) {
  const { t } = useTranslation();
  const clientConfig = useService(ClientConfig);

  const iconUrl = documentCategory.iconUrl
    ? getAccessibleUrl({ url: documentCategory.iconUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    : null;

  const rootClasses = classNames({
    'DocumentCategoryDisplay': true,
    'DocumentCategoryDisplay--bordered': bordered,
    'DocumentCategoryDisplay--detailed': detailed
  });

  const iconClasses = classNames({
    'DocumentCategoryDisplay-icon': true,
    'DocumentCategoryDisplay-icon--detailed': detailed
  });

  const nameClasses = classNames({
    'DocumentCategoryDisplay-name': true,
    'DocumentCategoryDisplay-name--detailed': detailed
  });

  return (
    <div className={rootClasses}>
      <div>
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
            <a href={routes.getDocumentCategoryUrl({ id: documentCategory._id, slug: slugify(documentCategory.name) })}>
              {t('common:navigateToDocumentCategoryPage', { documentCategoryName: documentCategory.name })}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

DocumentCategoryDisplay.propTypes = {
  documentCategory: documentCategoryShape.isRequired,
  bordered: PropTypes.bool,
  detailed: PropTypes.bool
};

DocumentCategoryDisplay.defaultProps = {
  bordered: false,
  detailed: false
};

export default DocumentCategoryDisplay;
