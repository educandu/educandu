import React from 'react';
import Page from '../page';
import { Input } from 'antd';
import DocView from '../doc-view';
import PropTypes from 'prop-types';
import ElmuLogo from '../elmu-logo';
import { useRequest } from '../request-context';
import { useSettings } from '../settings-context';
import { documentShape } from '../../ui/default-prop-types';

const { Search } = Input;

function Index({ initialState }) {
  const req = useRequest();
  const settings = useSettings();
  const { document: doc, landingPageLanguage } = initialState;
  const lpSetting = settings.landingPage?.languages?.[landingPageLanguage] || null;

  const handleSearchClick = searchTerm => {
    const googleTerm = [`site:${req.hostInfo.host}`, searchTerm].filter(x => x).join(' ');
    const link = `https://www.google.com/search?q=${encodeURIComponent(googleTerm)}`;
    window.open(link, '_blank');
  };

  return (
    <Page fullScreen>
      <div className="IndexPage">
        <div className="IndexPage-title">
          <ElmuLogo size="big" readonly />
        </div>
        {lpSetting && (
          <div className="IndexPage-search">
            <Search
              placeholder={lpSetting.searchFieldPlaceholder}
              enterButton={lpSetting.searchFieldButton}
              size="large"
              onSearch={handleSearchClick}
              />
          </div>
        )}
        {doc && <DocView documentOrRevision={doc} />}
      </div>
    </Page>
  );
}

Index.propTypes = {
  initialState: PropTypes.shape({
    document: documentShape,
    landingPageLanguage: PropTypes.string
  }).isRequired
};

export default Index;
