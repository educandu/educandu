import React from 'react';
import routes from '../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { documentExtendedMetadataShape } from '../ui/default-prop-types.js';

function DocumentInfoCell({ doc }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentInfoCell');

  const dates = [
    `${t('common:created')}: ${formatDate(doc.createdOn)}`,
    `${t('updatedOn')}: ${formatDate(doc.updatedOn)}`
  ];

  return (
    <div className="DocumentInfoCell" >
      <div className="DocumentInfoCell-infoContainer">
        <a
          href={routes.getDocUrl({ id: doc._id, slug: doc.slug })}
          className="DocumentInfoCell-infoContent"
          >
          <div>
            <div className="DocumentInfoCell-mainText">{doc.title}</div>
            {!!doc.description && <div className="DocumentInfoCell-description">{doc.description}</div>}
            <div className="DocumentInfoCell-subtext">{dates.join(' | ')}</div>
          </div>
        </a>
      </div>
    </div>
  );
}

DocumentInfoCell.propTypes = {
  doc: documentExtendedMetadataShape.isRequired
};

export default DocumentInfoCell;
