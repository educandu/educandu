import by from 'thenby';
import Tag from '../tag.js';
import PropTypes from 'prop-types';
import { Table, Select } from 'antd';
import urls from '../../utils/urls.js';
import SearchBar from '../search-bar.js';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import React, { useEffect, useState } from 'react';
import { useDateFormat } from '../locale-context.js';
import { handleApiError } from '../../ui/error-helper.js';
import LanguageIcon from '../localization/language-icon.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import { MenuOutlined, SearchOutlined } from '@ant-design/icons';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import SearchApiClient from '../../api-clients/search-api-client.js';
import { ensureIsExcluded, ensureIsIncluded } from '../../utils/array-utils.js';

const logger = new Logger(import.meta.url);
function Search({ PageTemplate }) {
  const request = useRequest();
  const { t } = useTranslation('search');
  const { formatDate } = useDateFormat();

  const sortingOptions = [
    { label: `${t('sorting')}: ${t('relevance')}`, value: 'relevance' },
    { label: `${t('sorting')}: ${t('common:title')}`, value: 'title' },
    { label: `${t('sorting')}: ${t('common:language')}`, value: 'language' },
    { label: `${t('sorting')}: ${t('common:createdOn')}`, value: 'createdOn' },
    { label: `${t('sorting')}: ${t('common:updatedOn')}`, value: 'updatedOn' }
  ];

  const sortByRelevance = docsToSort => docsToSort.sort(by(doc => doc.tagMatchCount, 'desc').thenBy(doc => doc.updatedOn, 'desc'));
  const sortByTitle = docsToSort => docsToSort.sort(by(doc => doc.title, 'asc').thenBy(doc => doc.updatedOn, 'desc'));
  const sortByLanguage = docsToSort => docsToSort.sort(by(doc => doc.language, 'asc').thenBy(doc => doc.updatedOn, 'desc'));
  const sortByCreatedOn = docsToSort => docsToSort.sort(by(doc => doc.createdOn, 'desc'));
  const sortByUpdatedOn = docsToSort => docsToSort.sort(by(doc => doc.updatedOn, 'desc'));

  const [docs, setDocs] = useState([]);
  const [displayedDocs, setDisplayedDocs] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSearching, setIsSearching] = useState(true);
  const [searchText, setSearchText] = useState(request.query.query);
  const [sorting, setSorting] = useState(sortingOptions[0].value);
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
    const filteredDocs = docs.filter(doc => selectedTags.every(selectedTag => doc.tags.some(tag => tag.toLowerCase() === selectedTag)));
    setDisplayedDocs(sortByRelevance(filteredDocs));
  }, [docs, selectedTags]);

  const handleSelectTag = tag => setSelectedTags(ensureIsIncluded(selectedTags, tag));
  const handleDeselectTag = tag => setSelectedTags(ensureIsExcluded(selectedTags, tag));
  const handleDeselectTagsClick = () => setSelectedTags([]);
  const handleSelectSorting = sortingValue => {
    setSorting(sortingValue);
    switch (sortingValue) {
      case 'relevance':
        setDisplayedDocs(sortByRelevance(displayedDocs));
        break;
      case 'title':
        setDisplayedDocs(sortByTitle(displayedDocs));
        break;
      case 'language':
        setDisplayedDocs(sortByLanguage(displayedDocs));
        break;
      case 'createdOn':
        setDisplayedDocs(sortByCreatedOn(displayedDocs));
        break;
      case 'updatedOn':
        setDisplayedDocs(sortByUpdatedOn(displayedDocs));
        break;
      default:
        break;
    }
  };

  const renderUpdatedOn = updatedOn => (<span>{formatDate(updatedOn)}</span>);
  const renderTitle = (title, doc) => (<a href={urls.getDocUrl({ key: doc.key, slug: doc.slug })}>{title}</a>);
  const renderLanguage = lang => (<LanguageIcon language={lang} />);
  const renderCellTags = tags => (
    <div className="SearchPage-cellTags">
      {tags.map(tag => (<Tag key={tag} value={tag} />))}
    </div>
  );
  const renderSelectedTags = () => selectedTags.map(tag => (
    <Tag key={tag} value={tag} isSelected onDeselect={() => handleDeselectTag(tag)} />
  ));

  const columns = [
    {
      title: t('common:title'),
      dataIndex: 'title',
      key: 'title',
      render: renderTitle
    },
    {
      title: t('common:tags'),
      dataIndex: 'tags',
      render: renderCellTags,
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
        <div className="SearchPage-headline">
          <h1>{t('headline', { count: displayedDocs.length })}</h1>
        </div>
        <div className="SearchPage-controls">
          <SearchBar initialValue={searchText} onSearch={setSearchText} />
          <Select
            showArrow
            showSearch
            size="large"
            value={null}
            options={tagOptions}
            onChange={handleSelectTag}
            placeholder={(
              <span className="SearchPage-filterPlaceholder">
                <span>{`${t('filterPlaceholder')} (${selectedTags.length})`}</span>
                <SearchOutlined className="SearchPage-filterPlaceholderIcon" />
              </span>
            )}
            suffixIcon={<MenuOutlined />}
            />
          <Select
            size="large"
            value={sorting}
            options={sortingOptions}
            onChange={handleSelectSorting}
            showArrow
            />
        </div>
        <div className="SearchPage-selectedTags">
          {renderSelectedTags()}
          {selectedTags.length > 1 && <a className="SearchPage-deselectTagsLink" onClick={handleDeselectTagsClick}>x {t('deselectTags')}</a>}
        </div>
        <Table
          bordered={false}
          pagination={false}
          size="middle"
          columns={columns}
          dataSource={[...displayedDocs]}
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
