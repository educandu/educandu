import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BankOutlined } from '@ant-design/icons';
import { TABS } from '../maintenance/constants.js';
import { useRequest } from '../request-context.js';
import FileIcon from '../icons/general/file-icon.js';
import { documentExtendedMetadataShape, mediaLibraryItemShape } from '../../ui/default-prop-types.js';

const determineTab = query => Object.values(TABS).find(val => val === query) || Object.keys(TABS)[0];

function RecentContributions({ initialState, PageTemplate }) {
  const request = useRequest();
  const { t } = useTranslation('recentContributions');
  const [currentTab, setCurrentTab] = useState(determineTab(request.query.tab));

  const changeTab = tab => {
    setCurrentTab(tab);
  };

  const handleTabChange = newKey => {
    changeTab(newKey);
  };

  const tabItems = [
    {
      key: TABS.documents,
      label: <div><FileIcon />{t('documentsTabTitle')}</div>,
      children: (
        <div className="Tabs-tabPane" />
      )
    },
    {
      key: TABS.mediaLibrary,
      label: <div><BankOutlined />{t('mediaLibraryTabTitle')}</div>,
      children: (
        <div className="Tabs-tabPane" />
      )
    }
  ];

  return (
    <PageTemplate>
      <div className="RecentContributionsPage">
        <h1 className="u-page-title-with-subtitle">{t('pageNames:recentContributions')}</h1>
        <div className="u-page-subtitle">{t('pageSubtitle')}</div>
        <Tabs
          type="line"
          size="middle"
          className="Tabs"
          items={tabItems}
          activeKey={currentTab}
          destroyInactiveTabPane
          onChange={handleTabChange}
          />
      </div>
    </PageTemplate>
  );
}

RecentContributions.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    documents: PropTypes.arrayOf(documentExtendedMetadataShape).isRequired,
    mediaLibraryItems: PropTypes.arrayOf(mediaLibraryItemShape).isRequired
  }).isRequired
};

export default RecentContributions;
