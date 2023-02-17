import routes from '../utils/routes.js';
import React, { useState } from 'react';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import { Button, Collapse, Drawer } from 'antd';
import { useSettings } from './settings-context.js';
import { useService } from './container-context.js';
import MenuIcon from './icons/main-menu/menu-icon.js';
import CloseIcon from './icons/general/close-icon.js';
import UsersIcon from './icons/main-menu/users-icon.js';
import { getCurrentUrl } from '../ui/browser-helper.js';
import LogoutIcon from './icons/main-menu/logout-icon.js';
import { FormOutlined, GlobalOutlined } from '@ant-design/icons';
import { getCommonNavigationMenuItems } from './navigation-utils.js';
import LanguageDataProvider from '../localization/language-data-provider.js';

const { Panel } = Collapse;

function NavigationMobile() {
  const user = useUser();
  const settings = useSettings();
  const { t, i18n } = useTranslation('navigationMobile');
  const { supportedUiLanguages, uiLanguage } = useLocale();
  const languageDataProvider = useService(LanguageDataProvider);

  const helpPage = settings?.helpPage?.[uiLanguage];
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState(uiLanguage);

  const handleMenuClick = () => {
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleLanguageChange = languageCode => {
    i18n.changeLanguage(languageCode);
    setSelectedLanguageCode(languageCode);
  };

  const handleLogInClick = () => {
    window.location = routes.getLoginUrl(getCurrentUrl());
  };

  const handleRegisterClick = () => {
    window.location = routes.getRegisterUrl();
  };

  const handleLogOutClick = () => {
    window.location = routes.getLogoutUrl();
  };

  const renderDrawerTitle = () => {
    return (
      <div className="NavigationMobile-drawerTitle">
        <b>{user?.displayName || t('common:hello')}</b>
        <Button type="text" icon={<CloseIcon />} onClick={handleDrawerClose} />
      </div>
    );
  };

  const renderLanguageItem = () => {
    const languagesData = supportedUiLanguages.map(l => languageDataProvider.getLanguageData(l, l));

    return (
      <Collapse ghost expandIconPosition="end">
        <Panel header={<div className="NavigationMobile-drawerContentItem"><GlobalOutlined />{t('common:language')}</div>}>
          <div className="NavigationMobile-drawerContentItemChildren">
            {languagesData.map(languageData => (
              <Button
                type={selectedLanguageCode === languageData.code ? 'default' : 'link'}
                key={languageData.code}
                onClick={() => handleLanguageChange(languageData.code)}
                >
                {languageData.name}
              </Button>
            ))}
          </div>
        </Panel>
      </Collapse>
    );
  };

  const renderDrawerItems = () => {
    const items = getCommonNavigationMenuItems({ t, user, helpPage })
      .filter(item => item.showWhen)
      .map(({ key, label, icon }) => {
        return (
          <div key={key} className="NavigationMobile-drawerContentItem">
            {icon}{label}
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
        <div className="NavigationMobile-anonymousUserButtons">
          <Button type="primary" icon={<UsersIcon />} onClick={handleLogInClick}>{t('common:logIn')}</Button>
          <Button icon={<FormOutlined />} onClick={handleRegisterClick}>{t('common:register')}</Button>
        </div>
      );
    }

    return (
      <Button icon={<LogoutIcon />} onClick={handleLogOutClick}>{t('common:logOut')}</Button>
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
          {renderDrawerItems()}
          {renderDrawerFooter()}
        </div>
      </Drawer>
    </div>
  );
}

export default NavigationMobile;
