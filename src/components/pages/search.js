import firstBy from 'thenby';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import { useTranslation } from 'react-i18next';
import { Table, Tag, Select, Form } from 'antd';
import React, { useMemo, useState } from 'react';
import { useRequest } from '../request-context.js';
import { SearchOutlined } from '@ant-design/icons';
import { useService } from '../container-context.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import { searchResultShape } from '../../ui/default-prop-types.js';
import { useDateFormat, useLanguage } from '../language-context.js';
import LanguageNameProvider from '../../data/language-name-provider.js';
import CountryFlagAndName from '../localization/country-flag-and-name.js';

function Search({ initialState, PageTemplate }) {
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
        tags: [...new Set(doc.tags)], // Some docs have duplicate tags we don't want to render
        tagsSet: new Set(doc.tags.map(tag => tag.toLowerCase()))
      }))
      .sort(firstBy(doc => doc.tagMatchCount, 'desc').thenBy(doc => doc.updatedOn, 'desc')),
    [docs]
  );

  const [selectedTags, setSelectedTags] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState(sortedDocs);

  const allTags = docs.map(doc => doc.tags).flat().map(tag => tag.toLowerCase());
  const allUniqueTags = [...new Set(allTags)];
  const tagOptions = allUniqueTags.map(tag => ({ value: tag, key: tag }));

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

  const renderTags = tags => tags.map(tag => (<Tag key={tag}>{tag}</Tag>));

  const renderLanguage = lang => <CountryFlagAndName code={languageData[lang]?.flag} name={languageData[lang]?.name || lang} />;

  const searchPlaceholder = () => (
    <div className="Search-placeholderContainer">
      {t('refineSearch')}
      <SearchOutlined className="Search-placeholderContainerIcon" />
    </div>
  );

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

  const alerts = useGlobalAlerts();

  return (
    <PageTemplate alerts={alerts}>
      <h1>{`${t('searchResultPrefix')}: ${query.query}`} </h1>

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

    </PageTemplate>
  );
}

Search.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    docs: PropTypes.arrayOf(searchResultShape)
  }).isRequired
};

export default Search;
