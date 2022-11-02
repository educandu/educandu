import PropTypes from 'prop-types';
import DebouncedInput from '../debounced-input.js';
import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Alert, Button, Modal, Input, Checkbox } from 'antd';
import { SEARCH_FILE_TYPE } from './wikimedia-commons-utils.js';
import { wikimediaFileShape } from '../../ui/default-prop-types.js';
import WikimediaCommonsFilesGridViewer from './wikimedia-commons-files-grid-viewer.js';

const { Search } = Input;
const CheckboxGroup = Checkbox.Group;

const MIN_SEARCH_TERM_LENGTH = 3;

const createSearchFileTypeOptions = t => {
  return Object.values(SEARCH_FILE_TYPE).map(sft => ({ label: t(`searchFileType_${sft}`), value: sft }));
};

function WikimediaCommonsSearch({
  files,
  isLoading,
  searchParams,
  highlightedFile,
  onFileClick,
  onCancelClick,
  onFileDoubleClick,
  onPreviewFileClick,
  onSearchParamsChange,
  onSelectHighlightedFileClick
}) {
  const { t } = useTranslation('wikimediaCommonsSearch');

  const [typedInSearchTerm, setTypedInSearchTerm] = useState(searchParams.searchTerm);
  const [searchFileTypeOptions, setSearchFileTypeOptions] = useState(createSearchFileTypeOptions(t));
  const [selectedSearchFileTypes, setSelectedSearchFileTypes] = useState(searchParams.searchFileTypes);

  useEffect(() => {
    setSearchFileTypeOptions(createSearchFileTypeOptions(t));
  }, [t]);

  useEffect(() => {
    setTypedInSearchTerm(searchParams.searchTerm);
  }, [searchParams.searchTerm]);

  useEffect(() => {
    setSelectedSearchFileTypes(searchParams.searchFileTypes);
  }, [searchParams.searchFileTypes]);

  const handleFileClick = file => {
    onFileClick(file);
  };

  const handleFileDoubleClick = file => {
    onFileDoubleClick(file);
  };

  const handleSelectHighlightedFileClick = () => {
    onSelectHighlightedFileClick(highlightedFile.url);
  };

  const handleSearchTermChange = newValue => {
    setTypedInSearchTerm(newValue);
  };

  const handleSelectedFileTypesChange = newValues => {
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
    const searchMessage = isLoading
      ? t('common:searchOngoing')
      : (
        <Trans
          t={t}
          i18nKey="common:searchResultInfo"
          values={{ searchTerm: searchParams.searchTerm }}
          components={[<i key="0" />]}
          />
      );

    return <Alert type="info" message={searchMessage} showIcon />;
  };

  return (
    <div className="WikimediaCommonsSearch">
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
          <CheckboxGroup
            options={searchFileTypeOptions}
            value={selectedSearchFileTypes}
            onChange={handleSelectedFileTypesChange}
            disabled={isLoading}
            />
        </div>
      </div>
      <div className="WikimediaCommonsSearch-filesViewer">
        <div className="WikimediaCommonsSearch-filesViewerContent">
          <WikimediaCommonsFilesGridViewer
            files={files}
            isLoading={isLoading}
            onFileClick={handleFileClick}
            onFileDoubleClick={handleFileDoubleClick}
            onPreviewFileClick={onPreviewFileClick}
            selectedFileUrl={highlightedFile?.url}
            />
        </div>
      </div>
      <div className="WikimediaCommonsSearch-locationInfo">
        {renderSearchInfo()}
      </div>
      <div className="u-resource-picker-screen-footer-right-aligned">
        <div className="u-resource-picker-screen-footer-buttons">
          <Button onClick={onCancelClick}>{t('common:cancel')}</Button>
          <Button type="primary" onClick={handleSelectHighlightedFileClick} disabled={!highlightedFile || isLoading}>{t('common:select')}</Button>
        </div>
      </div>
    </div>
  );
}

WikimediaCommonsSearch.propTypes = {
  files: PropTypes.arrayOf(wikimediaFileShape).isRequired,
  highlightedFile: wikimediaFileShape,
  isLoading: PropTypes.bool.isRequired,
  onCancelClick: PropTypes.func.isRequired,
  onFileClick: PropTypes.func.isRequired,
  onFileDoubleClick: PropTypes.func.isRequired,
  onPreviewFileClick: PropTypes.func.isRequired,
  onSearchParamsChange: PropTypes.func.isRequired,
  onSelectHighlightedFileClick: PropTypes.func.isRequired,
  searchParams: PropTypes.shape({
    searchTerm: PropTypes.string.isRequired,
    searchFileTypes: PropTypes.arrayOf(PropTypes.oneOf(Object.values(SEARCH_FILE_TYPE))).isRequired
  }).isRequired
};

WikimediaCommonsSearch.defaultProps = {
  highlightedFile: null
};

export default WikimediaCommonsSearch;
