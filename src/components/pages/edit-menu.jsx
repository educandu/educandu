const React = require('react');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const Button = require('antd/lib/button');
const MenuTree = require('../menu-tree.jsx');
const PageHeader = require('../page-header.jsx');
const PageContent = require('../page-content.jsx');
const { inject } = require('../container-context.jsx');
const MenuApiClient = require('../../services/menu-api-client');
const { menuShape, docMetadataShape } = require('../../ui/default-prop-types');

const cloneDeep = obj => JSON.parse(JSON.stringify(obj));

class EditMenu extends React.Component {
  constructor(props) {
    super(props);

    autoBind.react(this);

    const { menuApiClient, initialState } = this.props;
    const { menu } = initialState;

    this.menuApiClient = menuApiClient;

    this.state = {
      ...this.mapMenuToState(menu)
    };
  }

  mapMenuToState(menu) {
    return {
      menuId: menu._id,
      menuTitle: cloneDeep(menu.title),
      menuSlug: menu.slug,
      menuDefaultDocumentKey: menu.defaultDocumentKey,
      menuNodes: cloneDeep(menu.nodes),
      isDirty: false
    };
  }

  mapStateToMenu() {
    const { menuId, menuTitle, menuSlug, menuDefaultDocumentKey, menuNodes } = this.state;
    return {
      _id: menuId,
      title: menuTitle,
      slug: menuSlug,
      defaultDocumentKey: menuDefaultDocumentKey,
      nodes: menuNodes
    };
  }

  async handleSaveClick() {
    const payload = this.mapStateToMenu();
    const { menu } = await this.menuApiClient.saveMenu(payload);
    this.setState({
      ...this.mapMenuToState(menu)
    });
  }

  handleMenuNodesChanged(nodes) {
    this.setState({
      menuNodes: nodes,
      isDirty: true
    });
  }

  handleSelectedMenuNodeChanged() {
  }

  render() {
    const { menuNodes, isDirty } = this.state;
    return (
      <Page>
        <PageHeader>
          {isDirty && <Button type="primary" icon="save" onClick={this.handleSaveClick}>Speichern</Button>}
        </PageHeader>
        <PageContent>
          <div>{JSON.stringify(menuNodes)}</div>

          <div style={{ display: 'flex' }}>
            <div style={{ flex: '1 0 0%' }}>
              <MenuTree
                nodes={menuNodes}
                onNodesChanged={this.handleMenuNodesChanged}
                onSelectedNodeChanged={this.handleSelectedMenuNodeChanged}
                />
            </div>
            <div style={{ flex: '1 0 0%' }}>
              Details View
            </div>
          </div>

        </PageContent>
      </Page>
    );
  }
}

EditMenu.propTypes = {
  initialState: PropTypes.shape({
    menu: menuShape.isRequired,
    docs: PropTypes.objectOf(docMetadataShape).isRequired
  }).isRequired,
  menuApiClient: PropTypes.instanceOf(MenuApiClient).isRequired
};

module.exports = inject({
  menuApiClient: MenuApiClient
}, EditMenu);
