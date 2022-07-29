import React from 'react';
import { Modal } from 'antd';
import routes from '../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { DoubleRightOutlined } from '@ant-design/icons';
import { documentMetadataShape } from '../ui/default-prop-types.js';
import classNames from 'classnames';

function DocumentCard({ doc }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentCard');

  const isDeletedDocument = !doc;
  const docTitle = isDeletedDocument ? `[${t('common:deletedDocument')}]` : doc.title;
  const docUrl = isDeletedDocument ? '' : routes.getDocUrl({ id: doc._id, slug: doc.slug });

  const handleLinkClick = event => {
    if (isDeletedDocument) {
      event.preventDefault();
      Modal.error({
        title: t('common:error'),
        content: t('common:targetDeletedMessage')
      });
    }
  };

  return (
    <div className="DocumentCard">
      <div className="DocumentCard-notebook">
        <div className="DocumentCard-notebookText">{docTitle}</div>
        {!!doc?.createdOn && (
          <div className="DocumentCard-infoRow">
            <div>{t('common:created')}: </div>
            <div>{formatDate(doc.createdOn)}</div>
          </div>
        )}
        {!!doc?.updatedOn && (
          <div className="DocumentCard-infoRow">
            <div>{t('common:updated')}: </div>
            <div>{formatDate(doc.updatedOn)}</div>
          </div>
        )}
        <a
          href={docUrl}
          onClick={handleLinkClick}
          className={classNames('DocumentCard-notebookLink', { 'DocumentCard-notebookLink--deletedDocument': isDeletedDocument })}
          >
          {t('toDocument')}
          <div className="DocumentCard-notebookLinkArrow"><DoubleRightOutlined /></div>
        </a>
      </div>
    </div>
  );
}

DocumentCard.propTypes = {
  doc: documentMetadataShape
};

DocumentCard.defaultProps = {
  doc: null
};

export default DocumentCard;
