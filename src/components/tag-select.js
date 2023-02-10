import { Select } from 'antd';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

const MIN_SEARCH_TEXT_LENGTH = 3;
const DEFAULT_TOKEN_SEPARATORS = [' ', '\t'];

function TagSelect({ initialValue, onSuggestionsNeeded, ...rest }) {
  const [isLoading, setIsLoading] = useState(false);
  const [tagOptions, setTagOptions] = useState([]);
  const [suggestedTags, setSuggestedTags] = useState([]);

  useEffect(() => {
    const mergedTags = new Set([...initialValue, ...suggestedTags]);
    setTagOptions([...mergedTags].map(tag => ({ key: tag, value: tag })));
  }, [initialValue, suggestedTags]);

  const handleTagSearch = async searchText => {
    const trimmedSearchText = searchText.trim();
    if (trimmedSearchText.length < MIN_SEARCH_TEXT_LENGTH) {
      setSuggestedTags([]);
    } else {
      setIsLoading(true);
      setSuggestedTags(await onSuggestionsNeeded(trimmedSearchText));
      setIsLoading(false);
    }
  };

  return (
    <Select
      mode="tags"
      loading={isLoading}
      autoComplete="none"
      options={tagOptions}
      notFoundContent={null}
      tokenSeparators={DEFAULT_TOKEN_SEPARATORS}
      onSearch={handleTagSearch}
      {...rest}
      />
  );
}

TagSelect.propTypes = {
  initialValue: PropTypes.arrayOf(PropTypes.string),
  onSuggestionsNeeded: PropTypes.func.isRequired
};

TagSelect.defaultProps = {
  initialValue: []
};

export default TagSelect;
