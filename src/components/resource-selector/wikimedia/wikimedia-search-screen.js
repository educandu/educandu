import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Alert, Button } from 'antd';
import NoSearch from '../shared/no-search.js';
import React, { Fragment, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { SOURCE_TYPE } from '../../../domain/constants.js';
import WikimediaFilesViewer from './wikimedia-files-viewer.js';
import ResourceSearchBar from '../shared/resource-search-bar.js';
import { wikimediaFileShape } from '../../../ui/default-prop-types.js';
import { ALLOWED_WIKIMEDIA_RESOURCE_TYPES } from '../../../utils/wikimedia-utils.js';

const SCREEN = {
  search: 'search',
  searchInvitation: 'search-invitation',
  initialUrlPreview: 'initial-url-preview'
};

function WikimediaSearchScreen({
  files,
  isHidden,
  isLoading,
  initialUrl,
  canLoadMore,
  searchParams,
  highlightedFile,
  onLoadMore,
  onFileClick,
  onCancelClick,
  onFileDoubleClick,
  onPreviewFileClick,
  onSearchParamsChange,
  onSelectInitialUrlClick,
  onOpenWikimediaPageClick,
  onSelectHighlightedFileClick
}) {
  const { t } = useTranslation('wikimediaSearchScreen');
  const [hasSearchedAtLeastOnce, setHasSearchedAtLeastOnce] = useState(false);

  let currentScreen;
  let canSelectUrl;
  if (hasSearchedAtLeastOnce) {
    currentScreen = SCREEN.search;
    canSelectUrl = !!highlightedFile;
  } else if (initialUrl) {
    currentScreen = SCREEN.initialUrlPreview;
    canSelectUrl = true;
  } else {
    currentScreen = SCREEN.searchInvitation;
    canSelectUrl = false;
  }

  const handleSearch = newSearchParams => {
    setHasSearchedAtLeastOnce(true);
    onSearchParamsChange(newSearchParams);
  };

  const handleSelectClick = () => {
    switch (currentScreen) {
      case SCREEN.search:
        return onSelectHighlightedFileClick();
      case SCREEN.initialUrlPreview:
        return onSelectInitialUrlClick();
      default:
        throw new Error('No file selected');
    }
  };

  const renderSearchInfo = () => {
    if (isLoading) {
      return <Alert type="info" message={t('common:searchOngoing')} showIcon />;
    }

    if (searchParams.searchTerm) {
      const messageParams = { resultCount: files.length, searchTerm: searchParams.searchTerm };
      const message = <Trans t={t} i18nKey="common:searchResultInfo" values={messageParams} />;
      return <Alert type="info" message={message} showIcon />;
    }

    return null;
  };

  return (
    <div className={classNames('WikimediaSearchScreen', { 'is-hidden': isHidden })}>
      <ResourceSearchBar
        isLoading={isLoading}
        initialSearchParams={searchParams}
        allowedResourceTypes={ALLOWED_WIKIMEDIA_RESOURCE_TYPES}
        onSearch={handleSearch}
        />
      {currentScreen === SCREEN.search && (
        <Fragment>
          <div className="WikimediaSearchScreen-filesViewer">
            <div className="WikimediaSearchScreen-filesViewerContent">
              <WikimediaFilesViewer
                files={files}
                isLoading={isLoading}
                onLoadMore={onLoadMore}
                canLoadMore={canLoadMore}
                onFileClick={onFileClick}
                onFileDoubleClick={onFileDoubleClick}
                selectedFileUrl={highlightedFile?.url}
                onPreviewFileClick={onPreviewFileClick}
                onOpenWikimediaPageClick={onOpenWikimediaPageClick}
                />
            </div>
          </div>
          {renderSearchInfo()}
        </Fragment>
      )}
      {currentScreen !== SCREEN.search && (
        <div className="WikimediaSearchScreen-noSearch">
          <NoSearch sourceType={SOURCE_TYPE.wikimedia} url={initialUrl} />
        </div>
      )}
      <div className="u-resource-selector-screen-footer-right-aligned">
        <div className="u-resource-selector-screen-footer-buttons">
          <Button onClick={onCancelClick}>{t('common:cancel')}</Button>
          <Button type="primary" onClick={handleSelectClick} disabled={!canSelectUrl}>
            {t('common:select')}
          </Button>
        </div>
      </div>
    </div>
  );
}

WikimediaSearchScreen.propTypes = {
  canLoadMore: PropTypes.bool.isRequired,
  files: PropTypes.arrayOf(wikimediaFileShape).isRequired,
  highlightedFile: wikimediaFileShape,
  initialUrl: PropTypes.string,
  isHidden: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onCancelClick: PropTypes.func.isRequired,
  onFileClick: PropTypes.func.isRequired,
  onFileDoubleClick: PropTypes.func.isRequired,
  onLoadMore: PropTypes.func.isRequired,
  onOpenWikimediaPageClick: PropTypes.func.isRequired,
  onPreviewFileClick: PropTypes.func.isRequired,
  onSearchParamsChange: PropTypes.func.isRequired,
  onSelectHighlightedFileClick: PropTypes.func.isRequired,
  onSelectInitialUrlClick: PropTypes.func.isRequired,
  searchParams: PropTypes.shape({
    searchTerm: PropTypes.string.isRequired,
    searchResourceTypes: PropTypes.arrayOf(PropTypes.oneOf(ALLOWED_WIKIMEDIA_RESOURCE_TYPES)).isRequired
  }).isRequired
};

WikimediaSearchScreen.defaultProps = {
  highlightedFile: null,
  initialUrl: null
};

export default WikimediaSearchScreen;
