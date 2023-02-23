import gravatar from 'gravatar';
import classNames from 'classnames';
import { Avatar, Dropdown } from 'antd';
import routes from '../utils/routes.js';
import SearchBar from './search-bar.js';
import React, { useState } from 'react';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import { useSettings } from './settings-context.js';
import { useService } from './container-context.js';
import { getCurrentUrl } from '../ui/browser-helper.js';
import LogoutIcon from './icons/main-menu/logout-icon.js';
import { getCommonNavigationMenuItems } from './navigation-utils.js';
import { DownOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons';
import LanguageDataProvider from '../localization/language-data-provider.js';

function NavigationDesktop() {
  const user = useUser();
  const settings = useSettings();
  const { t, i18n } = useTranslation('navigationDesktop');
  const { supportedUiLanguages, uiLanguage } = useLocale();
  const languageDataProvider = useService(LanguageDataProvider);

  const helpPage = settings?.helpPage?.[uiLanguage];
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [isSearchBarActive, setIsSearchBarActive] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState(uiLanguage);

  const handleLanguageMenuClick = ({ key }) => {
    i18n.changeLanguage(key);
    setSelectedLanguageCode(key);
    setIsLanguageMenuOpen(false);
  };

  const handleLanguageMenuOpenChange = value => {
    setIsLanguageMenuOpen(value);
  };

  const handleMainMenuOpenChange = value => {
    setIsMainMenuOpen(value);
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

  const handleSearchClick = () => {
    setIsSearchBarActive(true);
  };

  const handleSearchBarBlur = () => {
    setIsSearchBarActive(false);
  };

  const handleSearch = searchText => {
    window.location = routes.getSearchUrl(searchText.trim());
  };

  const renderLanguageMenu = () => {
    const items = supportedUiLanguages.map(languageCode => {
      const languageData = languageDataProvider.getLanguageData(languageCode, languageCode);

      return {
        key: languageCode,
        label: `${languageCode.toUpperCase()} - ${languageData.name}`
      };
    });

    return (
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{ items, onClick: handleLanguageMenuClick }}
        onOpenChange={handleLanguageMenuOpenChange}
        >
        <div className="NavigationDesktop-menuButton">
          {selectedLanguageCode.toUpperCase()}
          <div className="NavigationDesktop-menuChevron">
            {isLanguageMenuOpen ? <UpOutlined /> : <DownOutlined />}
          </div>
        </div>
      </Dropdown>
    );
  };

  const renderMainMenu = () => {
    const gravatarUrl = gravatar.url(user.email, { d: 'mp' });

    const actionableMenuitems = [
      ...getCommonNavigationMenuItems({ t, user, helpPage }).filter(item => item.showWhen),
      {
        key: 'logout',
        label: t('common:logOut'),
        icon: <LogoutIcon />,
        onClick: handleLogOutClick
      }
    ];

    const handleMainMenuClick = ({ key }) => {
      actionableMenuitems.find(item => item.key === key).onClick();
      setIsMainMenuOpen(false);
    };

    const items = actionableMenuitems.map(({ key, label, icon }) => ({ key, label, icon }));

    return (
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{ items, onClick: handleMainMenuClick }}
        onOpenChange={handleMainMenuOpenChange}
        >
        <div className="NavigationDesktop-menuButton">
          <Avatar
            size="large"
            shape="circle"
            src={gravatarUrl}
            alt={user.displayName}
            className="u-avatar"
            />
          <div>{user.displayName}</div>
          <div className="NavigationDesktop-menuChevron">
            {isMainMenuOpen ? <UpOutlined /> : <DownOutlined />}
          </div>
        </div>
      </Dropdown>
    );
  };

  const renderAnonymousUserComponent = () => (
    <div className="NavigationDesktop-anonymousUser">
      <a className="NavigationDesktop-anonymousUserLink" onClick={handleLogInClick}>{t('common:logIn')}</a>
      <span>/</span>
      <a className="NavigationDesktop-anonymousUserLink" onClick={handleRegisterClick}>{t('common:register')}</a>
    </div>
  );

  return (
    <div className="NavigationDesktop">
      <div className={classNames('NavigationDesktop-searchBar', { 'is-active': isSearchBarActive })} onClick={handleSearchClick}>
        <SearchBar onSearch={handleSearch} size="medium" onBlur={handleSearchBarBlur} />
        <div className="NavigationDesktop-searchBarMask"><SearchOutlined /></div>
      </div>
      <div className="NavigationDesktop-menu">
        {renderLanguageMenu()}
        {user ? renderMainMenu() : renderAnonymousUserComponent()}
      </div>
    </div>
  );
}

export default NavigationDesktop;
