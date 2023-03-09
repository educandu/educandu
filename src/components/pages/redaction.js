import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import RedactionTagsTab from '../redaction/redaction-tags-tab.js';
import RedactionDocumentsTab from '../redaction/redaction-documents-tab.js';
import RedactionMediaLibraryTab from '../redaction/redaction-media-library-tab.js';
import { documentExtendedMetadataShape, mediaLibraryItemShape } from '../../ui/default-prop-types.js';

const TABS = {
  documents: 'documents',
  mediaLibrary: 'media-library',
  tags: 'tags'
};

const determineTab = query => Object.values(TABS).find(val => val === query) || Object.keys(TABS)[0];

function Redaction({ initialState, PageTemplate }) {
  const request = useRequest();
  const { t } = useTranslation('redaction');
  const [documents, setDocuments] = useState(initialState.documents);
  const [currentTab, setCurrentTab] = useState(determineTab(request.query.tab));
  const [mediaLibraryItems, setMediaLibraryItems] = useState(initialState.mediaLibraryItems);

  const changeTab = tab => {
    setCurrentTab(tab);
    history.replaceState(null, '', routes.getRedactionUrl({ tab }));
  };

  const handleTabChange = newKey => {
    changeTab(newKey);
  };

  const tabItems = [
    {
      key: TABS.documents,
      label: t('documentsTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <RedactionDocumentsTab documents={documents} onDocumentsChange={setDocuments} />
        </div>
      )
    },
    {
      key: TABS.mediaLibrary,
      label: t('mediaLibraryTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <RedactionMediaLibraryTab mediaLibraryItems={mediaLibraryItems} onMediaLibraryItemsChange={setMediaLibraryItems} />
        </div>
      )
    },
    {
      key: TABS.tags,
      label: t('tagsTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <RedactionTagsTab documents={documents} mediaLibraryItems={mediaLibraryItems} />
        </div>
      )
    }
  ];

  return (
    <PageTemplate>
      <div className="RedactionPage">
        <h1>{t('pageNames:redaction')}</h1>
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

Redaction.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    documents: PropTypes.arrayOf(documentExtendedMetadataShape).isRequired,
    mediaLibraryItems: PropTypes.arrayOf(mediaLibraryItemShape).isRequired
  }).isRequired
};

export default Redaction;
