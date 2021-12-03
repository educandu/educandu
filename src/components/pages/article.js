import React from 'react';
import PropTypes from 'prop-types';
import DocView from '../doc-view.js';
import urls from '../../utils/urls.js';
import { useTranslation } from 'react-i18next';
import CreditsFooter from '../credits-footer.js';
import { EditOutlined } from '@ant-design/icons';
import permissions from '../../domain/permissions.js';
import { PAGE_NAME } from '../../domain/page-name.js';
import { ALERT_TYPE } from '../../common/constants.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import { documentShape, documentRevisionShape } from '../../ui/default-prop-types.js';

const handleBackClick = () => window.history.back();

function Article({ initialState, PageTemplate }) {
  const { t } = useTranslation();
  const { documentOrRevision, type } = initialState;

  const alerts = useGlobalAlerts(PAGE_NAME.articles);
  if (documentOrRevision.archived) {
    alerts.push({
      message: t('common:archivedAlert'),
      type: ALERT_TYPE.warning
    });
  }

  const headerActions = [];
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
    <PageTemplate headerActions={headerActions} alerts={alerts}>
      {type === 'document' && (
        <aside className="Content">
          <a onClick={handleBackClick}>{t('common:back')}</a>
        </aside>
      )}
      <DocView documentOrRevision={documentOrRevision} />
      <aside className="Content">
        <CreditsFooter documentOrRevision={documentOrRevision} type={type} />
      </aside>
    </PageTemplate>
  );
}

Article.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    documentOrRevision: PropTypes.oneOfType([documentShape, documentRevisionShape]),
    type: PropTypes.oneOf(['document', 'revision'])
  }).isRequired
};

export default Article;
