import by from 'thenby';
import Table from './table.js';
import PropTypes from 'prop-types';
import urls from '../utils/urls.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import SortingSelector from './sorting-selector.js';
import { useDateFormat } from './locale-context.js';
import { FAVORITE_TYPE } from '../domain/constants.js';
import { userFavoritesShape } from '../ui/default-prop-types.js';

function FavoritesTab({ favorites }) {
  const { t } = useTranslation('');
  const { formatDate } = useDateFormat();

  const sortingOptions = [
    { label: t('common:setOn'), appliedLabel: t('common:sortedBySetOn'), value: 'setOn' },
    { label: t('common:title'), appliedLabel: t('common:sortedByTitle'), value: 'title' },
    { label: t('common:type'), appliedLabel: t('common:sortedByType'), value: 'type' }
  ];

  const sortBySetOn = (items, direction) => items.sort(by(item => item.setOn, direction));
  const sortByTitle = (items, direction) => items.sort(by(item => item.title, { direction, ignoreCase: true }).thenBy(item => item.setOn, 'desc'));
  const sortByType = (items, direction) => items.sort(by(item => item.type, direction).thenBy(item => item.setOn, 'desc'));

  const [tableRows, setTableRows] = useState([]);
  const [sorting, setSorting] = useState({ value: 'setOn', direction: 'desc' });

  useEffect(() => {
    switch (sorting.value) {
      case 'setOn':
        setTableRows(sortBySetOn(favorites, sorting.direction));
        return;
      case 'title':
        setTableRows(sortByTitle(favorites, sorting.direction));
        break;
      case 'type':
        setTableRows(sortByType(favorites, sorting.direction));
        break;
      default:
        break;
    }
  }, [favorites, sorting]);

  const handleSortingChange = ({ value, direction }) => setSorting({ value, direction });

  const renderSetOn = setOn => (<span>{formatDate(setOn)}</span>);

  const renderTitle = (title, favorite) => {
    switch (favorite.type) {
      case FAVORITE_TYPE.document:
        return <a href={urls.getDocUrl({ key: favorite.id })}>{title}</a>;
      case FAVORITE_TYPE.room:
        return <a href={urls.getRoomUrl(favorite.id)}>{title}</a>;
      case FAVORITE_TYPE.lesson:
        return <a href={urls.getLessonUrl({ id: favorite.id })}>{title}</a>;
      default:
        return null;
    }
  };

  const renderType = (type, favorite) => {
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

  const columns = [
    {
      key: 'setOn',
      title: t('common:setOn'),
      dataIndex: 'setOn',
      render: renderSetOn,
      responsive: ['lg'],
      width: 200
    },
    {
      key: 'title',
      title: t('common:title'),
      dataIndex: 'title',
      render: renderTitle
    },
    {
      key: 'type',
      title: t('common:type'),
      dataIndex: 'type',
      render: renderType,
      responsive: ['md'],
      width: 150
    }
  ];

  return (
    <div className="FavoritesTab">
      <div className="FavoritesTab-sortingSelector">
        <SortingSelector sorting={sorting} options={sortingOptions} onChange={handleSortingChange} />
      </div>
      <Table dataSource={[...tableRows]} columns={columns} rowKey="id" pagination />
    </div>
  );
}

FavoritesTab.propTypes = {
  favorites: PropTypes.arrayOf(userFavoritesShape).isRequired
};

export default FavoritesTab;
