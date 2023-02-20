import gravatar from 'gravatar';
import classNames from 'classnames';
import { Avatar, Select } from 'antd';
import routes from '../utils/routes.js';
import SearchBar from './search-bar.js';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import React, { useMemo, useState } from 'react';
import { SearchOutlined } from '@ant-design/icons';
import { useSettings } from './settings-context.js';
import { useService } from './container-context.js';
import { getCurrentUrl } from '../ui/browser-helper.js';
import LogoutIcon from './icons/main-menu/logout-icon.js';
import { getCommonNavigationMenuItems } from './navigation-utils.js';
import LanguageDataProvider from '../localization/language-data-provider.js';

const { Option } = Select;

function NavigationDesktop() {
  const user = useUser();
  const settings = useSettings();
  const { t, i18n } = useTranslation('navigationDesktop');
  const { supportedUiLanguages, uiLanguage } = useLocale();
  const languageDataProvider = useService(LanguageDataProvider);

  const helpPage = settings?.helpPage?.[uiLanguage];
  const [isSearchBarActive, setIsSearchBarActive] = useState();
  const [selectedLanguageCode, setSelectedLanguageCode] = useState(uiLanguage.toUpperCase());

  const languageOptions = supportedUiLanguages.map(languageCode => {
    const languageData = languageDataProvider.getLanguageData(languageCode, languageCode);
    const label = `${languageCode.toUpperCase()} - ${languageData.name}`;
    return { value: languageCode, label };
  });

  const displayedSelectedLanguage = useMemo(() => selectedLanguageCode.toUpperCase(), [selectedLanguageCode]);

  const handleLanguageChange = (language, option) => {
    i18n.changeLanguage(language);
    setSelectedLanguageCode(option.value);
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

  const handleSearch = searchText => {
    window.location = routes.getSearchUrl(searchText.trim());
  };

  const renderMenu = () => {
    const items = [
      ...getCommonNavigationMenuItems({ t, user, helpPage }).filter(item => item.showWhen),
      {
        key: 'logout',
        label: t('common:logOut'),
        icon: <LogoutIcon />,
        onClick: handleLogOutClick,
        showWhen: true
      }
    ];

    const handleMenuOptionChange = key => items.find(item => item.key === key).onClick();

    const options = items.map(({ key, label, icon }) => (
      <Option key={key} value={key}>
        <div className="NavigationDesktop-authenticatedUserMenuOption">
          {icon}{label}
        </div>
      </Option>
    ));

    return (
      <Select
        bordered={false}
        placement="bottomRight"
        value={user.displayName}
        dropdownMatchSelectWidth={false}
        onChange={handleMenuOptionChange}
        >
        {options}
      </Select>
    );
  };

  const renderAnonymousUserComponent = () => (
    <div className="NavigationDesktop-anonymousUser">
      <a className="NavigationDesktop-anonymousUserLink" onClick={handleLogInClick}>{t('common:logIn')}</a>
      <span>/</span>
      <a className="NavigationDesktop-anonymousUserLink" onClick={handleRegisterClick}>{t('common:register')}</a>
    </div>
  );

  const renderAuthenticatedUserComponent = () => {
    const gravatarUrl = gravatar.url(user.email, { d: 'mp' });

    return (
      <div className="NavigationDesktop-authenticatedUser">
        <Avatar
          size="large"
          shape="circle"
          src={gravatarUrl}
          alt={user.displayName}
          className="u-avatar"
          />
        {renderMenu()}
      </div>
    );
  };

  return (
    <div className="NavigationDesktop">
      <div className={classNames('NavigationDesktop-searchBar', { 'is-active': isSearchBarActive })} onClick={handleSearchClick}>
        <SearchBar onSearch={handleSearch} size="medium" />
        <div className="NavigationDesktop-searchBarMask"><SearchOutlined /></div>
      </div>
      <div className="NavigationDesktop-menu">
        <Select
          bordered={false}
          placement="bottomRight"
          options={languageOptions}
          value={displayedSelectedLanguage}
          dropdownMatchSelectWidth={false}
          onChange={handleLanguageChange}
          />
        {user ? renderAuthenticatedUserComponent() : renderAnonymousUserComponent()}
      </div>
    </div>
  );
}

export default NavigationDesktop;
