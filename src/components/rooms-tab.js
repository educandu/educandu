import by from 'thenby';
import { Button } from 'antd';
import Table from './table.js';
import PropTypes from 'prop-types';
import urls from '../utils/urls.js';
import Restricted from './restricted.js';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import permissions from '../domain/permissions.js';
import SortingSelector from './sorting-selector.js';
import { useDateFormat } from './locale-context.js';
import PublicIcon from './icons/general/public-icon.js';
import { roomShape } from '../ui/default-prop-types.js';
import RoomCreationModal from './room-creation-modal.js';
import PrivateIcon from './icons/general/private-icon.js';
import { ROOM_ACCESS_LEVEL } from '../domain/constants.js';
import React, { useEffect, useMemo, useState } from 'react';

function RoomsTab({ rooms }) {
  const user = useUser();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('roomsTab');

  const initialRows = rooms.map(room => {
    const userAsMember = room.members.find(member => member.userId === user._id);
    return {
      _id: room._id,
      key: room._id,
      name: room.name,
      slug: room.slug,
      owner: room.owner,
      access: room.access,
      accessTranslated: t(`common:accessType_${room.access}`),
      createdOn: room.createdOn,
      updatedOn: room.updatedOn,
      joinedOn: userAsMember?.joinedOn || '',
      roleTranslated: userAsMember ? t('member') : t('common:owner')
    };
  });

  const [displayedRows, setDisplayedRows] = useState(initialRows);
  const [sorting, setSorting] = useState({ value: 'role', direction: 'desc' });
  const [isRoomCreationModalVisible, setIsRoomCreationModalVisible] = useState(false);

  const sortingOptions = [
    { label: t('common:name'), appliedLabel: t('common:sortedByName'), value: 'name' },
    { label: t('common:createdOn'), appliedLabel: t('common:sortedByCreatedOn'), value: 'createdOn' },
    { label: t('common:owner'), appliedLabel: t('sortedByOwner'), value: 'owner' },
    { label: t('common:access'), appliedLabel: t('sortedByAccess'), value: 'access' },
    { label: t('role'), appliedLabel: t('sortedByRole'), value: 'role' }
  ];

  const sorters = useMemo(() => ({
    name: rowsToSort => rowsToSort.sort(by(row => row.name, { direction: sorting.direction, ignoreCase: true })),
    createdOn: rowsToSort => rowsToSort.sort(by(row => row.createdOn, sorting.direction)),
    owner: rowsToSort => rowsToSort.sort(by(row => row.owner.username, sorting.direction)),
    access: rowsToSort => rowsToSort.sort(by(row => row.access, sorting.direction)),
    role: rowsToSort => rowsToSort.sort(by(row => row.roleTranslated, sorting.direction).thenBy(row => row.joinedOn, 'desc').thenBy(row => row.createdOn, 'desc'))
  }), [sorting.direction]);

  useEffect(() => {
    const sorter = sorters[sorting.value];
    setDisplayedRows(oldDisplayedRows => sorter ? sorter(oldDisplayedRows.slice()) : oldDisplayedRows.slice());
  }, [sorting, sorters]);

  const renderName = (name, room) => {
    const dates = [`${t('common:created')}: ${formatDate(room.createdOn)}`];
    if (room.joinedOn) {
      dates.push([`${t('joined')}: ${formatDate(room.joinedOn)}`]);
    }

    return (
      <a className="InfoCell" href={urls.getRoomUrl(room._id, room.slug)}>
        <div className="InfoCell-mainText">{name}</div>
        <div className="InfoCell-subtext">{dates.join(' | ')}</div>
      </a>
    );
  };

  const renderOwner = owner => {
    return owner.email
      ? <span>{owner.username} | <a href={`mailto:${owner.email}`}>{t('common:email')}</a></span>
      : <span>{owner.username}</span>;
  };

  const renderAccess = (accessTranslated, row) => {
    return (
      <div className="RoomsTab-accessCell">
        {row.access === ROOM_ACCESS_LEVEL.private && <PrivateIcon />}
        {row.access === ROOM_ACCESS_LEVEL.public && <PublicIcon />}
        <span>{accessTranslated}</span>
      </div>
    );
  };

  const handleCreateRoomClick = () => {
    setIsRoomCreationModalVisible(true);
  };

  const handleRoomCreationModalClose = () => {
    setIsRoomCreationModalVisible(false);
  };

  const handleSortingChange = ({ value, direction }) => setSorting({ value, direction });

  const columns = [
    {
      title: t('common:name'),
      dataIndex: 'name',
      render: renderName
    },
    {
      title: t('common:owner'),
      dataIndex: 'owner',
      key: 'owner',
      render: renderOwner,
      width: '200px',
      responsive: ['md']
    },
    {
      title: t('common:access'),
      dataIndex: 'accessTranslated',
      key: 'accessTranslated',
      render: renderAccess,
      width: '150px',
      responsive: ['sm']
    },
    {
      title: t('role'),
      dataIndex: 'roleTranslated',
      key: 'roleTranslated',
      render: roleTranslated => roleTranslated,
      width: '100px'
    }
  ];

  return (
    <div className="RoomsTab">
      <div className="RoomsTab-sortingSelector" >
        <SortingSelector size="large" sorting={sorting} options={sortingOptions} onChange={handleSortingChange} />
      </div>
      <Table dataSource={[...displayedRows]} columns={columns} pagination />
      <Restricted to={permissions.OWN_ROOMS}>
        <Button
          size="large"
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
          onClick={handleCreateRoomClick}
          className="RoomsTab-createRoomButton"
          />
      </Restricted>
      <RoomCreationModal isVisible={isRoomCreationModalVisible} onClose={handleRoomCreationModalClose} />
    </div>
  );
}

RoomsTab.defaultProps = {
  rooms: []
};

RoomsTab.propTypes = {
  rooms: PropTypes.arrayOf(roomShape)
};

export default RoomsTab;
