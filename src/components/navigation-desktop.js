import gravatar from 'gravatar';
import classNames from 'classnames';
import routes from '../utils/routes.js';
import SearchBar from './search-bar.js';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import React, { useEffect, useState } from 'react';
import { useService } from './container-context.js';
import { useSettings } from './settings-context.js';
import { useScrollTopOffset } from '../ui/hooks.js';
import { getCurrentUrl } from '../ui/browser-helper.js';
import { Avatar, Badge, Dropdown, Tooltip } from 'antd';
import LogoutIcon from './icons/main-menu/logout-icon.js';
import { useNotificationsCount } from './notification-context.js';
import { getCommonNavigationMenuItems } from './navigation-utils.js';
import LanguageDataProvider from '../localization/language-data-provider.js';
import { BellOutlined, DownOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons';

function NavigationDesktop() {
  const user = useUser();
  const settings = useSettings();
  const topOffset = useScrollTopOffset();
  const { t, i18n } = useTranslation('navigationDesktop');
  const { supportedUiLanguages, uiLanguage } = useLocale();
  const languageDataProvider = useService(LanguageDataProvider);

  const helpPage = settings?.helpPage?.[uiLanguage];
  const notificationsCount = useNotificationsCount();
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [isSearchBarActive, setIsSearchBarActive] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [previousTopOffset, setPreviousTopOffset] = useState(topOffset);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState(uiLanguage);

  useEffect(() => {
    if (previousTopOffset === topOffset) {
      return;
    }

    setPreviousTopOffset(topOffset);

    if (isLanguageMenuOpen) {
      setIsLanguageMenuOpen(false);
    }

    if (isMainMenuOpen) {
      setIsMainMenuOpen(false);
    }
  }, [isLanguageMenuOpen, isMainMenuOpen, topOffset, previousTopOffset]);

  const handleLanguageMenuClick = ({ key }) => {
    i18n.changeLanguage(key);
    setSelectedLanguageCode(key);
    setIsLanguageMenuOpen(false);
  };

  const handleLanguageMenuOpenChange = value => {
    setIsLanguageMenuOpen(value);
  };

  const handleLanguageMenuBlur = () => {
    setIsLanguageMenuOpen(false);
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

  const renderNotificationsIndicator = () => (
    <div className="NavigationDesktop-menuNotificationsIndicator">
      <Tooltip title={t('common:notificationsTooltip', { count: notificationsCount })}>
        <a href={routes.getDashboardUrl({ tab: 'notifications' })}>
          <Badge
            dot
            title=""
            offset={[-2, 2]}
            count={notificationsCount}
            >
            <BellOutlined />
          </Badge>
        </a>
      </Tooltip>
    </div>
  );

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
        open={isLanguageMenuOpen}
        onBlur={handleLanguageMenuBlur}
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

    const actionableMenuItems = [
      ...getCommonNavigationMenuItems({ t, user, notificationsCount, helpPage }).filter(item => item.showWhen),
      {
        key: 'logout',
        label: t('common:logOut'),
        icon: <LogoutIcon />,
        badge: null,
        onClick: handleLogOutClick
      }
    ];

    const handleMainMenuClick = ({ key }) => {
      actionableMenuItems.find(item => item.key === key).onClick();
      setIsMainMenuOpen(false);
    };

    const handleMainMenuBlur = () => {
      setIsMainMenuOpen(false);
    };

    const menuItems = actionableMenuItems.map(({ key, label, icon, badge }) => ({
      key,
      icon,
      label: (
        <div className="NavigationDesktop-menuLabel">
          <div>{label}</div>
          {badge}
        </div>
      )
    }));

    return (
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{ items: menuItems, onClick: handleMainMenuClick }}
        open={isMainMenuOpen}
        onBlur={handleMainMenuBlur}
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
        {!!user && renderNotificationsIndicator()}
        {renderLanguageMenu()}
        {user ? renderMainMenu() : renderAnonymousUserComponent()}
      </div>
    </div>
  );
}

export default NavigationDesktop;
