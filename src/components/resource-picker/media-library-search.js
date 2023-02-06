import PropTypes from 'prop-types';
import classNames from 'classnames';
import LiteralUrl from '../literal-url.js';
import { SearchOutlined } from '@ant-design/icons';
import { Trans, useTranslation } from 'react-i18next';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Checkbox, Empty, Input, Spin } from 'antd';
import ResourcePreview, { RESOURCE_PREVIEW_LAYOUT } from './resource-preview.js';
import { MEDIA_LIBRARY_SEARCH_FILE_TYPE } from '../../utils/media-library-utils.js';
import { mediaLibraryItemWithRelevanceShape } from '../../ui/default-prop-types.js';
import FilesGridViewer from './files-grid-viewer.js';
import urlUtils from '../../utils/url-utils.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../container-context.js';
import ClientConfig from '../../bootstrap/client-config.js';
import permissions, { hasUserPermission } from '../../domain/permissions.js';
import { useUser } from '../user-context.js';

const CheckboxGroup = Checkbox.Group;

const MIN_SEARCH_TERM_LENGTH = 3;

const SCREEN = {
  search: 'search',
  searchInvitation: 'search-invitation',
  initialUrlPreview: 'initial-url-preview'
};

const createSearchFileTypeOptions = t => {
  return Object.values(MEDIA_LIBRARY_SEARCH_FILE_TYPE).map(sft => ({ label: t(`searchFileType_${sft}`), value: sft }));
};

function MediaLibrarySearch({
  files,
  isHidden,
  isLoading,
  initialUrl,
  searchParams,
  highlightedFile,
  onFileClick,
  onCancelClick,
  onFileDoubleClick,
  onDeleteFileClick,
  onPreviewFileClick,
  onSearchParamsChange,
  onSelectInitialUrlClick,
  onSelectHighlightedFileClick
}) {
  const user = useUser();
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('mediaLibrarySearch');
  const [hasSearchedAtLeastOnce, setHasSearchedAtLeastOnce] = useState(false);
  const [typedInSearchTerm, setTypedInSearchTerm] = useState(searchParams.searchTerm);
  const [searchFileTypeOptions, setSearchFileTypeOptions] = useState(createSearchFileTypeOptions(t));
  const [selectedSearchFileTypes, setSelectedSearchFileTypes] = useState(searchParams.searchFileTypes);

  const displayedItems = useMemo(() => {
    return files.map(file => ({
      originalFile: file,
      url: getAccessibleUrl({ url: file.url, cdnRootUrl: clientConfig.cdnRootUrl }),
      portableUrl: file.url,
      displayName: urlUtils.getFileName(file.url)
    }));
  }, [files, clientConfig]);

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

  const handleSearchTermChange = event => {
    setTypedInSearchTerm(event.target.value);
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
    <div className={classNames('MediaLibrarySearch', { 'is-hidden': isHidden })}>
      <div className="MediaLibrarySearch-buttonsLine">
        <div className="MediaLibrarySearch-buttonsLineItem">
          <Input
            placeholder={t('common:search')}
            value={typedInSearchTerm}
            onPressEnter={handleSearchEnterKey}
            onChange={handleSearchTermChange}
            />
        </div>
        <div className="MediaLibrarySearch-buttonsLineItem">
          <CheckboxGroup
            options={searchFileTypeOptions}
            value={selectedSearchFileTypes}
            onChange={handleSelectedSearchFileTypesChange}
            disabled={isLoading}
            />
        </div>
        <div className="MediaLibrarySearch-buttonsLineItem">
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
          <div className="MediaLibrarySearch-filesViewer">
            <div className="MediaLibrarySearch-filesViewerContent">
              <FilesGridViewer
                files={displayedItems}
                selectedFileUrl={highlightedFile?.url}
                canDelete={hasUserPermission(user, permissions.DELETE_ANY_STORAGE_FILE)}
                onFileClick={file => onFileClick(file.originalFile)}
                onFileDoubleClick={file => onFileDoubleClick(file.originalFile)}
                onDeleteFileClick={file => onDeleteFileClick(file.originalFile)}
                onPreviewFileClick={file => onPreviewFileClick(file.originalFile)}
                />
            </div>
            {!!isLoading && (
              <div className={classNames('MediaLibrarySearch-filesViewerOverlay')}>
                <Spin size="large" />
              </div>
            )}
          </div>
          <div className="MediaLibrarySearch-searchInfo">
            {renderSearchInfo()}
          </div>
        </Fragment>
      )}
      {currentScreen === SCREEN.searchInvitation && (
        <div className="MediaLibrarySearch-noSearch">
          <Empty
            image={(
              <SearchOutlined className="MediaLibrarySearch-searchInvitationIcon" />
            )}
            description={(
              <Fragment>
                <div className="MediaLibrarySearch-searchInvitationHeader">
                  {t('searchInvitationHeader')}
                </div>
                <div className="MediaLibrarySearch-searchInvitationDescription">
                  {t('searchInvitationDescription')}
                </div>
              </Fragment>
            )}
            />
        </div>
      )}
      {currentScreen === SCREEN.initialUrlPreview && (
        <div className="MediaLibrarySearch-noSearch">
          <div className="MediaLibrarySearch-initialFilePreviewHeader">
            <b>{t('initialFilePreviewHeader')}:</b>
            <br />
            <LiteralUrl>{initialUrl}</LiteralUrl>
          </div>
          <ResourcePreview
            url={initialUrl}
            layout={RESOURCE_PREVIEW_LAYOUT.thumbnailOnly}
            />
          <div className="MediaLibrarySearch-initialFilePreviewFooter">
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

MediaLibrarySearch.propTypes = {
  files: PropTypes.arrayOf(mediaLibraryItemWithRelevanceShape).isRequired,
  highlightedFile: mediaLibraryItemWithRelevanceShape,
  initialUrl: PropTypes.string,
  isHidden: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onCancelClick: PropTypes.func.isRequired,
  onFileClick: PropTypes.func.isRequired,
  onFileDoubleClick: PropTypes.func.isRequired,
  onDeleteFileClick: PropTypes.func.isRequired,
  onPreviewFileClick: PropTypes.func.isRequired,
  onSearchParamsChange: PropTypes.func.isRequired,
  onSelectHighlightedFileClick: PropTypes.func.isRequired,
  onSelectInitialUrlClick: PropTypes.func.isRequired,
  searchParams: PropTypes.shape({
    searchTerm: PropTypes.string.isRequired,
    searchFileTypes: PropTypes.arrayOf(PropTypes.oneOf(Object.values(MEDIA_LIBRARY_SEARCH_FILE_TYPE))).isRequired
  }).isRequired
};

MediaLibrarySearch.defaultProps = {
  highlightedFile: null,
  initialUrl: null
};

export default MediaLibrarySearch;
