import React, { useMemo, useState } from 'react';
import Page from '../page.js';
import PropTypes from 'prop-types';
import moment from 'moment';
import firstBy from 'thenby';
import { SearchOutlined } from '@ant-design/icons';
import { Table, Tag, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { searchResultShape } from '../../ui/default-prop-types.js';
import { useLanguage } from '../language-context.js';
import { useRequest } from '../request-context.js';
import urls from '../../utils/urls.js';

function Search({ initialState }) {
  const { t } = useTranslation('search');
  const { locale } = useLanguage();
  const { docs } = initialState;
  const { query } = useRequest();

  const sortedDocs = useMemo(
    () => docs
      .map(doc => ({
        ...doc,
        tagsSet: new Set(doc.tags)
      }))
      .sort(firstBy(doc => doc.contributors)
        .thenBy(doc => doc.updatedOn, 'desc')),
    [docs]
  );

  const [filteredDocs, setFilteredDocs] = useState([...sortedDocs]);

  const [selectedTags, setSelectedTags] = useState([]);

  const allTags = docs.reduce((acc, doc) => {
    doc.tags.forEach(tag => acc.add(tag));
    return acc;
  }, new Set());

  const handleTagsChanged = selectedValues => {
    const newFilteredDocs = sortedDocs
      .filter(doc => selectedValues.every(tag => doc.tagsSet.has(tag)));

    setFilteredDocs(newFilteredDocs);
    setSelectedTags(selectedValues);
  };

  const renderContributorsCount = value => (<div>{value?.length}</div>);

  const renderUpdatedOn = (_value, doc) => {
    const date = moment(doc.updatedOn).locale(locale);
    return <span>{date.format('L, LT')}</span>;
  };

  const renderTitle = (title, doc) => {
    const url = urls.getArticleUrl(doc.slug);
    return <a href={url}>{title}</a>;
  };

  const searchPlaceholder = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      {t('refineSearch')}
      <SearchOutlined style={{ alignSelf: 'center' }} />
    </div>);

  const columns = [
    {
      title: t('title'),
      dataIndex: 'title',
      key: 'title',
      render: renderTitle
    },
    {
      title: t('numberOfContributors'),
      dataIndex: 'contributors',
      render: renderContributorsCount
    },
    {
      title: t('tags'),
      dataIndex: 'tags',
      render: (tags, doc) => tags.map(tag => (<Tag key={`${doc.key}_${tag}`}>{tag}</Tag>))
    },
    {
      title: t('udateDate'),
      dataIndex: 'updatedOn',
      render: renderUpdatedOn
    }
  ];

  return (
    <Page headerActions={[]}>
      <div className="Search-headerContainer">
        <span>{`${t('searchResultPrefix')}: ${urls.decodeUrl(query.query)}`} </span>
      </div>

      <Select
        mode="multiple"
        tokenSeparators={[' ']}
        value={selectedTags}
        style={{ width: '100%', marginBottom: '16px' }}
        onChange={selectedValues => handleTagsChanged(selectedValues)}
        placeholder={searchPlaceholder()}
        options={Array.from(allTags).map(tag => ({ value: tag, key: tag }))}
        />

      <Table
        bordered={false}
        pagination={false}
        size="middle"
        columns={columns}
        dataSource={filteredDocs}
        />

    </Page>
  );
}

Search.propTypes = {
  initialState: PropTypes.shape({
    docs: PropTypes.arrayOf(searchResultShape)
  }).isRequired
};

export default Search;
