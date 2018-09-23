const React = require('react');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const Input = require('antd/lib/input');
const Modal = require('antd/lib/modal');
const urls = require('../../utils/urls');
const Button = require('antd/lib/button');
const Restricted = require('../restricted.jsx');
const PageHeader = require('../page-header.jsx');
const PageContent = require('../page-content.jsx');
const { inject } = require('../container-context.jsx');
const permissions = require('../../domain/permissions');
const { toTrimmedString } = require('../../utils/sanitize');
const { menuShape } = require('../../ui/default-prop-types');
const MenuApiClient = require('../../services/menu-api-client');

const DEFAULT_MENU_TITLE = 'Neues Menü';
const DEFAULT_MENU_SLUG = '';

class Menus extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = {
      newMenuTitle: DEFAULT_MENU_TITLE,
      newMenuSlug: DEFAULT_MENU_SLUG,
      isNewMenuModalVisible: false,
      isLoading: false
    };
  }

  createNewMenu(title, slug) {
    return {
      title: toTrimmedString(title) || DEFAULT_MENU_TITLE,
      slug: toTrimmedString(slug) || null,
      defaultDocumentKey: null,
      nodes: []
    };
  }

  handleNewMenuClick() {
    this.setState({
      newMenuTitle: DEFAULT_MENU_TITLE,
      newMenuSlug: DEFAULT_MENU_SLUG,
      isNewMenuModalVisible: true
    });
  }

  handleNewMenuTitleChange(event) {
    this.setState({ newMenuTitle: event.target.value });
  }

  handleNewMenuSlugChange(event) {
    this.setState({ newMenuSlug: event.target.value });
  }

  async handleOk() {
    const { newMenuTitle, newMenuSlug } = this.state;
    const { menuApiClient } = this.props;

    this.setState({ isLoading: true });

    const { menu } = await menuApiClient.saveMenu(this.createNewMenu(newMenuTitle, newMenuSlug));

    this.setState({
      isNewMenuModalVisible: false,
      isLoading: false
    });

    window.location = urls.getEditMenuUrl(menu._id);
  }

  handleCancel() {
    this.setState({ isNewMenuModalVisible: false });
  }

  render() {
    const { initialState } = this.props;
    const { newMenuTitle, newMenuSlug, isNewMenuModalVisible, isLoading } = this.state;
    return (
      <Page>
        <PageHeader>
          <Restricted to={permissions.EDIT_MENU}>
            <Button type="primary" icon="plus" onClick={this.handleNewMenuClick}>Neues Menü</Button>
          </Restricted>
        </PageHeader>
        <PageContent>
          <h1>Menüs</h1>
          <ul>
            {initialState.map(menu => (
              <li key={menu._id}>
                <a href={urls.getEditMenuUrl(menu._id)}>{menu.title}</a>
              </li>
            ))}
          </ul>
          <Modal
            title="Neues Menü"
            visible={isNewMenuModalVisible}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            >
            <p>Titel</p>
            <p><Input value={newMenuTitle} onChange={this.handleNewMenuTitleChange} /></p>
            <p>URL-Pfad</p>
            <p><Input addonBefore={urls.menusPrefix} value={newMenuSlug} onChange={this.handleNewMenuSlugChange} /></p>
            {isLoading && <p>Wird erstellt ...</p>}
          </Modal>
        </PageContent>
      </Page>
    );
  }
}

Menus.propTypes = {
  initialState: PropTypes.arrayOf(menuShape).isRequired,
  menuApiClient: PropTypes.instanceOf(MenuApiClient).isRequired
};

module.exports = inject({
  menuApiClient: MenuApiClient
}, Menus);
