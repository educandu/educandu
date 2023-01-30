import { Button } from 'antd';
import routes from '../utils/routes.js';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { userProfileDocumentMetadataShape } from '../ui/default-prop-types.js';

function DocumentCard({ doc }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentCard');

  const isDeletedDocument = !doc;
  const title = isDeletedDocument ? `[${t('common:deletedDocument')}]` : doc.title;

  const handleButtonlick = () => {
    window.location = routes.getDocUrl({ id: doc._id, slug: doc.slug });
  };

  return (
    <div className="DocumentCard">
      <div className="DocumentCard-title">{title}</div>
      <div className="DocumentCard-content">
        {!isDeletedDocument && (
          <Fragment>
            <div className="DocumentCard-description">{doc.description}</div>
            <div className="DocumentCard-dateDetails">
              <div className="DocumentCard-dateDetail">
                {t('creationDetail', { date: formatDate(doc.createdOn) })} <a href={routes.getUserProfileUrl(doc.createdBy._id)}>{doc.createdBy.displayName}</a>
              </div>
              <div className="DocumentCard-dateDetail">
                {t('updateDetail', { date: formatDate(doc.updatedOn) })} <a href={routes.getUserProfileUrl(doc.updatedBy._id)}>{doc.updatedBy.displayName}</a>
              </div>
            </div>
          </Fragment>
        )}
      </div>
      <Button type="primary" onClick={handleButtonlick} disabled={isDeletedDocument} className="DocumentCard-button">
        {t('documentButton')}
      </Button>
    </div>
  );
}

DocumentCard.propTypes = {
  doc: userProfileDocumentMetadataShape
};

DocumentCard.defaultProps = {
  doc: null
};

export default DocumentCard;
