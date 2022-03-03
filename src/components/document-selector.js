import thenby from 'thenby';
import { Select } from 'antd';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import React, { useEffect, useState } from 'react';
import { documentMetadataShape, documentShape } from '../ui/default-prop-types.js';

const { Option } = Select;

const createKeyOptions = memoizeOne(documents => {
  return documents
    .map(doc => ({ key: doc.key, value: doc.key, title: `${doc.key} - ${doc.title}` }))
    .sort(thenby(x => x.title));
});

const createUrlOptions = memoizeOne(documents => {
  return documents
    .filter(doc => doc.slug)
    .map(doc => ({ key: doc.key, value: `${doc.key}/${doc.slug}`, title: `${doc.key}/${doc.slug}` }))
    .sort(thenby(x => x.title));
});

function DocumentSelector({ size, documents, value, by, onChange }) {
  const [filteredOptions, setFilteredOptions] = useState(by === 'key' ? createKeyOptions(documents) : createUrlOptions(documents));

  useEffect(() => {
    setFilteredOptions(by === 'key' ? createKeyOptions(documents) : createUrlOptions(documents));
  }, [documents, by]);

  return (
    <Select
      size={size}
      value={value}
      onChange={onChange}
      optionFilterProp="title"
      style={{ width: '100%' }}
      showSearch
      autoComplete="none"
      >
      {filteredOptions.map(option => (
        <Option key={option.key} value={option.value} title={option.title}>{option.title}</Option>
      ))}
    </Select>
  );
}

DocumentSelector.propTypes = {
  by: PropTypes.oneOf(['key', 'url']),
  documents: PropTypes.arrayOf(PropTypes.oneOfType([
    documentMetadataShape,
    documentShape
  ])).isRequired,
  onChange: PropTypes.func.isRequired,
  size: PropTypes.oneOf(['small', 'middle', 'large']),
  value: PropTypes.string.isRequired
};

DocumentSelector.defaultProps = {
  by: 'key',
  size: 'middle'
};

export default DocumentSelector;
