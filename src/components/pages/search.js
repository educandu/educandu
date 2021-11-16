import React, { useMemo, useState } from 'react';
import Page from '../page.js';
import PropTypes from 'prop-types';
import firstBy from 'thenby';
import { SearchOutlined } from '@ant-design/icons';
import { Table, Tag, Select, Form } from 'antd';
import { useTranslation } from 'react-i18next';
import { searchResultShape } from '../../ui/default-prop-types.js';
import { useRequest } from '../request-context.js';
import urls from '../../utils/urls.js';
import { useService } from '../container-context.js';
import LanguageNameProvider from '../../data/language-name-provider.js';
import CountryFlagAndName from '../localization/country-flag-and-name.js';
import { useDateFormat, useLanguage } from '../language-context.js';

function Search({ initialState }) {
  const { t } = useTranslation('search');
  const { language } = useLanguage();
  const { docs } = initialState;
  const { query } = useRequest();
  const languageNameProvider = useService(LanguageNameProvider);
  const languageData = languageNameProvider.getData(language);
  const { formatDate } = useDateFormat();

  const sortedDocs = useMemo(
    () => docs
      .map(doc => ({
        ...doc,
        tagsSet: new Set(doc.tags)
      }))
      .sort(firstBy(doc => doc.tagMatchCount, 'desc')
        .thenBy(doc => doc.updatedOn, 'desc')),
    [docs]
  );

  const [filteredDocs, setFilteredDocs] = useState([...sortedDocs]);

  const [selectedTags, setSelectedTags] = useState([]);

  const allTags = docs.reduce((acc, doc) => {
    doc.tags.forEach(tag => acc.add(tag));
    return acc;
  }, new Set());

  const tagOptions = Array.from(allTags).map(tag => ({ value: tag, key: tag }));

  const handleTagsChanged = selectedValues => {
    const newFilteredDocs = sortedDocs
      .filter(doc => selectedValues.every(tag => doc.tagsSet.has(tag)));

    setFilteredDocs(newFilteredDocs);
    setSelectedTags(selectedValues);
  };

  const renderUpdatedOn = (_value, doc) => {
    const date = formatDate(doc.updatedOn);
    return <span>{date}</span>;
  };

  const renderTitle = (title, doc) => {
    const url = urls.getArticleUrl(doc.slug);
    return <a href={url}>{title}</a>;
  };

  const renderTags = (tags, doc) => tags.map(tag => (<Tag key={`${doc.key}_${tag}`}>{tag}</Tag>));

  const renderLanguage = lang => <CountryFlagAndName code={languageData[lang]?.flag} name={languageData[lang]?.name || lang} />;

  const searchPlaceholder = () => (
    <div className="Search-placeholderContainer">
      {t('refineSearch')}
      <SearchOutlined className="Search-placeholderContainerIcon" />
    </div>);

  const columns = [
    {
      title: t('title'),
      dataIndex: 'title',
      key: 'title',
      render: renderTitle
    },
    {
      title: t('tags'),
      dataIndex: 'tags',
      render: renderTags
    },
    {
      title: t('updateDate'),
      dataIndex: 'updatedOn',
      render: renderUpdatedOn
    },
    {
      title: t('language'),
      className: 'Search-searchTableLanguageColumn',
      dataIndex: 'language',
      render: renderLanguage
    }
  ];

  return (
    <Page headerActions={[]}>
      <h1>{`${t('searchResultPrefix')}: ${urls.decodeUrl(query.query)}`} </h1>

      <div className="Search-searchSelectContainer">
        <Form.Item label={t('refineSearch')} >
          <Select
            mode="multiple"
            tokenSeparators={[' ']}
            value={selectedTags}
            onChange={selectedValues => handleTagsChanged(selectedValues)}
            placeholder={searchPlaceholder()}
            options={tagOptions}
            />
        </Form.Item>
      </div>

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
