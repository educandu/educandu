import firstBy from 'thenby';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import SearchBar from '../search-bar.js';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { Table, Tag, Select, Form } from 'antd';
import { useRequest } from '../request-context.js';
import { SearchOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { useDateFormat } from '../language-context.js';
import { handleApiError } from '../../ui/error-helper.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import LanguageFlagAndName from '../language-flag-and-name.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { searchResultShape } from '../../ui/default-prop-types.js';
import SearchApiClient from '../../api-clients/search-api-client.js';

function sortDocs(docs) {
  return docs
    .map(doc => ({
      ...doc,
      tags: [...new Set(doc.tags)], // Some docs have duplicate tags we don't want to render
      tagsSet: new Set(doc.tags.map(tag => tag.toLowerCase()))
    }))
    .sort(firstBy(doc => doc.tagMatchCount, 'desc').thenBy(doc => doc.updatedOn, 'desc'));
}

const logger = new Logger(import.meta.url);
function Search({ PageTemplate }) {
  const request = useRequest();
  const { t } = useTranslation('search');
  const { formatDate } = useDateFormat();

  const [docs, setDocs] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [isSearching, setIsSearching] = useState(true);
  const [searchText, setSearchText] = useState(request.query.query);
  const searchApiClient = useSessionAwareApiClient(SearchApiClient);

  useEffect(() => {
    (async () => {
      setIsSearching(true);
      try {
        history.replaceState(null, '', urls.getSearchUrl(searchText));
        const { result } = await searchApiClient.search(searchText);
        setDocs(sortDocs(result));
      } catch (error) {
        handleApiError({ error, logger, t });
      } finally {
        setIsSearching(false);
      }
    })();
  }, [searchText, searchApiClient, t]);

  useEffect(() => {
    setFilteredDocs(docs.filter(doc => selectedTags.every(tag => doc.tagsSet.has(tag))));
  }, [docs, selectedTags]);

  const allTags = docs.map(doc => doc.tags).flat().map(tag => tag.toLowerCase());
  const allUniqueTags = [...new Set(allTags)];
  const tagOptions = allUniqueTags.map(tag => ({ value: tag, key: tag }));

  const renderUpdatedOn = updatedOn => {
    return <span>{formatDate(updatedOn)}</span>;
  };

  const renderTitle = (title, doc) => {
    const url = urls.getDocUrl(doc.key, doc.slug);
    return <a href={url}>{title}</a>;
  };

  const renderTags = tags => tags.map(tag => (<Tag key={tag}>{tag}</Tag>));

  const renderLanguage = lang => (<LanguageFlagAndName language={lang} />);

  const searchPlaceholder = () => (
    <div className="SearchPage-placeholderContainer">
      {t('refineSearch')}
      <SearchOutlined className="SearchPage-placeholderContainerIcon" />
    </div>
  );

  const columns = [
    {
      title: t('common:title'),
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
      title: t('common:updatedOn'),
      dataIndex: 'updatedOn',
      render: renderUpdatedOn
    },
    {
      title: t('common:language'),
      className: 'SearchPage-searchTableLanguageColumn',
      dataIndex: 'language',
      render: renderLanguage
    }
  ];

  const alerts = useGlobalAlerts();

  return (
    <PageTemplate alerts={alerts}>
      <div className="SearchPage">
        <div className="SearchPage-searchHeader">
          <SearchBar initialValue={searchText} onSearch={setSearchText} />
        </div>

        <h1>{`${t('searchResultPrefix')}: ${searchText}`} </h1>

        <div className="SearchPage-searchSelectContainer">
          <Form.Item label={t('refineSearch')} >
            <Select
              mode="multiple"
              tokenSeparators={[' ']}
              value={selectedTags}
              onChange={setSelectedTags}
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
          loading={isSearching}
          />
      </div>
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
