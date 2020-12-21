const React = require('react');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const urls = require('../../utils/urls');
const classnames = require('classnames');
const DocView = require('../doc-view.jsx');
const { EditOutlined } = require('@ant-design/icons');
const permissions = require('../../domain/permissions');
const { menuShape, docMetadataShape, docShape, sectionShape } = require('../../ui/default-prop-types');

const UNKNOWN_DOC_TITLE = 'Unbekanntes Dokument';

class Menu extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);

    const { initialState } = this.props;

    this.state = {
      documentDictionary: initialState.docs.reduce((map, doc) => {
        map.set(doc.key, doc);
        return map;
      }, new Map())
    };
  }

  handleEditMenuClick() {
    const { initialState } = this.props;
    const menuEditUrl = urls.getEditMenuUrl(initialState.menu._id);
    window.location = menuEditUrl;
  }

  renderDefaultDoc(defaultDocument, language) {
    return (
      <div className="MenuPage-detailsItem">
        <DocView doc={defaultDocument.doc} sections={defaultDocument.sections} language={language} />
      </div>
    );
  }

  hasNodeAnyDocuments(node) {
    if (node.documentKeys.length) {
      return true;
    }

    if (node.children.length) {
      return node.children.some(child => this.hasNodeAnyDocuments(child));
    }

    return false;
  }

  renderMenuItemList(nodes, level, documentDictionary) {
    return (
      <ul className="MenuPage-categoryList">
        {nodes.filter(node => this.hasNodeAnyDocuments(node)).map(node => (
          <li key={node.key}>
            <div className={classnames(['MenuPage-categoryListItem', `u-level-${level}`])}>
              {this.renderLinkList(node, level, documentDictionary)}
            </div>
            {!!node.children.length && this.renderMenuItemList(node.children, level + 1, documentDictionary)}
          </li>
        ))}
      </ul>
    );
  }

  renderLinkList(node, level, documentDictionary) {
    const docs = node.documentKeys.map(key => documentDictionary.get(key));
    return (
      <div key={node.key} className={classnames(['MenuPage-detailsItem', `u-level-${level}`])}>
        <h3 className={classnames(['MenuPage-linkListTitle', `u-level-${level}`])}>{node.title}</h3>
        {!!docs.length && (
          <ul className="MenuPage-linkList">
            {docs.map(doc => {
              return (
                <li
                  key={doc.key}
                  className="MenuPage-linkListItem"
                  >
                  {this.renderLinkListItemContent(doc)}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  renderLinkListItemContent(doc = { title: UNKNOWN_DOC_TITLE }) {
    return doc.slug
      ? <a href={urls.getArticleUrl(doc.slug)}>{doc.title}</a>
      : <span>{doc.title}</span>;
  }

  render() {
    const { initialState, language } = this.props;
    const { currentActiveNode, documentDictionary } = this.state;
    const { menu, defaultDocument } = initialState;

    const headerActions = [
      {
        key: 'edit',
        type: 'primary',
        icon: EditOutlined,
        text: 'Bearbeiten',
        permission: permissions.EDIT_MENU,
        handleClick: this.handleEditMenuClick
      }
    ];

    return (
      <Page headerActions={headerActions}>
        <div className="MenuPage">
          <h2>{menu.title}</h2>
          {defaultDocument ? this.renderDefaultDoc(defaultDocument, language, !currentActiveNode) : null}
          {this.renderMenuItemList(menu.nodes, 0, documentDictionary)}
        </div>
      </Page>
    );
  }
}

Menu.propTypes = {
  initialState: PropTypes.shape({
    docs: PropTypes.arrayOf(docMetadataShape).isRequired,
    menu: menuShape.isRequired,
    defaultDocument: PropTypes.shape({
      doc: docShape,
      sections: PropTypes.arrayOf(sectionShape).isRequired
    })
  }).isRequired,
  language: PropTypes.string.isRequired
};

module.exports = Menu;
