import by from 'thenby';
import React from 'react';
import { Table } from 'antd';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './language-context.js';

const fakeGetRoomUrl = roomId => `/rooms/${roomId}`;
const getOwnedRooms = user => [
  {
    key: 'dsadasdsa',
    name: 'Room 1',
    createdOn: new Date().toISOString(),
    access: 'public',
    owner: user
  }, {
    name: 'Room 2',
    key: 'dsfdsdsf',
    createdOn: new Date().toISOString(),
    access: 'private',
    owner: user
  }
];

const getMembershipRooms = user => [
  {
    key: 'dsadasdsa',
    name: 'Room 1',
    createdOn: new Date().toISOString(),
    access: 'public',
    owner: {
      username: 'user1',
      email: 'user1@test.com'
    },
    members: [{ userId: user._id, joinedOn: new Date().toISOString() }]
  }, {
    name: 'Room 2',
    key: 'dsfdsdsf',
    createdOn: new Date().toISOString(),
    access: 'private',
    owner: {
      username: 'user2'
    },
    members: [{ userId: user._id, joinedOn: new Date().toISOString() }]
  }
];

function RoomsTab() {
  const user = useUser();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('roomsTab');

  const renderName = (_value, room) => {
    return <a href={fakeGetRoomUrl(room._id)}>{room.name}</a>;
  };

  const renderCreatedOn = (_value, room) => {
    return <span>{formatDate(room.createdOn)}</span>;
  };

  const renderOwner = (_value, room) => {
    return room.owner.email
      ? <span>{room.owner.username} | <a href={`mailto:${room.owner.email}`}>{t('email')}</a></span>
      : <span>{room.owner.username}</span>;
  };

  const renderJoinedOn = (_value, room) => {
    const userAsMember = room.members.find(member => member.userId === user._id);
    return <span>{formatDate(userAsMember.joinedOn)}</span>;
  };

  const renderAccess = (_value, room) => {
    return <span>{t(`accessType_${room.access}`)}</span>;
  };

  const ownedRoomsColumns = [
    {
      title: t('name'),
      dataIndex: 'name',
      key: 'name',
      render: renderName,
      sorter: by(x => x.name)
    },
    {
      title: t('common:createdOn'),
      dataIndex: 'createdOn',
      key: 'createdOn',
      render: renderCreatedOn,
      defaultSortOrder: 'descend',
      sorter: by(x => x.createdOn),
      width: '150px'
    },
    {
      title: t('access'),
      dataIndex: 'access',
      key: 'access',
      render: renderAccess,
      sorter: by(x => x.access),
      width: '150px'
    }
  ];

  const membershipRoomsColumns = [
    {
      title: t('name'),
      dataIndex: 'name',
      key: 'name',
      render: renderName,
      sorter: by(x => x.name)
    },
    {
      title: t('owner'),
      dataIndex: 'owner',
      key: 'owner',
      render: renderOwner,
      defaultSortOrder: 'descend',
      sorter: by(x => x.owner),
      width: '200px'
    },
    {
      title: t('joinedOn'),
      dataIndex: 'joinedOn',
      key: 'joinedOn',
      render: renderJoinedOn,
      defaultSortOrder: 'descend',
      sorter: by(x => x.joinedOn),
      width: '150px'
    },
    {
      title: t('access'),
      dataIndex: 'access',
      key: 'access',
      render: renderAccess,
      sorter: by(x => x.access),
      width: '150px'
    }
  ];

  return (
    <div className="RoomsTab">
      <section>
        <h2 className="RoomsTab-sectionHeader">{t('ownedRoomsHeader')}</h2>
        <Table dataSource={getOwnedRooms(user)} columns={ownedRoomsColumns} size="middle" />
      </section>
      <section>
        <h2 className="RoomsTab-sectionHeader">{t('joinedRoomsHeader')}</h2>
        <Table dataSource={getMembershipRooms(user)} columns={membershipRoomsColumns} size="middle" />
      </section>
    </div>
  );
}

export default RoomsTab;
