import by from 'thenby';
import PropTypes from 'prop-types';
import urls from '../utils/urls.js';
import { Button, Table } from 'antd';
import React, { useState } from 'react';
import Restricted from './restricted.js';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import permissions from '../domain/permissions.js';
import { useDateFormat } from './language-context.js';
import { roomShape } from '../ui/default-prop-types.js';
import { ROOM_ACCESS_LEVEL } from '../common/constants.js';

function RoomsTab({ rooms }) {
  const user = useUser();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('roomsTab');
  const [setState] = useState({
    isNewRoomModalVisible: false,
    newRoom: null
  });

  const renderName = (name, room) => {
    return <a href={urls.getRoomUrl(room._id)}>{name}</a>;
  };

  const renderCreatedOn = createdOn => {
    return <span>{formatDate(createdOn)}</span>;
  };

  const renderOwner = owner => {
    return owner.email
      ? <span>{owner.username} | <a href={`mailto:${owner.email}`}>{t('common:email')}</a></span>
      : <span>{owner.username}</span>;
  };

  const renderJoinedOn = joinedOn => {
    return <span>{formatDate(joinedOn)}</span>;
  };

  const renderAccess = access => {
    return <span>{t(`accessType_${access}`)}</span>;
  };

  const createNewRoomState = () => {
    return {
      name: t('defaultRoomName'),
      access: ROOM_ACCESS_LEVEL.private
    };
  };

  const handleNewRoomClick = () => {
    setState({
      newRoom: createNewRoomState(),
      isNewDocModalVisible: true
    });
  };

  const ownedRooms = rooms.filter(room => room.owner._id === user._id);
  const membershipRooms = rooms.filter(room => room.owner._id !== user._id);

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
      title: t('common:owner'),
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

  const ownedRoomsRows = ownedRooms.map(room => ({
    _id: room._id,
    key: room._id,
    name: room.name,
    createdOn: room.createdOn,
    access: room.access
  }));

  const membershipRoomsRows = membershipRooms.map(room => {
    const userAsMember = room.members.find(member => member.userId === user._id);
    const joinedOn = userAsMember.joinedOn;

    return {
      _id: room._id,
      key: room._id,
      name: room.name,
      owner: room.owner,
      joinedOn,
      access: room.access
    };
  });

  return (
    <div className="RoomsTab">
      <section className="RoomsTab-section">
        <h2>{t('ownedRoomsHeader')}</h2>
        <Table dataSource={ownedRoomsRows} columns={ownedRoomsColumns} size="middle" />
        <Restricted to={permissions.CREATE_ROOMS}>
          <Button className="RoomsTab-newRoomButton" type="primary" shape="circle" icon={<PlusOutlined />} size="large" onClick={handleNewRoomClick} />
        </Restricted>
      </section>
      <section className="RoomsTab-section">
        <h2>{t('joinedRoomsHeader')}</h2>
        <Table dataSource={membershipRoomsRows} columns={membershipRoomsColumns} size="middle" />
      </section>
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
