import { Select } from 'antd';
import PropTypes from 'prop-types';
import uniqueId from '../utils/unique-id.js';
import { ensureIsUnique } from '../utils/array-utils.js';
import { otherUserShape } from '../ui/default-prop-types.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';

const MIN_SEARCH_TEXT_LENGTH = 3;

const filterOption = (inputValue, option) => option.label.toLowerCase().includes(inputValue.toLowerCase());

const createUserLabel = user => user.email ? `${user.displayName} (${user.email})` : user.displayName;

function UserSelect({ value, onChange, onSuggestionsNeeded, ...rest }) {
  const fetchRef = useRef(0);
  const [userOptions, setUserOptions] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [mergedUserMap, setMergedUserMap] = useState(new Map());
  const [concurrentFetchCount, setConcurrentFetchCount] = useState(0);

  const selectedUserIds = useMemo(() => value.map(x => x._id), [value]);

  useEffect(() => {
    const newMergedUsers = ensureIsUnique([...value, ...suggestedUsers], x => x._id);
    setMergedUserMap(new Map(newMergedUsers.map(user => [user._id, user])));
    setUserOptions(newMergedUsers.map(user => ({ value: user._id, label: createUserLabel(user) })));
  }, [value, suggestedUsers]);

  const handleChange = newUserIds => {
    onChange(newUserIds.map(id => mergedUserMap.get(id)));
    setSuggestedUsers([]);
  };

  const handleSearch = async searchText => {
    const trimmedSearchText = searchText.trim();
    if (trimmedSearchText.length < MIN_SEARCH_TEXT_LENGTH) {
      setSuggestedUsers([]);
    } else {
      const fetchId = uniqueId.create();
      fetchRef.current = fetchId;
      setConcurrentFetchCount(prev => prev + 1);
      const result = await onSuggestionsNeeded(trimmedSearchText);
      setConcurrentFetchCount(prev => prev - 1);
      if (fetchRef.current === fetchId) {
        setSuggestedUsers(result);
      }
    }
  };

  return (
    <Select
      mode="multiple"
      value={selectedUserIds}
      filterOption={filterOption}
      loading={concurrentFetchCount !== 0}
      options={userOptions}
      notFoundContent={null}
      onChange={handleChange}
      onSearch={handleSearch}
      {...rest}
      />
  );
}

UserSelect.propTypes = {
  value: PropTypes.arrayOf(otherUserShape),
  onChange: PropTypes.func,
  onSuggestionsNeeded: PropTypes.func.isRequired
};

UserSelect.defaultProps = {
  value: [],
  onChange: () => {}
};

export default UserSelect;
