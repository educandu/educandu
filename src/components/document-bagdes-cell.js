import React from 'react';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { InboxOutlined, KeyOutlined, SafetyCertificateOutlined, TeamOutlined } from '@ant-design/icons';

function DocumentBadgesCell({ publicContext }) {
  const { t } = useTranslation('documentBadgesCell');

  return (
    <div className="DocumentBadgesCell">
      {!!publicContext.archived && (
        <Tooltip title={t('archivedDocumentBadge')}>
          <InboxOutlined className="u-large-badge" />
        </Tooltip>
      )}
      {!!publicContext.verified && (
        <Tooltip title={t('common:verifiedDocumentBadge')}>
          <SafetyCertificateOutlined className="u-large-badge" />
        </Tooltip>
      )}
      {!!publicContext.protected && (
        <Tooltip title={t('protectedDocumentBadge')}>
          <KeyOutlined className="u-large-badge" />
        </Tooltip>
      )}
      {!!publicContext.allowedEditors.length && (
        <Tooltip title={t('allowedEditorsBadge')}>
          <TeamOutlined className="u-large-badge" />
        </Tooltip>
      )}
    </div>
  );
}

DocumentBadgesCell.propTypes = {
  publicContext: PropTypes.shape({
    archived: PropTypes.bool.isRequired,
    verified: PropTypes.bool.isRequired,
    protected: PropTypes.bool.isRequired,
    allowedEditors: PropTypes.array.isRequired
  }).isRequired
};

export default DocumentBadgesCell;
