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

function DocumentCategoryHeader({ documentCategory, bordered, detailed }) {
  const { t } = useTranslation();
  const clientConfig = useService(ClientConfig);

  const iconUrl = documentCategory.iconUrl
    ? getAccessibleUrl({ url: documentCategory.iconUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    : null;

  const rootClasses = classNames({
    'DocumentCategoryHeader': true,
    'DocumentCategoryHeader--bordered': bordered,
    'DocumentCategoryHeader--detailed': detailed
  });

  const iconClasses = classNames({
    'DocumentCategoryHeader-icon': true,
    'DocumentCategoryHeader-icon--detailed': detailed
  });

  const nameClasses = classNames({
    'DocumentCategoryHeader-name': true,
    'DocumentCategoryHeader-name--detailed': detailed
  });

  return (
    <div className={rootClasses}>
      <div>
        {!!iconUrl && <img src={iconUrl} className={iconClasses} />}
      </div>
      <div>
        <div className={nameClasses}>{documentCategory.name}</div>
        {!!detailed && !!documentCategory.description && (
          <Markdown className="DocumentCategoryHeader-description">
            {documentCategory.description}
          </Markdown>
        )}
        {!!detailed && (
          <div className="DocumentCategoryHeader-documentCategoryPageLink">
            <a href={routes.getDocumentCategoryUrl({ id: documentCategory._id, slug: slugify(documentCategory.name) })}>
              {t('common:navigateToDocumentCategoryPage', { documentCategoryName: documentCategory.name })}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

DocumentCategoryHeader.propTypes = {
  documentCategory: documentCategoryShape.isRequired,
  bordered: PropTypes.bool,
  detailed: PropTypes.bool
};

DocumentCategoryHeader.defaultProps = {
  bordered: false,
  detailed: false
};

export default DocumentCategoryHeader;
