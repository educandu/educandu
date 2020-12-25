const React = require('react');
const Page = require('../page');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const urls = require('../../utils/urls');
const Logger = require('../../common/logger');
const Restricted = require('../restricted');
const { Input, Modal, Button } = require('antd');
const errorHelper = require('../../ui/error-helper');
const { PlusOutlined } = require('@ant-design/icons');
const { inject } = require('../container-context');
const permissions = require('../../domain/permissions');
const { toTrimmedString } = require('../../utils/sanitize');
const { menuShape } = require('../../ui/default-prop-types');
const MenuApiClient = require('../../services/menu-api-client');

const logger = new Logger(__filename);

const DEFAULT_MENU_TITLE = 'Neues Menü';
const DEFAULT_MENU_SLUG = '';

class Menus extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
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

    try {
      this.setState({ isLoading: true });

      const { menu } = await menuApiClient.saveMenu(this.createNewMenu(newMenuTitle, newMenuSlug));

      this.setState({
        isNewMenuModalVisible: false,
        isLoading: false
      });

      window.location = urls.getEditMenuUrl(menu._id);
    } catch (error) {
      this.setState({ isLoading: false });
      errorHelper.handleApiError(error, logger);
    }
  }

  handleCancel() {
    this.setState({ isNewMenuModalVisible: false });
  }

  render() {
    const { initialState } = this.props;
    const { newMenuTitle, newMenuSlug, isNewMenuModalVisible, isLoading } = this.state;

    return (
      <Page>
        <div className="MenusPage">
          <h1>Menüs</h1>
          <ul>
            {initialState.map(menu => (
              <li key={menu._id}>
                <a href={urls.getEditMenuUrl(menu._id)}>{menu.title}</a>
              </li>
            ))}
          </ul>
          <aside>
            <Restricted to={permissions.EDIT_MENU}>
              <Button type="primary" shape="circle" icon={<PlusOutlined />} size="large" onClick={this.handleNewMenuClick} />
            </Restricted>
          </aside>
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
        </div>
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
