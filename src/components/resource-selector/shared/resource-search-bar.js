import PropTypes from 'prop-types';
import { Input, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { SEARCH_RESOURCE_TYPE } from '../../../domain/constants.js';

const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const MIN_SEARCH_TERM_LENGTH = 3;

function ResourceSearchBar({ isLoading, initialSearchParams, onSearch }) {
  const { t } = useTranslation('resourceSearchBar');
  const [typedInSearchTerm, setTypedInSearchTerm] = useState(initialSearchParams.searchTerm);
  const [selectedResourceType, setSelectedSearchFileType] = useState(initialSearchParams.searchResourceType);

  useEffect(() => {
    setTypedInSearchTerm(initialSearchParams.searchTerm);
  }, [initialSearchParams.searchTerm]);

  useEffect(() => {
    setSelectedSearchFileType(initialSearchParams.searchResourceType);
  }, [initialSearchParams.searchResourceType]);

  const handleSearchTermChange = event => {
    setTypedInSearchTerm(event.target.value);
  };

  const tryStartSearch = newSearchParams => {
    if (newSearchParams.searchTerm.length >= MIN_SEARCH_TERM_LENGTH && newSearchParams.searchResourceType) {
      onSearch(newSearchParams);
    }
  };

  const handleSelectedResourceTypeChange = event => {
    const { value } = event.target;
    setSelectedSearchFileType(value);
    tryStartSearch({ searchTerm: typedInSearchTerm, searchResourceType: value });
  };

  const handleSearchEnterKey = event => {
    const newSearchTerm = event.target.value;
    setTypedInSearchTerm(newSearchTerm);
    tryStartSearch({ searchTerm: newSearchTerm.trim(), searchResourceType: selectedResourceType });
  };

  return (
    <div className="ResourceSearchBar">
      <div className="ResourceSearchBar-input">
        <Input
          allowClear
          value={typedInSearchTerm}
          placeholder={t('searchTerms')}
          onPressEnter={handleSearchEnterKey}
          onChange={handleSearchTermChange}
          />
      </div>
      <RadioGroup value={selectedResourceType} disabled={isLoading} onChange={handleSelectedResourceTypeChange}>
        <RadioButton value={SEARCH_RESOURCE_TYPE.audio}>{t(`common:resourceType_${SEARCH_RESOURCE_TYPE.audio}`)}</RadioButton>
        <RadioButton value={SEARCH_RESOURCE_TYPE.video}>{t(`common:resourceType_${SEARCH_RESOURCE_TYPE.video}`)}</RadioButton>
        <RadioButton value={SEARCH_RESOURCE_TYPE.image}>{t(`common:resourceType_${SEARCH_RESOURCE_TYPE.image}`)}</RadioButton>
        <RadioButton value={SEARCH_RESOURCE_TYPE.pdf}>{t(`common:resourceType_${SEARCH_RESOURCE_TYPE.pdf}`)}</RadioButton>
        <RadioButton value={SEARCH_RESOURCE_TYPE.any}>{t('common:any')}</RadioButton>
      </RadioGroup>
    </div>
  );
}

ResourceSearchBar.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  initialSearchParams: PropTypes.shape({
    searchTerm: PropTypes.string.isRequired,
    searchResourceType: PropTypes.oneOf(Object.values(SEARCH_RESOURCE_TYPE)).isRequired
  }).isRequired,
  onSearch: PropTypes.func.isRequired
};

ResourceSearchBar.defaultProps = {};

export default ResourceSearchBar;
