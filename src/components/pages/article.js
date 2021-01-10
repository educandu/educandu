import React from 'react';
import Page from '../page';
import DocView from '../doc-view';
import PropTypes from 'prop-types';
import urls from '../../utils/urls';
import { useTranslation } from 'react-i18next';
import ArticleCredits from '../article-credits';
import { EditOutlined } from '@ant-design/icons';
import permissions from '../../domain/permissions';
import { documentShape, documentRevisionShape } from '../../ui/default-prop-types';

const handleBackClick = () => window.history.back();

function Article({ initialState }) {
  const { t } = useTranslation();
  const { documentOrRevision, type } = initialState;

  const headerActions = React.useMemo(() => {
    if (type === 'revision') {
      return [];
    }

    return [
      {
        handleClick: () => {
          window.location = urls.getEditDocUrl(documentOrRevision.key);
        },
        icon: EditOutlined,
        key: 'edit',
        permission: permissions.EDIT_DOC,
        text: t('common:edit'),
        type: 'primary'
      }
    ];
  }, [t, type, documentOrRevision.key]);

  return (
    <Page headerActions={headerActions}>
      {type === 'document' && (
        <aside className="Content">
          <a onClick={handleBackClick}>{t('common:back')}</a>
        </aside>
      )}
      <DocView documentOrRevision={documentOrRevision} />
      {type === 'document' && (
        <aside className="Content">
          <ArticleCredits doc={documentOrRevision} />
        </aside>
      )}
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
