import React from 'react';
import Page from '../page';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import urls from '../../utils/urls';
import Restricted from '../restricted';
import Logger from '../../common/logger';
import { Input, Modal, Button } from 'antd';
import { inject } from '../container-context';
import errorHelper from '../../ui/error-helper';
import { withTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import permissions from '../../domain/permissions';
import { toTrimmedString } from '../../utils/sanitize';
import MenuApiClient from '../../services/menu-api-client';
import { menuShape, translationProps } from '../../ui/default-prop-types';

const logger = new Logger(__filename);

const DEFAULT_MENU_SLUG = '';

class Menus extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.state = {
      newMenuTitle: this.props.t('defaultMenuTitle'),
      newMenuSlug: DEFAULT_MENU_SLUG,
      isNewMenuModalVisible: false,
      isLoading: false
    };
  }

  createNewMenu(title, slug) {
    const { t } = this.props;
    return {
      title: toTrimmedString(title) || t('defaultMenuTitle'),
      slug: toTrimmedString(slug) || null,
      defaultDocumentKey: null,
      nodes: []
    };
  }

  handleNewMenuClick() {
    const { t } = this.props;
    this.setState({
      newMenuTitle: t('defaultMenuTitle'),
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
    const { initialState, t } = this.props;
    const { newMenuTitle, newMenuSlug, isNewMenuModalVisible, isLoading } = this.state;

    return (
      <Page>
        <div className="MenusPage">
          <h1>{t('pageNames:menus')}</h1>
          <ul>
            {initialState.map(menu => (
              <li key={menu._id}>
                <a href={urls.getEditMenuUrl(menu._id)}>{menu.title}</a>
              </li>
            ))}
          </ul>
          <aside>
            <Restricted to={permissions.EDIT_MENU}>
              <Button type="primary" shape="circle" icon={<PlusOutlined />} size="large" onClick={this.handleNewMenuClick} disabled />
            </Restricted>
          </aside>
          <Modal
            title={t('newMenu')}
            visible={isNewMenuModalVisible}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            >
            <p>{t('title')}</p>
            <p><Input value={newMenuTitle} onChange={this.handleNewMenuTitleChange} /></p>
            <p>{t('slug')}</p>
            <p><Input addonBefore={urls.menusPrefix} value={newMenuSlug} onChange={this.handleNewMenuSlugChange} /></p>
            {isLoading && <p>{t('newMenuProgress')}</p>}
          </Modal>
        </div>
      </Page>
    );
  }
}

Menus.propTypes = {
  ...translationProps,
  initialState: PropTypes.arrayOf(menuShape).isRequired,
  menuApiClient: PropTypes.instanceOf(MenuApiClient).isRequired
};

export default withTranslation('menus')(inject({
  menuApiClient: MenuApiClient
}, Menus));
