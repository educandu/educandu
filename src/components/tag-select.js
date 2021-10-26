import React from 'react';
import PropTypes from 'prop-types';
import { Select } from 'antd';

export function TagSelect(props) {
  const { tagSuggestionsQuery, onSuggestionQueryChanged, options, onTagSuggestionsRefresh, onTagsChange, ...rest } = props;

  return (
    <Select
      {...rest}
      mode="tags"
      tokenSeparators={[' ', '\t']}
      value={props.value}
      onKeyUp={e => {
        if (e.key === 'Backspace') {
          onSuggestionQueryChanged(tagSuggestionsQuery.slice(0, tagSuggestionsQuery.length - 1));
          return;
        }
        const input = String.fromCharCode(event.keyCode);
        if (!(/[a-zA-Z0-9]/).test(input)) {
          return;
        }

        const newTagsSuggesionQuery = `${tagSuggestionsQuery}${e.key}`;
        onSuggestionQueryChanged(newTagsSuggesionQuery);
        if (newTagsSuggesionQuery.length === 3) {
          onTagSuggestionsRefresh(newTagsSuggesionQuery);
        }
      }}
      onChange={selectedValue => onTagsChange(selectedValue)}
      options={options.map(tag => ({ value: tag, key: tag }))}
      />);

}

TagSelect.propTypes = {
  onSuggestionQueryChanged: PropTypes.func.isRequired,
  onTagSuggestionsRefresh: PropTypes.func.isRequired,
  onTagsChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  tagSuggestionsQuery: PropTypes.string.isRequired,
  value: PropTypes.arrayOf(PropTypes.string).isRequired
};
