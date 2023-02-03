import PropTypes from 'prop-types';
import classNames from 'classnames';
import LiteralUrl from '../literal-url.js';
import DebouncedInput from '../debounced-input.js';
import { SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Checkbox, Empty } from 'antd';
import { Trans, useTranslation } from 'react-i18next';
import { SEARCH_FILE_TYPE } from './wikimedia-utils.js';
import React, { Fragment, useEffect, useState } from 'react';
import WikimediaFilesViewer from './wikimedia-files-viewer.js';
import { wikimediaFileShape } from '../../ui/default-prop-types.js';
import ResourcePreview, { RESOURCE_PREVIEW_LAYOUT } from './resource-preview.js';

const CheckboxGroup = Checkbox.Group;

const MIN_SEARCH_TERM_LENGTH = 3;

const SCREEN = {
  search: 'search',
  searchInvitation: 'search-invitation',
  initialUrlPreview: 'initial-url-preview'
};

const createSearchFileTypeOptions = t => {
  return Object.values(SEARCH_FILE_TYPE).map(sft => ({ label: t(`searchFileType_${sft}`), value: sft }));
};

function WikimediaSearch({
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
  const { t } = useTranslation('wikimediaSearch');

  const [hasSearchedAtLeastOnce, setHasSearchedAtLeastOnce] = useState(false);
  const [typedInSearchTerm, setTypedInSearchTerm] = useState(searchParams.searchTerm);
  const [searchFileTypeOptions, setSearchFileTypeOptions] = useState(createSearchFileTypeOptions(t));
  const [selectedSearchFileTypes, setSelectedSearchFileTypes] = useState(searchParams.searchFileTypes);

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

  useEffect(() => {
    setSearchFileTypeOptions(createSearchFileTypeOptions(t));
  }, [t]);

  useEffect(() => {
    setTypedInSearchTerm(searchParams.searchTerm);
  }, [searchParams.searchTerm]);

  useEffect(() => {
    setSelectedSearchFileTypes(searchParams.searchFileTypes);
  }, [searchParams.searchFileTypes]);

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

  const handleSearchTermChange = value => {
    setTypedInSearchTerm(value);
  };

  const handleSelectedSearchFileTypesChange = newValues => {
    setSelectedSearchFileTypes(newValues);
  };

  const startSearch = newSearchParams => {
    setHasSearchedAtLeastOnce(true);
    onSearchParamsChange(newSearchParams);
  };

  const handleSearchEnterKey = event => {
    const newSearchTerm = event.target.value;
    setTypedInSearchTerm(newSearchTerm);
    startSearch({ searchTerm: newSearchTerm, searchFileTypes: selectedSearchFileTypes });
  };

  const handleSearchButtonClick = () => {
    startSearch({ searchTerm: typedInSearchTerm, searchFileTypes: selectedSearchFileTypes });
  };

  const renderSearchInfo = () => {
    let searchMessage;
    if (isLoading) {
      searchMessage = t('common:searchOngoing');
    } else if (searchParams.searchTerm) {
      searchMessage = (
        <Trans
          t={t}
          i18nKey="common:searchResultInfo"
          values={{ resultCount: files.length, searchTerm: searchParams.searchTerm }}
          components={[<i key="0" />]}
          />
      );
    } else {
      searchMessage = null;
    }

    return searchMessage ? <Alert type="info" message={searchMessage} showIcon /> : null;
  };

  const isSearchButtonDisabled = typedInSearchTerm.length < MIN_SEARCH_TERM_LENGTH || !selectedSearchFileTypes.length || isLoading;

  return (
    <div className={classNames('WikimediaSearch', { 'is-hidden': isHidden })}>
      <div className="WikimediaSearch-buttonsLine">
        <div className="WikimediaSearch-buttonsLineItem">
          <DebouncedInput
            placeholder={t('common:search')}
            value={typedInSearchTerm}
            onPressEnter={handleSearchEnterKey}
            onChange={handleSearchTermChange}
            />
        </div>
        <div className="WikimediaSearch-buttonsLineItem">
          <CheckboxGroup
            options={searchFileTypeOptions}
            value={selectedSearchFileTypes}
            onChange={handleSelectedSearchFileTypesChange}
            disabled={isLoading}
            />
        </div>
        <div className="WikimediaSearch-buttonsLineItem">
          <Button
            type="primary"
            icon={<SearchOutlined />}
            disabled={isSearchButtonDisabled}
            onClick={handleSearchButtonClick}
            >
            {t('common:search')}
          </Button>
        </div>
      </div>
      {currentScreen === SCREEN.search && (
        <Fragment>
          <div className="WikimediaSearch-filesViewer">
            <div className="WikimediaSearch-filesViewerContent">
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
          <div className="WikimediaSearch-searchInfo">
            {renderSearchInfo()}
          </div>
        </Fragment>
      )}
      {currentScreen === SCREEN.searchInvitation && (
        <div className="WikimediaSearch-noSearch">
          <Empty
            image={(
              <SearchOutlined className="WikimediaSearch-searchInvitationIcon" />
            )}
            description={(
              <Fragment>
                <div className="WikimediaSearch-searchInvitationHeader">
                  {t('searchInvitationHeader')}
                </div>
                <div className="WikimediaSearch-searchInvitationDescription">
                  {t('searchInvitationDescription')}
                </div>
              </Fragment>
            )}
            />
        </div>
      )}
      {currentScreen === SCREEN.initialUrlPreview && (
        <div className="WikimediaSearch-noSearch">
          <div className="WikimediaSearch-initialFilePreviewHeader">
            <b>{t('initialFilePreviewHeader')}:</b>
            <br />
            <LiteralUrl>{initialUrl}</LiteralUrl>
          </div>
          <ResourcePreview
            url={initialUrl}
            layout={RESOURCE_PREVIEW_LAYOUT.thumbnailOnly}
            />
          <div className="WikimediaSearch-initialFilePreviewFooter">
            {t('initialFilePreviewFooter')}
          </div>
        </div>
      )}
      <div className="u-resource-picker-screen-footer-right-aligned">
        <div className="u-resource-picker-screen-footer-buttons">
          <Button onClick={onCancelClick}>{t('common:cancel')}</Button>
          <Button type="primary" onClick={handleSelectClick} disabled={!canSelectUrl}>
            {t('common:select')}
          </Button>
        </div>
      </div>
    </div>
  );
}

WikimediaSearch.propTypes = {
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
    searchFileTypes: PropTypes.arrayOf(PropTypes.oneOf(Object.values(SEARCH_FILE_TYPE))).isRequired
  }).isRequired
};

WikimediaSearch.defaultProps = {
  highlightedFile: null,
  initialUrl: null
};

export default WikimediaSearch;
