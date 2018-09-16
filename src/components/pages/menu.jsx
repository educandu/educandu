const React = require('react');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const urls = require('../../utils/urls');
const Button = require('antd/lib/button');
const PageHeader = require('../page-header.jsx');
const PageContent = require('../page-content.jsx');
const { withUser } = require('../user-context.jsx');
const MenuCategoryItem = require('../menu-category-item.jsx');
const { menuShape, docMetadataShape, userProps } = require('../../ui/default-prop-types');

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

  renderCategoryList(nodes, level, activeNode) {
    return (
      <ul className="MenuPage-categoryList">
        {nodes.map(node => (
          <li key={node.key}>
            <div>
              <MenuCategoryItem node={node} isActive={node === activeNode} onNodeClick={this.handleNodeClick} />
            </div>
            {!!node.children.length && this.renderCategoryList(node.children, level + 1, activeNode)}
          </li>
        ))}
      </ul>
    );
  }

  renderDoc(doc) {
    return <div>Document: {JSON.stringify(doc)}</div>;
  }

  renderLinkList(documents) {
    return <div>Liste: {JSON.stringify(documents)}</div>;
  }

  render() {
    const { user, initialState } = this.props;
    const { currentActiveNode, documentDictionary } = this.state;
    const { menu } = initialState;

    const article = currentActiveNode && currentActiveNode.documentKeys.length
      ? this.renderLinkList(currentActiveNode.documentKeys.map(key => documentDictionary.get(key)))
      : this.renderDoc(documentDictionary.get(menu.defaultDocumentKey));

    return (
      <Page>
        <PageHeader>
          {user && <Button type="primary" icon="edit" onClick={this.handleEditMenuClick}>Bearbeiten</Button>}
        </PageHeader>
        <PageContent>
          <div className="MenuPage">
            <aside className="MenuPage-categories">
              <h2>Inhalt</h2>
              {this.renderCategoryList(menu.nodes, 0, currentActiveNode)}
            </aside>
            <article className="MenuPage-details">
              {article}
            </article>
          </div>
          <pre>{JSON.stringify(menu, null, 2)}</pre>
        </PageContent>
      </Page>
    );
  }
}

Menu.propTypes = {
  ...userProps,
  initialState: PropTypes.shape({
    docs: PropTypes.arrayOf(docMetadataShape.isRequired).isRequired,
    menu: menuShape.isRequired
  }).isRequired
};

module.exports = withUser(Menu);
