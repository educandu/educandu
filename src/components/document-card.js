import React from 'react';
import routes from '../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { DoubleRightOutlined } from '@ant-design/icons';
import { documentMetadataShape } from '../ui/default-prop-types.js';

function DocumentCard({ doc }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentCard');

  return (
    <div className="DocumentCard">
      <div className="DocumentCard-notebook">
        <div className="DocumentCard-notebookText">{doc.title}</div>
        <div className="DocumentCard-infoRow">
          <div>{t('common:created')}: </div>
          <div>{formatDate(doc.createdOn)}</div>
        </div>
        <div className="DocumentCard-infoRow">
          <div>{t('common:updated')}: </div>
          <div>{formatDate(doc.updatedOn)}</div>
        </div>
        <a className="DocumentCard-notebookLink" href={routes.getDocUrl({ id: doc._id, slug: doc.slug })}>
          {t('toDocument')}
          <div className="DocumentCard-notebookLinkArrow"><DoubleRightOutlined /></div>
        </a>
      </div>
    </div>
  );
}

DocumentCard.propTypes = {
  doc: documentMetadataShape.isRequired
};

export default DocumentCard;
