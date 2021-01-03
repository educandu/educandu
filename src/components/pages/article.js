import React from 'react';
import Page from '../page';
import PropTypes from 'prop-types';
import urls from '../../utils/urls';
import DocView from '../doc-view';
import ArticleCredits from '../article-credits';
import { EditOutlined } from '@ant-design/icons';
import permissions from '../../domain/permissions';
import { documentShape, documentRevisionShape } from '../../ui/default-prop-types';

const handleBackClick = () => window.history.back();

function Article({ initialState, language }) {
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
        text: 'Bearbeiten',
        type: 'primary'
      }
    ];
  }, [type, documentOrRevision.key]);

  return (
    <Page headerActions={headerActions}>
      {type === 'document' && (
        <aside className="Content">
          <a onClick={handleBackClick}>Zurück</a>
        </aside>
      )}
      <DocView documentOrRevision={documentOrRevision} language={language} />
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
  }).isRequired,
  language: PropTypes.string.isRequired
};

export default Article;
