import React from 'react';
import urls from '../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { documentMetadataShape, roomMinimalMetadataShape } from '../ui/default-prop-types.js';

function DocumentInfoCell({ doc, room }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentInfoCell');
  const dates = [
    `${t('common:created')}: ${formatDate(doc.createdOn)}`,
    `${t('updatedOn')}: ${formatDate(doc.updatedOn)}`
  ];

  return (
    <a className="InfoCell" href={urls.getDocUrl({ id: doc._id, slug: doc.slug })}>
      {room?.name}
      <div className="InfoCell-mainText">{doc.title}</div>
      {doc.description && <div className="InfoCell-description">{doc.description}</div>}
      <div className="InfoCell-subtext">{dates.join(' | ')}</div>
    </a>
  );
}

DocumentInfoCell.propTypes = {
  doc: documentMetadataShape.isRequired,
  room: roomMinimalMetadataShape
};

DocumentInfoCell.defaultProps = {
  room: null
};

export default DocumentInfoCell;
