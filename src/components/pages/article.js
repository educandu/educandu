import React from 'react';
import Page from '../page';
import PropTypes from 'prop-types';
import urls from '../../utils/urls';
import DocView from '../doc-view';
import ArticleCredits from '../article-credits';
import { EditOutlined } from '@ant-design/icons';
import permissions from '../../domain/permissions';
import { docShape, sectionShape } from '../../ui/default-prop-types';

const handleBackClick = () => window.history.back();

function Article({ initialState, language }) {
  const { doc, sections } = initialState;

  const headerActions = React.useMemo(() => [
    {
      handleClick: () => {
        window.location = urls.getEditDocUrl(doc.key);
      },
      icon: EditOutlined,
      key: 'edit',
      permission: permissions.EDIT_DOC,
      text: 'Bearbeiten',
      type: 'primary'
    }
  ], [doc.key]);

  return (
    <Page headerActions={headerActions}>
      <aside className="Content">
        <a onClick={handleBackClick}>Zurück</a>
      </aside>
      <DocView doc={doc} sections={sections} language={language} />
      <ArticleCredits doc={doc} />
    </Page>
  );
}

Article.propTypes = {
  initialState: PropTypes.shape({
    doc: docShape,
    sections: PropTypes.arrayOf(sectionShape)
  }).isRequired,
  language: PropTypes.string.isRequired
};

export default Article;
