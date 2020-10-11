const React = require('react');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const urls = require('../../utils/urls');
const classnames = require('classnames');
const DocView = require('../doc-view.jsx');
const permissions = require('../../domain/permissions');
const MenuCategoryItem = require('../menu-category-item.jsx');
const { menuShape, docMetadataShape, docShape, sectionShape } = require('../../ui/default-prop-types');

const UNKNOWN_DOC_TITLE = 'Unbekanntes Dokument';

class Menu extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);

    const { initialState } = this.props;

    this.state = {
      currentActiveNode: null,
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

  handleNodeClick(node) {
    this.setState({ currentActiveNode: node });
  }

  handleMenuTitleClick() {
    this.setState({ currentActiveNode: null });
  }

  renderCategoryList(nodes, level, activeNode) {
    return (
      <ul className="MenuPage-categoryList">
        {nodes.map(node => (
          <li key={node.key}>
            <div className={classnames(['MenuPage-categoryListItem', `u-level-${level}`])}>
              <MenuCategoryItem
                node={node}
                isActive={node === activeNode}
                onNodeClick={this.handleNodeClick}
                />
            </div>
            {!!node.children.length && this.renderCategoryList(node.children, level + 1, activeNode)}
          </li>
        ))}
      </ul>
    );
  }

  renderLinkListItemContent(doc = { title: UNKNOWN_DOC_TITLE }) {
    return doc.slug
      ? <a href={urls.getArticleUrl(doc.slug)}>{doc.title}</a>
      : <span>{doc.title}</span>;
  }

  renderLinkList(node, documentDictionary, isActive) {
    const docs = node.documentKeys.map(key => documentDictionary.get(key));
    const classNames = classnames('MenuPage-detailsItem', { 'MenuPage-detailsItem--active': isActive });
    return (
      <div key={node.key} className={classNames}>
        <h2 className="MenuPage-linkListTitle">{node.title}</h2>
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
      </div>
    );
  }

  renderLinkLists(nodes, currentActiveNode, documentDictionary) {
    return nodes.flatMap(node => {
      const linkLists = [this.renderLinkList(node, documentDictionary, node === currentActiveNode)];
      return node.children && node.children.length
        ? linkLists.concat(this.renderLinkLists(node.children, currentActiveNode, documentDictionary))
        : linkLists;
    });
  }

  renderDefaultDoc(defaultDocument, language, isActive) {
    const classNames = classnames('MenuPage-detailsItem', { 'MenuPage-detailsItem--active': isActive });
    return (
      <div className={classNames}>
        <DocView doc={defaultDocument.doc} sections={defaultDocument.sections} language={language} />
      </div>
    );
  }

  render() {
    const { initialState, language } = this.props;
    const { currentActiveNode, documentDictionary } = this.state;
    const { menu, defaultDocument } = initialState;

    const hasCategories = menu.nodes && menu.nodes.length;

    const defaultDoc = defaultDocument ? this.renderDefaultDoc(defaultDocument, language, !currentActiveNode) : null;
    const linkLists = this.renderLinkLists(menu.nodes, currentActiveNode, documentDictionary);

    const titleMarkup = <h2><a onClick={this.handleMenuTitleClick}>{menu.title}</a></h2>;

    const categoryPanel = hasCategories ? (
      <aside className="MenuPage-categories">
        {menu.title && titleMarkup}
        {this.renderCategoryList(menu.nodes, 0, currentActiveNode)}
      </aside>
    ) : null;

    const detailsPanel = (
      <article className="MenuPage-details">
        {menu.title && !hasCategories && titleMarkup}
        {defaultDoc}
        {linkLists}
      </article>
    );

    const headerActions = [
      {
        key: 'edit',
        type: 'primary',
        icon: 'edit',
        text: 'Bearbeiten',
        permission: permissions.EDIT_MENU,
        handleClick: this.handleEditMenuClick
      }
    ];

    return (
      <Page headerActions={headerActions}>
        <div className="MenuPage">
          {categoryPanel}
          {detailsPanel}
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
