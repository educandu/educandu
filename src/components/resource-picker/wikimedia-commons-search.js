import PropTypes from 'prop-types';
import classNames from 'classnames';
import LiteralUrl from '../literal-url.js';
import DebouncedInput from '../debounced-input.js';
import { SearchOutlined } from '@ant-design/icons';
import { Trans, useTranslation } from 'react-i18next';
import React, { Fragment, useEffect, useState } from 'react';
import { Alert, Button, Modal, Checkbox, Empty } from 'antd';
import { SEARCH_FILE_TYPE } from './wikimedia-commons-utils.js';
import { wikimediaFileShape } from '../../ui/default-prop-types.js';
import WikimediaCommonsFilesViewer from './wikimedia-commons-files-viewer.js';
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

function WikimediaCommonsSearch({
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
  onSelectHighlightedFileClick,
  onOpenWikimediaCommonsPageClick
}) {
  const { t } = useTranslation('wikimediaCommonsSearch');

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

  const tryStartSearch = newSearchParams => {
    if (newSearchParams.searchTerm.length < MIN_SEARCH_TERM_LENGTH) {
      Modal.error({
        title: t('common:error'),
        content: t('common:searchTextTooShort', { minCharCount: MIN_SEARCH_TERM_LENGTH })
      });

      return;
    }

    setHasSearchedAtLeastOnce(true);
    onSearchParamsChange(newSearchParams);
  };

  const handleSearchEnterKey = event => {
    const newSearchTerm = event.target.value;
    setTypedInSearchTerm(newSearchTerm);
    tryStartSearch({ searchTerm: newSearchTerm, searchFileTypes: selectedSearchFileTypes });
  };

  const handleSearchButtonClick = () => {
    tryStartSearch({ searchTerm: typedInSearchTerm, searchFileTypes: selectedSearchFileTypes });
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

  return (
    <div className={classNames('WikimediaCommonsSearch', { 'is-hidden': isHidden })}>
      <div className="WikimediaCommonsSearch-buttonsLine">
        <div className="WikimediaCommonsSearch-buttonsLineItem">
          <DebouncedInput
            placeholder={t('common:search')}
            value={typedInSearchTerm}
            onPressEnter={handleSearchEnterKey}
            onChange={handleSearchTermChange}
            />
        </div>
        <div className="WikimediaCommonsSearch-buttonsLineItem">
          <CheckboxGroup
            options={searchFileTypeOptions}
            value={selectedSearchFileTypes}
            onChange={handleSelectedSearchFileTypesChange}
            disabled={isLoading}
            />
        </div>
        <div className="WikimediaCommonsSearch-buttonsLineItem">
          <Button
            type="primary"
            icon={<SearchOutlined />}
            disabled={!selectedSearchFileTypes.length || isLoading}
            onClick={handleSearchButtonClick}
            >
            {t('common:search')}
          </Button>
        </div>
      </div>
      {currentScreen === SCREEN.search && (
        <Fragment>
          <div className="WikimediaCommonsSearch-filesViewer">
            <div className="WikimediaCommonsSearch-filesViewerContent">
              <WikimediaCommonsFilesViewer
                files={files}
                isLoading={isLoading}
                onLoadMore={onLoadMore}
                canLoadMore={canLoadMore}
                onFileClick={onFileClick}
                onFileDoubleClick={onFileDoubleClick}
                selectedFileUrl={highlightedFile?.url}
                onPreviewFileClick={onPreviewFileClick}
                onOpenWikimediaCommonsPageClick={onOpenWikimediaCommonsPageClick}
                />
            </div>
          </div>
          <div className="WikimediaCommonsSearch-searchInfo">
            {renderSearchInfo()}
          </div>
        </Fragment>
      )}
      {currentScreen === SCREEN.searchInvitation && (
        <div className="WikimediaCommonsSearch-noSearch">
          <Empty
            image={(
              <SearchOutlined className="WikimediaCommonsSearch-searchInvitationIcon" />
            )}
            description={(
              <Fragment>
                <div className="WikimediaCommonsSearch-searchInvitationHeader">
                  {t('searchInvitationHeader')}
                </div>
                <div className="WikimediaCommonsSearch-searchInvitationDescription">
                  {t('searchInvitationDescription')}
                </div>
              </Fragment>
            )}
            />
        </div>
      )}
      {currentScreen === SCREEN.initialUrlPreview && (
        <div className="WikimediaCommonsSearch-noSearch">
          <div className="WikimediaCommonsSearch-initialFilePreviewHeader">
            <b>{t('initialFilePreviewHeader')}:</b>
            <br />
            <LiteralUrl>{initialUrl}</LiteralUrl>
          </div>
          <ResourcePreview
            url={initialUrl}
            layout={RESOURCE_PREVIEW_LAYOUT.thumbnailOnly}
            />
          <div className="WikimediaCommonsSearch-initialFilePreviewFooter">
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

WikimediaCommonsSearch.propTypes = {
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
  onOpenWikimediaCommonsPageClick: PropTypes.func.isRequired,
  onPreviewFileClick: PropTypes.func.isRequired,
  onSearchParamsChange: PropTypes.func.isRequired,
  onSelectHighlightedFileClick: PropTypes.func.isRequired,
  onSelectInitialUrlClick: PropTypes.func.isRequired,
  searchParams: PropTypes.shape({
    searchTerm: PropTypes.string.isRequired,
    searchFileTypes: PropTypes.arrayOf(PropTypes.oneOf(Object.values(SEARCH_FILE_TYPE))).isRequired
  }).isRequired
};

WikimediaCommonsSearch.defaultProps = {
  highlightedFile: null,
  initialUrl: null
};

export default WikimediaCommonsSearch;
