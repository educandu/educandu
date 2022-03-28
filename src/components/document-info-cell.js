import React from 'react';
import urls from '../utils/urls.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { documentMetadataShape } from '../ui/default-prop-types.js';

function DocumentInfoCell({ doc }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentInfoCell');

  return (
    <a className="DocumentInfoCell" href={urls.getDocUrl({ key: doc.key, slug: doc.slug })}>
      <div className="DocumentInfoCell-title">{doc.title}</div>
      {doc.description && <div className="DocumentInfoCell-description">{doc.description}</div>}
      <div className="DocumentInfoCell-dates">{t('createdOn')}: {formatDate(doc.createdOn)} | {t('updatedOn')}: {formatDate(doc.updatedOn)}</div>
    </a>
  );
}

DocumentInfoCell.propTypes = {
  doc: documentMetadataShape.isRequired
};

export default DocumentInfoCell;
