import React from 'react';
import urls from '../utils/urls.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { documentMetadataShape } from '../ui/default-prop-types.js';

function DocumentInfoCell({ doc }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentInfoCell');
  const dates = [
    `${t('common:created')}: ${formatDate(doc.createdOn)}`,
    `${t('updatedOn')}: ${formatDate(doc.updatedOn)}`
  ];

  return (
    <a className="InfoCell" href={urls.getDocUrl({ key: doc.key, slug: doc.slug })}>
      <div className="InfoCell-mainText">{doc.title}</div>
      {doc.description && <div className="InfoCell-description">{doc.description}</div>}
      <div className="InfoCell-subtext">{dates.join(' | ')}</div>
    </a>
  );
}

DocumentInfoCell.propTypes = {
  doc: documentMetadataShape.isRequired
};

export default DocumentInfoCell;
