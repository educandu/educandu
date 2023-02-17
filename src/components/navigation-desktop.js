import gravatar from 'gravatar';
import routes from '../utils/routes.js';
import { Avatar, Select } from 'antd';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import React, { useMemo, useState } from 'react';
import EditIcon from './icons/general/edit-icon.js';
import { useSettings } from './settings-context.js';
import { useService } from './container-context.js';
import { getCurrentUrl } from '../ui/browser-helper.js';
import UsersIcon from './icons/main-menu/users-icon.js';
import LogoutIcon from './icons/main-menu/logout-icon.js';
import SettingsIcon from './icons/main-menu/settings-icon.js';
import DashboardIcon from './icons/main-menu/dashboard-icon.js';
import { ControlOutlined, QuestionOutlined } from '@ant-design/icons';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import LanguageDataProvider from '../localization/language-data-provider.js';

function NavigationDesktop() {
  const user = useUser();
  const settings = useSettings();
  const { t, i18n } = useTranslation('navigationDesktop');
  const { supportedUiLanguages, uiLanguage } = useLocale();
  const languageDataProvider = useService(LanguageDataProvider);

  const helpPage = settings?.helpPage?.[uiLanguage];
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

  const handleAvatarClick = () => {
    window.location = routes.getDashboardUrl();
  };

  const handleLoginClick = () => {
    window.location = routes.getLoginUrl(getCurrentUrl());
  };

  const handleRegisterClick = () => {
    window.location = routes.getRegisterUrl();
  };

  const renderMenu = () => {
    const items = [
      {
        key: 'dashboard',
        label: t('pageNames:dashboard'),
        icon: <DashboardIcon />,
        onClick: () => { window.location = routes.getDashboardUrl(); },
        showWhen: true
      },
      {
        key: 'profile',
        label: t('pageNames:userProfile'),
        icon: <UsersIcon />,
        onClick: () => { window.location = routes.getUserProfileUrl(user._id); },
        showWhen: true
      },
      {
        key: 'settings',
        label: t('common:settings'),
        icon: <SettingsIcon />,
        onClick: () => { window.location = routes.getDashboardUrl({ tab: 'settings' }); },
        showWhen: true
      },
      {
        key: 'redaction',
        label: t('pageNames:redaction'),
        icon: <EditIcon />,
        onClick: () => { window.location = routes.getRedactionUrl(); },
        showWhen: hasUserPermission(user, permissions.MANAGE_CONTENT)
      },
      {
        key: 'admin',
        label: t('pageNames:admin'),
        icon: <ControlOutlined />,
        onClick: () => { window.location = routes.getAdminUrl(); },
        showWhen: hasUserPermission(user, permissions.ADMIN)
      },
      {
        key: 'help',
        label: helpPage?.linkTitle,
        icon: <QuestionOutlined />,
        onClick: () => { window.location = helpPage ? routes.getDocUrl({ id: helpPage.documentId }) : ''; },
        showWhen: !!helpPage?.documentId
      },
      {
        key: 'logout',
        label: t('common:logOut'),
        icon: <LogoutIcon />,
        onClick: () => { window.location = routes.getLogoutUrl(); },
        showWhen: true
      }
    ].filter(item => item.showWhen);

    const handleMenuOptionChange = key => items.find(item => item.key === key).onClick();

    const options = items.map(({ key, label, icon }) => (
      <Select.Option key={key} value={key}>
        <div className="NavigationDesktop-authenticatedUserMenuOption">
          {icon}{label}
        </div>
      </Select.Option>
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
      <a className="NavigationDesktop-anonymousUserLink" onClick={handleLoginClick}>{t('common:logIn')}</a>
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
          className="u-avatar u-clickable"
          onClick={handleAvatarClick}
          />
        {renderMenu()}
      </div>
    );
  };

  return (
    <div className="NavigationDesktop">
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
  );
}

export default NavigationDesktop;
