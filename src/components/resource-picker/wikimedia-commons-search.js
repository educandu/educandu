import PropTypes from 'prop-types';
import classNames from 'classnames';
import LiteralUrl from '../literal-url.js';
import DebouncedInput from '../debounced-input.js';
import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Alert, Button, Modal, Input, Checkbox } from 'antd';
import { SEARCH_FILE_TYPE } from './wikimedia-commons-utils.js';
import { wikimediaFileShape } from '../../ui/default-prop-types.js';
import WikimediaCommonsFilesViewer from './wikimedia-commons-files-viewer.js';
import ResourcePreview, { RESOURCE_PREVIEW_LAYOUT } from './resource-preview.js';

const { Search } = Input;
const CheckboxGroup = Checkbox.Group;

const MIN_SEARCH_TERM_LENGTH = 3;

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

  const [typedInSearchTerm, setTypedInSearchTerm] = useState(searchParams.searchTerm);
  const [searchFileTypeOptions, setSearchFileTypeOptions] = useState(createSearchFileTypeOptions(t));
  const [selectedSearchFileTypes, setSelectedSearchFileTypes] = useState(searchParams.searchFileTypes);

  const shouldUseInitialUrl = !isLoading && !searchParams.searchTerm && initialUrl;
  const canSelectUrl = shouldUseInitialUrl || (!isLoading && highlightedFile);

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
    if (shouldUseInitialUrl) {
      onSelectInitialUrlClick();
    } else {
      onSelectHighlightedFileClick();
    }
  };

  const handleSearchTermChange = newValue => {
    setTypedInSearchTerm(newValue);
  };

  const handleSelectedSearchFileTypesChange = newValues => {
    setSelectedSearchFileTypes(newValues);
  };

  const handleSearchClick = async value => {
    setTypedInSearchTerm(value);

    if (value.length < MIN_SEARCH_TERM_LENGTH) {
      Modal.error({
        title: t('common:error'),
        content: t('common:searchTextTooShort', { minCharCount: MIN_SEARCH_TERM_LENGTH })
      });

      return;
    }

    await onSearchParamsChange({ searchTerm: value, searchFileTypes: selectedSearchFileTypes });
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
            elementType={Search}
            placeholder={t('common:search')}
            value={typedInSearchTerm}
            onSearch={handleSearchClick}
            onChange={handleSearchTermChange}
            disabled={isLoading || !selectedSearchFileTypes.length}
            />
        </div>
        <div className="WikimediaCommonsSearch-buttonsLineItem">
          <span className="WikimediaCommonsSearch-searchFileTypeLabel">
            {t('searchFileTypeLabel')}:
          </span>
          <CheckboxGroup
            options={searchFileTypeOptions}
            value={selectedSearchFileTypes}
            onChange={handleSelectedSearchFileTypesChange}
            disabled={isLoading}
            />
        </div>
      </div>
      {shouldUseInitialUrl && (
        <div className="WikimediaCommonsSearch-initialFilePreview">
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
      {!shouldUseInitialUrl && (
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
      )}
      {!shouldUseInitialUrl && (
        <div className="WikimediaCommonsSearch-searchInfo">
          {renderSearchInfo()}
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
