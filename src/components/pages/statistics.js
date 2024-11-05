import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import UserRoleInfo from '../user-role-info.js';
import React, { useMemo, useState } from 'react';
import { TAB } from '../statistics/constants.js';
import { useRequest } from '../request-context.js';
import StatisticsTagsTab from '../statistics/statistics-tags-tab.js';
import { ClickIcon, TagIcon, UserContributionsIcon } from '../icons/icons.js';
import StatisticsDocumentRequestsTab from '../statistics/statistics-document-requests-tab.js';

const determineTab = query => Object.values(TAB)
  .find(val => val === query) || Object.keys(TAB)[0];

function Statistics({ PageTemplate }) {
  const request = useRequest();
  const { t } = useTranslation('statistics');
  const [currentTab, setCurrentTab] = useState(determineTab(request.query.tab));

  const tabItems = useMemo(() => [
    {
      key: TAB.tags,
      icon: <TagIcon />,
      label: t('tagsTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <StatisticsTagsTab />
        </div>
      )
    },
    {
      key: TAB.documentRequests,
      icon: <ClickIcon />,
      label: t('documentRequestsTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <StatisticsDocumentRequestsTab />
        </div>
      )
    },
    {
      key: TAB.userContributions,
      icon: <UserContributionsIcon />,
      label: t('userContributionsTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <div />
        </div>
      )
    }
  ], [t]);

  return (
    <PageTemplate>
      <div className="StatisticsPage">
        <h1 className="u-page-title-with-subtitle">{t('pageNames:statistics')}</h1>
        <div className="u-page-subtitle">
          <div>{t('pageSubtitle')}</div>
          <UserRoleInfo />
        </div>
        <Tabs
          type="line"
          size="middle"
          className="Tabs"
          items={tabItems}
          activeKey={currentTab}
          destroyInactiveTabPane
          onChange={setCurrentTab}
          />
      </div>
    </PageTemplate>
  );
}

Statistics.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Statistics;
