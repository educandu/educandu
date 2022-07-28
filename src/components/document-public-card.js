import React from 'react';
import routes from '../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { DoubleRightOutlined } from '@ant-design/icons';
import { documentMetadataShape } from '../ui/default-prop-types.js';

function DocumentPublicCard({ doc }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentPublicCard');

  return (
    <div className="DocumentPublicCard">
      <div className="DocumentPublicCard-notebook">
        <div className="DocumentPublicCard-notebookText">{doc.title}</div>
        <div className="DocumentPublicCard-notebookDate">{t('common:created')}: { formatDate(doc.createdOn) }</div>
        <a className="DocumentPublicCard-notebookLink" href={routes.getDocUrl({ id: doc._id, slug: doc.slug })}>
          {t('toDocument')}
          <div className="DocumentPublicCard-notebookLinkArrow"><DoubleRightOutlined /></div>
        </a>
      </div>
    </div>
  );
}

DocumentPublicCard.propTypes = {
  doc: documentMetadataShape.isRequired
};

export default DocumentPublicCard;
