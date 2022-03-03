import firstBy from 'thenby';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import SearchBar from '../search-bar.js';
import { Table, Tag, Select } from 'antd';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import { SearchOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { useDateFormat } from '../locale-context.js';
import { handleApiError } from '../../ui/error-helper.js';
import LanguageIcon from '../localization/language-icon.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import SearchApiClient from '../../api-clients/search-api-client.js';

const logger = new Logger(import.meta.url);
function Search({ PageTemplate }) {
  const request = useRequest();
  const { t } = useTranslation('search');
  const { formatDate } = useDateFormat();

  const [docs, setDocs] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSearching, setIsSearching] = useState(true);
  const [searchText, setSearchText] = useState(request.query.query);
  const searchApiClient = useSessionAwareApiClient(SearchApiClient);

  useEffect(() => {
    (async () => {
      setIsSearching(true);
      try {
        history.replaceState(null, '', urls.getSearchUrl(searchText));
        const { result } = await searchApiClient.search(searchText);
        setDocs(result);
      } catch (error) {
        handleApiError({ error, logger, t });
      } finally {
        setIsSearching(false);
      }
    })();
  }, [searchText, searchApiClient, t]);

  useEffect(() => {
    const allTags = docs.map(doc => doc.tags).flat().map(tag => tag.toLowerCase());
    const allUniqueTags = [...new Set(allTags)];
    const newTagOptions = allUniqueTags.map(tag => ({ value: tag, key: tag }));

    setTagOptions(newTagOptions);
  }, [docs]);

  useEffect(() => {
    const newFilteredDocs = docs
      .filter(doc => selectedTags.every(selectedTag => doc.tags.some(docTag => docTag.toLowerCase() === selectedTag)))
      .sort(firstBy(doc => doc.tagMatchCount, 'desc').thenBy(doc => doc.updatedOn, 'desc'));

    setFilteredDocs(newFilteredDocs);
  }, [docs, selectedTags]);

  const renderUpdatedOn = updatedOn => (<span>{formatDate(updatedOn)}</span>);
  const renderTitle = (title, doc) => (<a href={urls.getDocUrl({ key: doc.key, slug: doc.slug })}>{title}</a>);
  const renderTags = tags => tags.map(tag => (<Tag key={tag}>{tag}</Tag>));
  const renderLanguage = lang => (<LanguageIcon language={lang} />);

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
      render: renderTags,
      responsive: ['md']
    },
    {
      title: t('common:updatedOn'),
      dataIndex: 'updatedOn',
      render: renderUpdatedOn,
      responsive: ['lg']
    },
    {
      title: t('common:language'),
      dataIndex: 'language',
      render: renderLanguage
    }
  ];

  const alerts = useGlobalAlerts();

  return (
    <PageTemplate alerts={alerts}>
      <div className="SearchPage">
        <div className="SearchPage-header">
          <h1>{`${t('searchResultPrefix')}: ${searchText}`} </h1>
        </div>
        <div className="SearchPage-controls">
          <SearchBar initialValue={searchText} onSearch={setSearchText} />
          <Select
            className="SearchPage-filter"
            size="large"
            mode="multiple"
            tokenSeparators={[' ']}
            value={selectedTags}
            onChange={setSelectedTags}
            options={tagOptions}
            placeholder={(
              <span className="SearchPage-filterPlaceholder">
                <span>{t('refineSearch')}</span>
                <SearchOutlined className="SearchPage-filterPlaceholderIcon" />
              </span>
            )}
            />
        </div>
        <div className="SearchPage-tags">
          some tags
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
  PageTemplate: PropTypes.func.isRequired
};

export default Search;
