import by from 'thenby';
import React from 'react';
import { Table } from 'antd';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './language-context.js';

const fakeGetRoomUrl = roomId => `/rooms/${roomId}`;
const getOwnedRooms = user => [
  {
    _id: '_room1.1',
    name: 'Room 1',
    createdOn: new Date().toISOString(),
    access: 'public',
    owner: user
  }, {
    _id: '_room1.2',
    name: 'Room 2',
    createdOn: new Date().toISOString(),
    access: 'private',
    owner: user
  }
];

const getMembershipRooms = user => [
  {
    _id: '_room2.1',
    name: 'Room 1',
    createdOn: new Date().toISOString(),
    access: 'public',
    owner: {
      username: 'user1',
      email: 'user1@test.com'
    },
    members: [{ userId: user._id, joinedOn: new Date().toISOString() }]
  }, {
    _id: '_room2.2',
    name: 'Room 2',
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

  const renderName = (name, room) => {
    return <a href={fakeGetRoomUrl(room._id)}>{name}</a>;
  };

  const renderCreatedOn = createdOn => {
    return <span>{formatDate(createdOn)}</span>;
  };

  const renderOwner = owner => {
    return owner.email
      ? <span>{owner.username} | <a href={`mailto:${owner.email}`}>{t('owner')}</a></span>
      : <span>{owner.username}</span>;
  };

  const renderJoinedOn = joinedOn => {
    return <span>{formatDate(joinedOn)}</span>;
  };

  const renderAccess = access => {
    return <span>{t(`accessType_${access}`)}</span>;
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

  const ownerRoomsRows = getOwnedRooms(user).map(room => ({
    key: room._id,
    name: room.name,
    createdOn: room.createdOn,
    access: room.access
  }));

  const membershipRoomsRows = getMembershipRooms(user).map(room => {
    const userAsMember = room.members.find(member => member.userId === user._id);
    const joinedOn = userAsMember.joinedOn;

    return {
      key: room._id,
      name: room.name,
      owner: room.owner,
      joinedOn,
      access: room.access
    };
  });

  return (
    <div className="RoomsTab">
      <section>
        <h2 className="RoomsTab-sectionHeader">{t('ownedRoomsHeader')}</h2>
        <Table dataSource={ownerRoomsRows} columns={ownedRoomsColumns} size="middle" />
      </section>
      <section>
        <h2 className="RoomsTab-sectionHeader">{t('joinedRoomsHeader')}</h2>
        <Table dataSource={membershipRoomsRows} columns={membershipRoomsColumns} size="middle" />
      </section>
    </div>
  );
}

export default RoomsTab;
