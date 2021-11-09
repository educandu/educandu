import React from 'react';
import Page from '../page.js';
import PropTypes from 'prop-types';
import DocView from '../doc-view.js';
import urls from '../../utils/urls.js';
import { useTranslation } from 'react-i18next';
import CreditsFooter from '../credits-footer.js';
import { EditOutlined } from '@ant-design/icons';
import permissions from '../../domain/permissions.js';
import { documentShape, documentRevisionShape } from '../../ui/default-prop-types.js';

const handleBackClick = () => window.history.back();

function Article({ initialState }) {
  const { t } = useTranslation();
  const { documentOrRevision, type } = initialState;

  const customAlerts = [];
  const headerActions = [];

  if (documentOrRevision.archived) {
    customAlerts.push({
      message: t('common:archivedAlert'),
      type: 'warning'
    });
  }

  if (!documentOrRevision.archived && type !== 'revision') {
    headerActions.push({
      handleClick: () => {
        window.location = urls.getEditDocUrl(documentOrRevision.key);
      },
      icon: EditOutlined,
      key: 'edit',
      permission: permissions.EDIT_DOC,
      text: t('common:edit'),
      type: 'primary'
    });
  }

  return (
    <Page headerActions={headerActions} customAlerts={customAlerts}>
      {type === 'document' && (
        <aside className="Content">
          <a onClick={handleBackClick}>{t('common:back')}</a>
        </aside>
      )}
      <DocView documentOrRevision={documentOrRevision} />
      <aside className="Content">
        <CreditsFooter documentOrRevision={documentOrRevision} type={type} />
      </aside>
    </Page>
  );
}

Article.propTypes = {
  initialState: PropTypes.shape({
    documentOrRevision: PropTypes.oneOfType([documentShape, documentRevisionShape]),
    type: PropTypes.oneOf(['document', 'revision'])
  }).isRequired
};

export default Article;
