import by from 'thenby';
import Table from './table.js';
import PropTypes from 'prop-types';
import urls from '../utils/routes.js';
import { useTranslation } from 'react-i18next';
import SortingSelector from './sorting-selector.js';
import { useDateFormat } from './locale-context.js';
import { FAVORITE_TYPE } from '../domain/constants.js';
import React, { useEffect, useMemo, useState } from 'react';
import { userFavoritesShape } from '../ui/default-prop-types.js';

function FavoritesTab({ favorites }) {
  const { t } = useTranslation('favoritesTab');
  const { formatDate } = useDateFormat();

  const getTranslatedType = favorite => {
    switch (favorite.type) {
      case FAVORITE_TYPE.document:
        return t('common:document');
      case FAVORITE_TYPE.room:
        return t('common:room');
      case FAVORITE_TYPE.lesson:
        return t('common:lesson');
      default:
        return null;
    }
  };

  const initialRows = favorites.map(favorite => {
    return {
      id: favorite.id,
      title: favorite.title,
      setOn: favorite.setOn,
      type: favorite.type,
      typeTranslated: getTranslatedType(favorite)
    };
  });

  const [displayedRows, setDisplayedRows] = useState(initialRows);
  const [sorting, setSorting] = useState({ value: 'setOn', direction: 'desc' });

  const sortingOptions = [
    { label: t('setOn'), appliedLabel: t('sortedBySetOn'), value: 'setOn' },
    { label: t('common:title'), appliedLabel: t('common:sortedByTitle'), value: 'title' },
    { label: t('common:type'), appliedLabel: t('common:sortedByType'), value: 'type' }
  ];

  const sorters = useMemo(() => ({
    title: rowsToSort => rowsToSort.sort(by(row => row.title, { direction: sorting.direction, ignoreCase: true }).thenBy(row => row.setOn, 'desc')),
    setOn: rowsToSort => rowsToSort.sort(by(row => row.setOn, sorting.direction)),
    type: rowsToSort => rowsToSort.sort(by(row => row.typeTranslated, sorting.direction).thenBy(row => row.setOn, 'desc'))
  }), [sorting.direction]);

  useEffect(() => {
    const sorter = sorters[sorting.value];
    setDisplayedRows(oldDisplayedRows => sorter ? sorter(oldDisplayedRows.slice()) : oldDisplayedRows.slice());
  }, [sorting, sorters]);

  const handleSortingChange = ({ value, direction }) => setSorting({ value, direction });

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

  const renderTitle = (title, favorite) => {
    return (
      <a className="InfoCell" href={getFavoriteUrl(favorite)}>
        <div className="InfoCell-mainText">{title}</div>
        <div className="InfoCell-subtext">{`${t('set')}: ${formatDate(favorite.setOn)}`}</div>
      </a>
    );
  };

  const columns = [
    {
      key: 'title',
      title: t('common:title'),
      dataIndex: 'title',
      render: renderTitle
    },
    {
      key: 'typeTranslated',
      title: t('common:type'),
      dataIndex: 'typeTranslated',
      render: typeTranslated => typeTranslated,
      responsive: ['sm'],
      width: 200
    }
  ];

  return (
    <div className="FavoritesTab">
      <div className="FavoritesTab-info">{t('info')}</div>
      <div className="FavoritesTab-sortingSelector">
        <SortingSelector size="large" sorting={sorting} options={sortingOptions} onChange={handleSortingChange} />
      </div>
      <Table dataSource={[...displayedRows]} columns={columns} rowKey="id" pagination />
    </div>
  );
}

FavoritesTab.propTypes = {
  favorites: PropTypes.arrayOf(userFavoritesShape).isRequired
};

export default FavoritesTab;
