import React from 'react';
import routes from '../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { DoubleRightOutlined } from '@ant-design/icons';
import { documentMetadataShape } from '../ui/default-prop-types.js';

function MinimalDocumentCard({ doc }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('minimalDocumentCard');

  return (
    <div className="MinimalDocumentCard">
      <div className="MinimalDocumentCard-notebook">
        <div className="MinimalDocumentCard-notebookText">{doc.title}</div>
        <div className="MinimalDocumentCard-notebookDate">{t('common:created')}: { formatDate(doc.createdOn) }</div>
        <a className="MinimalDocumentCard-notebookLink" href={routes.getDocUrl({ id: doc._id, slug: doc.slug })}>
          {t('toDocument')}
          <div className="MinimalDocumentCard-notebookLinkArrow"><DoubleRightOutlined /></div>
        </a>
      </div>
    </div>
  );
}

MinimalDocumentCard.propTypes = {
  doc: documentMetadataShape.isRequired
};

export default MinimalDocumentCard;
