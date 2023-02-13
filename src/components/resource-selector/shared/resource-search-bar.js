import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button, Checkbox, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { RESOURCE_TYPE } from '../../../domain/constants.js';

const CheckboxGroup = Checkbox.Group;

const MIN_SEARCH_TERM_LENGTH = 3;

const OVERALL_POSSIBLE_RESOURCE_TYPES = [
  RESOURCE_TYPE.unknown,
  RESOURCE_TYPE.audio,
  RESOURCE_TYPE.video,
  RESOURCE_TYPE.image,
  RESOURCE_TYPE.pdf
];

const createResourceTypeOptions = (allowedResourceTypes, t) => {
  return allowedResourceTypes.map(resourceType => ({ label: t(`resourceType_${resourceType}`), value: resourceType }));
};

function ResourceSearchBar({ isLoading, allowedResourceTypes, initialSearchParams, onSearch }) {
  const { t } = useTranslation('resourceSearchBar');
  const [typedInSearchTerm, setTypedInSearchTerm] = useState(initialSearchParams.searchTerm);
  const [selectedResourceTypes, setSelectedSearchFileTypes] = useState(initialSearchParams.searchResourceTypes);
  const [resourceTypeOptions, setSearchFileTypeOptions] = useState(createResourceTypeOptions(allowedResourceTypes, t));

  useEffect(() => {
    setSearchFileTypeOptions(createResourceTypeOptions(allowedResourceTypes, t));
  }, [allowedResourceTypes, t]);

  useEffect(() => {
    setTypedInSearchTerm(initialSearchParams.searchTerm);
  }, [initialSearchParams.searchTerm]);

  useEffect(() => {
    setSelectedSearchFileTypes(initialSearchParams.searchResourceTypes);
  }, [initialSearchParams.searchResourceTypes]);

  const handleSearchTermChange = event => {
    setTypedInSearchTerm(event.target.value);
  };

  const handleSelectedSearchFileTypesChange = newValues => {
    setSelectedSearchFileTypes(newValues);
  };

  const tryStartSearch = newSearchParams => {
    if (newSearchParams.searchTerm.length >= MIN_SEARCH_TERM_LENGTH && newSearchParams.searchResourceTypes.length) {
      onSearch(newSearchParams);
    }
  };

  const handleSearchEnterKey = event => {
    const newSearchTerm = event.target.value;
    setTypedInSearchTerm(newSearchTerm);
    tryStartSearch({ searchTerm: newSearchTerm.trim(), searchResourceTypes: selectedResourceTypes });
  };

  const handleSearchButtonClick = () => {
    tryStartSearch({ searchTerm: typedInSearchTerm.trim(), searchResourceTypes: selectedResourceTypes });
  };

  const isSearchButtonDisabled = typedInSearchTerm.length < MIN_SEARCH_TERM_LENGTH
    || !selectedResourceTypes.length
    || isLoading;

  return (
    <div className="ResourceSearchBar">
      <div className="ResourceSearchBar-item">
        <Input
          allowClear
          value={typedInSearchTerm}
          placeholder={t('searchTerm')}
          onPressEnter={handleSearchEnterKey}
          onChange={handleSearchTermChange}
          />
      </div>
      <div className="ResourceSearchBar-item ResourceSearchBar-item--long">
        <CheckboxGroup
          options={resourceTypeOptions}
          value={selectedResourceTypes}
          onChange={handleSelectedSearchFileTypesChange}
          disabled={isLoading}
          />
      </div>
      <div className="ResourceSearchBar-item">
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
  );
}

ResourceSearchBar.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  allowedResourceTypes: PropTypes.arrayOf(PropTypes.oneOf(OVERALL_POSSIBLE_RESOURCE_TYPES)).isRequired,
  initialSearchParams: PropTypes.shape({
    searchTerm: PropTypes.string.isRequired,
    searchResourceTypes: PropTypes.arrayOf(PropTypes.oneOf(OVERALL_POSSIBLE_RESOURCE_TYPES)).isRequired
  }).isRequired,
  onSearch: PropTypes.func.isRequired
};

ResourceSearchBar.defaultProps = {};

export default ResourceSearchBar;
