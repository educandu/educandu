import { Button } from 'antd';
import urls from '../utils/urls';
import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeleteOutlined } from '@ant-design/icons';
import { documentMetadataShape } from '../ui/default-prop-types';

function MenuDocRef({ doc, docRefKey, onDelete }) {
  const { t } = useTranslation('menuDocRef');
  return (
    <div className="MenuDocRef">
      <div className="MenuDocRef-titleAndUrl">
        <div className="MenuDocRef-title">{doc.title}</div>
        <div className="MenuDocRef-url">{urls.getArticleUrl(doc.slug) || `(${t('slugUnassigned')})`}</div>
      </div>
      {onDelete && (
        <div className="MenuDocRef-deleteButton">
          <Button type="danger" size="small" icon={<DeleteOutlined />} ghost onClick={() => onDelete(docRefKey)} />
        </div>
      )}
    </div>
  );
}

MenuDocRef.propTypes = {
  doc: documentMetadataShape.isRequired,
  docRefKey: PropTypes.string.isRequired,
  onDelete: PropTypes.func
};

MenuDocRef.defaultProps = {
  onDelete: null
};

export default memo(MenuDocRef);
