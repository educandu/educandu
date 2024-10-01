import classNames from 'classnames';
import routes from '../utils/routes.js';
import SearchBar from './search-bar.js';
import React, { useState } from 'react';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import { Button, Collapse, Drawer } from 'antd';
import { useGetCurrentUrl } from '../ui/hooks.js';
import { useSettings } from './settings-context.js';
import { useService } from './container-context.js';
import MenuIcon from './icons/main-menu/menu-icon.js';
import LanguageIcon from './icons/main-menu/language-icon.js';
import { useNotificationsCount } from './notification-context.js';
import { getCommonNavigationMenuItems } from './navigation-utils.js';
import { CloseOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import LanguageDataProvider from '../localization/language-data-provider.js';

function NavigationMobile() {
  const user = useUser();
  const settings = useSettings();
  const getCurrentUrl = useGetCurrentUrl();
  const notificationsCount = useNotificationsCount();
  const { t, i18n } = useTranslation('navigationMobile');
  const { supportedUiLanguages, uiLanguage } = useLocale();
  const languageDataProvider = useService(LanguageDataProvider);

  const helpPage = settings?.helpPage?.[uiLanguage];
  const documentCategoriesPage = settings?.documentCategoriesPage?.[uiLanguage];

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLanguageMenuExpanded, setIsLanguageMenuExpanded] = useState(false);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState(uiLanguage);

  const handleMenuClick = () => {
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleLogInClick = () => {
    window.location = routes.getLoginUrl({ currentUrl: getCurrentUrl() });
  };

  const handleLogOutClick = () => {
    window.location = routes.getLogoutUrl();
  };

  const handleLanguageCollapseChange = activeKeys => {
    setIsLanguageMenuExpanded(!!activeKeys.length);
  };

  const handleLanguageChange = languageCode => {
    i18n.changeLanguage(languageCode);
    setSelectedLanguageCode(languageCode);
  };

  const handleSearch = searchText => {
    window.location = routes.getSearchUrl({ query: searchText });
  };

  const renderDrawerTitle = () => {
    return (
      <div className="NavigationMobile-drawerTitle">
        <b>{user?.displayName || t('common:hello')}</b>
        <Button type="text" icon={<CloseOutlined />} onClick={handleDrawerClose} />
      </div>
    );
  };

  const renderLanguageItem = () => {
    const languagesData = supportedUiLanguages.map(l => languageDataProvider.getLanguageData(l, l));
    const renderExpandIcon = () => isLanguageMenuExpanded ? <UpOutlined /> : <DownOutlined />;

    return (
      <Collapse
        ghost
        expandIconPosition="end"
        expandIcon={renderExpandIcon}
        onChange={handleLanguageCollapseChange}
        className="NavigationMobile-drawerLanguageItem"
        items={[{
          key: 'language-panel',
          label: (
            <div className="NavigationMobile-drawerContentItem">
              <LanguageIcon />{t('common:language')}
            </div>
          ),
          children: (
            <div className="NavigationMobile-drawerContentItemChildren">
              {languagesData.map(languageData => (
                <div
                  key={languageData.code}
                  className={classNames('NavigationMobile-languageMenuItem', { 'is-selected': languageData.code === selectedLanguageCode })}
                  onClick={() => handleLanguageChange(languageData.code)}
                  >
                  {languageData.name}
                </div>
              ))}
            </div>
          )
        }]}
        />
    );
  };

  const renderDrawerItems = () => {
    const items = getCommonNavigationMenuItems({ t, user, notificationsCount, helpPage, documentCategoriesPage })
      .filter(item => item.showWhen)
      .map(({ key, label, icon, badge, onClick }) => {
        return (
          <div key={key} onClick={onClick} className="NavigationMobile-drawerContentItem">
            {icon}{label}{badge}
          </div>
        );
      });

    return (
      <div className="NavigationMobile-drawerContentItems">
        {items}
        {renderLanguageItem()}
      </div>
    );
  };

  const renderDrawerFooter = () => {
    if (!user) {
      return (
        <Button size="large" type="primary" onClick={handleLogInClick}>{t('common:logIn')}</Button>
      );
    }

    return (
      <Button size="large" onClick={handleLogOutClick}>{t('common:logOut')}</Button>
    );
  };

  return (
    <div className="NavigationMobile">
      <Button type="link" icon={<MenuIcon />} onClick={handleMenuClick} />
      <Drawer
        placement="right"
        closable={false}
        open={isDrawerOpen}
        title={renderDrawerTitle()}
        onClose={handleDrawerClose}
        >
        <div className="NavigationMobile-drawerContent">
          <div>
            <div className="NavigationMobile-drawerContentSearch">
              <SearchBar onSearch={handleSearch} autoFocus />
            </div>
            {renderDrawerItems()}
          </div>
          {renderDrawerFooter()}
        </div>
      </Drawer>
    </div>
  );
}

export default NavigationMobile;
