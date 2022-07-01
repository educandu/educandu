import by from 'thenby';
import Table from './table.js';
import urls from '../utils/routes.js';
import { Modal, Tooltip } from 'antd';
import Logger from '../common/logger.js';
import { useTranslation } from 'react-i18next';
import SortingSelector from './sorting-selector.js';
import { useDateFormat } from './locale-context.js';
import { FAVORITE_TYPE } from '../domain/constants.js';
import { handleApiError } from '../ui/error-helper.js';
import DeleteIcon from './icons/general/delete-icon.js';
import React, { useEffect, useMemo, useState } from 'react';
import UserApiClient from '../api-clients/user-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';

const logger = new Logger(import.meta.url);

const getTranslatedType = (favorite, t) => {
  switch (favorite.type) {
    case FAVORITE_TYPE.document:
      return t('common:document');
    case FAVORITE_TYPE.room:
      return t('common:room');
    case FAVORITE_TYPE.lesson:
      return t('common:lesson');
    default:
      throw new Error(`Unknown favorite type: ${favorite.type}`);
  }
};

const getDisplayTitle = (favorite, t) => {
  if (favorite.title) {
    return favorite.title;
  }

  switch (favorite.type) {
    case FAVORITE_TYPE.document:
      return `[${t('common:deletedDocument')}]`;
    case FAVORITE_TYPE.room:
      return `[${t('common:deletedRoom')}]`;
    case FAVORITE_TYPE.lesson:
      return `[${t('common:deletedLesson')}]`;
    default:
      throw new Error(`Unknown favorite type: ${favorite.type}`);
  }
};

function FavoritesTab() {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('favoritesTab');
  const [favorites, setFavorites] = useState([]);
  const [displayedRows, setDisplayedRows] = useState([]);
  const userApiClient = useSessionAwareApiClient(UserApiClient);
  const [isInitiallyLoading, setIsInitiallyLoading] = useState(true);
  const [sorting, setSorting] = useState({ value: 'setOn', direction: 'desc' });

  const sortingOptions = useMemo(() => [
    { label: t('setOn'), appliedLabel: t('sortedBySetOn'), value: 'setOn' },
    { label: t('common:title'), appliedLabel: t('common:sortedByTitle'), value: 'displayTitle' },
    { label: t('common:type'), appliedLabel: t('common:sortedByType'), value: 'translatedType' }
  ], [t]);

  const sorters = useMemo(() => ({
    setOn: (rowsToSort, direction) => rowsToSort.sort(by(row => row.setOn, direction)),
    displayTitle: (rowsToSort, direction) => rowsToSort.sort(by(row => row.title, { direction, ignoreCase: true }).thenBy(row => row.setOn, 'desc')),
    translatedType: (rowsToSort, direction) => rowsToSort.sort(by(row => row.translatedType, direction).thenBy(row => row.setOn, 'desc'))
  }), []);

  useEffect(() => {
    const rows = favorites.map(favorite => {
      return {
        id: favorite.id,
        title: favorite.title,
        displayTitle: getDisplayTitle(favorite, t),
        setOn: favorite.setOn,
        type: favorite.type,
        translatedType: getTranslatedType(favorite, t)
      };
    });
    const sorter = sorters[sorting.value];
    setDisplayedRows(sorter?.(rows, sorting.direction) || rows);
  }, [favorites, sorting, sorters, t]);

  useEffect(() => {
    (async () => {
      try {
        setIsInitiallyLoading(true);
        const data = await userApiClient.getFavorites();
        setFavorites(data.favorites);
      } catch (error) {
        handleApiError({ error, logger, t });
      } finally {
        setIsInitiallyLoading(false);
      }
    })();
  }, [userApiClient, t]);

  const handleSortingChange = ({ value, direction }) => setSorting({ value, direction });

  const handleDeleteClick = async favorite => {
    try {
      await userApiClient.removeFavorite({ type: favorite.type, id: favorite.id });
      const data = await userApiClient.getFavorites();
      setFavorites(data.favorites);
    } catch (error) {
      handleApiError({ error, logger, t });
      throw error;
    }
  };

  const handleFavoriteClick = (event, favorite) => {
    if (!favorite.title) {
      event.preventDefault();
      Modal.error({
        title: t('common:error'),
        content: t('targetDeletedMessage')
      });
    }
  };

  const getFavoriteUrl = favorite => {
    switch (favorite.type) {
      case FAVORITE_TYPE.document:
        return urls.getDocUrl({ key: favorite.id });
      case FAVORITE_TYPE.room:
        return urls.getRoomUrl(favorite.id);
      case FAVORITE_TYPE.lesson:
        return urls.getLessonUrl({ id: favorite.id });
      default:
        return null;
    }
  };

  const renderDisplayTitle = (_, favorite) => {
    return (
      <a className="InfoCell" href={getFavoriteUrl(favorite)} onClick={event => handleFavoriteClick(event, favorite)}>
        <div className="InfoCell-mainText">{favorite.displayTitle}</div>
        <div className="InfoCell-subtext">{`${t('set')}: ${formatDate(favorite.setOn)}`}</div>
      </a>
    );
  };

  const renderActions = (_, favorite) => {
    return (
      <div className="FavoritesTab-actions">
        <Tooltip title={t('common:delete')}>
          <a
            className="FavoritesTab-action FavoritesTab-action--delete"
            onClick={() => handleDeleteClick(favorite)}
            >
            <DeleteIcon />
          </a>
        </Tooltip>
      </div>
    );
  };

  const columns = [
    {
      key: 'displayTitle',
      title: t('common:title'),
      dataIndex: 'displayTitle',
      render: renderDisplayTitle
    },
    {
      key: 'translatedType',
      title: t('common:type'),
      dataIndex: 'translatedType',
      render: translatedType => translatedType,
      responsive: ['sm'],
      width: 200
    },
    {
      key: 'actions',
      title: t('common:actions'),
      render: renderActions,
      width: 100
    }
  ];

  return (
    <div className="FavoritesTab">
      <div className="FavoritesTab-sortingSelector">
        <SortingSelector size="large" sorting={sorting} options={sortingOptions} onChange={handleSortingChange} />
      </div>
      <Table dataSource={[...displayedRows]} columns={columns} rowKey="id" loading={isInitiallyLoading} pagination />
    </div>
  );
}

export default FavoritesTab;
