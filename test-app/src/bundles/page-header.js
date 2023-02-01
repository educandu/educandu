import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Button, Dropdown } from 'antd';
import { useTranslation } from 'react-i18next';
import routes from '../../../src/utils/routes.js';
import Login from '../../../src/components/login.js';
import { useUser } from '../../../src/components/user-context.js';
import { PlusOutlined, QuestionOutlined } from '@ant-design/icons';
import { useLocale } from '../../../src/components/locale-context.js';
import { DOC_VIEW_QUERY_PARAM } from '../../../src/domain/constants.js';
import EditIcon from '../../../src/components/icons/general/edit-icon.js';
import { useSettings } from '../../../src/components/settings-context.js';
import MenuIcon from '../../../src/components/icons/main-menu/menu-icon.js';
import DefaultHeaderLogo from '../../../src/components/default-header-logo.js';
import LogoutIcon from '../../../src/components/icons/main-menu/logout-icon.js';
import LanguageIcon from '../../../src/components/icons/main-menu/language-icon.js';
import SettingsIcon from '../../../src/components/icons/main-menu/settings-icon.js';
import permissions, { hasUserPermission } from '../../../src/domain/permissions.js';
import DashboardIcon from '../../../src/components/icons/main-menu/dashboard-icon.js';
import DocumentMetadataModal from '../../../src/components/document-metadata-modal.js';
import { DOCUMENT_METADATA_MODAL_MODE } from '../../../src/components/document-metadata-modal-utils.js';

function PageHeader({ onUiLanguageClick }) {
  const user = useUser();
  const settings = useSettings();
  const { uiLanguage } = useLocale();
  const { t } = useTranslation('page');
  const helpPage = settings?.helpPage?.[uiLanguage];

  const [isDocumentMetadataModalOpen, setIsDocumentMetadataModalOpen] = useState(false);

  const pageMenuItems = [
    {
      key: 'createDocument',
      label: t('common:newDocument'),
      icon: <PlusOutlined />,
      onClick: () => { setIsDocumentMetadataModalOpen(true); },
      showWhen: !!user
    },
    {
      key: 'dashboard',
      label: t('pageNames:dashboard'),
      icon: <DashboardIcon />,
      onClick: () => { window.location = routes.getDashboardUrl(); },
      showWhen: !!user
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
      icon: <SettingsIcon />,
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
      key: 'ui-language',
      label: t('common:language'),
      icon: <LanguageIcon />,
      onClick: () => onUiLanguageClick(),
      showWhen: true
    },
    {
      key: 'logout',
      label: t('common:logOut'),
      icon: <LogoutIcon />,
      onClick: () => { window.location = routes.getLogoutUrl(); },
      showWhen: !!user
    }
  ].filter(item => item.showWhen);

  const handleMenuItemClick = ({ key }) => {
    const clickedItem = pageMenuItems.find(item => item.key === key);
    clickedItem.onClick();
  };

  const handleDocumentMetadataModalSave = createdDocuments => {
    setIsDocumentMetadataModalOpen(false);

    window.location = routes.getDocUrl({
      id: createdDocuments[0]._id,
      slug: createdDocuments[0].slug,
      view: DOC_VIEW_QUERY_PARAM.edit
    });
  };

  const handleDocumentMetadataModalClose = () => {
    setIsDocumentMetadataModalOpen(false);
  };

  const menuItems = pageMenuItems.map(({ key, label, icon }) => ({ key, label, icon }));

  return (
    <header className="PageHeader">
      <div className="PageHeader-header">
        <div className="PageHeader-headerContent PageHeader-headerContent--left">
          <DefaultHeaderLogo />
        </div>
        <div className="PageHeader-headerContent PageHeader-headerContent--right">
          <div className="PageHeader-loginButton">
            <Login />
          </div>
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            arrow={{ pointAtCenter: true }}
            menu={{ items: menuItems, onClick: handleMenuItemClick }}
            >
            <Button className="DefaultPageHeader-headerButton" icon={<MenuIcon />} type="link" />
          </Dropdown>
        </div>
      </div>
      <DocumentMetadataModal
        initialDocumentMetadata={{}}
        isOpen={isDocumentMetadataModalOpen}
        mode={DOCUMENT_METADATA_MODAL_MODE.create}
        onSave={handleDocumentMetadataModalSave}
        onClose={handleDocumentMetadataModalClose}
        />
    </header>
  );
}

PageHeader.propTypes = {
  onUiLanguageClick: PropTypes.func
};

PageHeader.defaultProps = {
  onUiLanguageClick: () => {}
};

export default PageHeader;
