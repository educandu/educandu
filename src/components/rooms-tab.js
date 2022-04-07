import by from 'thenby';
import { Button } from 'antd';
import Table from './table.js';
import PropTypes from 'prop-types';
import urls from '../utils/urls.js';
import Restricted from './restricted.js';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import React, { Fragment, useState } from 'react';
import permissions from '../domain/permissions.js';
import { useDateFormat } from './locale-context.js';
import { roomShape } from '../ui/default-prop-types.js';
import RoomCreationModal from './room-creation-modal.js';
import { ROOM_ACCESS_LEVEL } from '../domain/constants.js';
import { PlusOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';

const ROOM_ROLE = {
  owner: 'owner',
  member: 'member'
};

function RoomsTab({ rooms }) {
  const user = useUser();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('roomsTab');

  const [isRoomCreationModalVisible, setIsRoomCreationModalVisible] = useState(false);

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

  const renderAccess = access => {
    return (
      <div className="RoomsTab-accessCell">
        {access === ROOM_ACCESS_LEVEL.private && <LockOutlined />}
        {access === ROOM_ACCESS_LEVEL.public && <UnlockOutlined />}
        <span>{t(`common:accessType_${access}`)}</span>
      </div>
    );
  };

  const renderRole = role => {
    return (
      <Fragment>
        {role === ROOM_ROLE.owner && <span>{t('common:owner')}</span>}
        {role === ROOM_ROLE.member && <span>{t('member')}</span>}
      </Fragment>
    );
  };

  const handleCreateRoomClick = () => {
    setIsRoomCreationModalVisible(true);
  };

  const handleRoomCreationModalClose = () => {
    setIsRoomCreationModalVisible(false);
  };

  const columns = [
    {
      title: t('common:name'),
      dataIndex: 'name',
      render: renderName,
      sorter: by(x => x.name, { ignoreCase: true })
    },
    {
      title: t('common:owner'),
      dataIndex: 'owner',
      key: 'owner',
      render: renderOwner,
      sorter: by(x => x.owner, { ignoreCase: true }),
      width: '200px',
      responsive: ['md']
    },
    {
      title: t('common:access'),
      dataIndex: 'access',
      key: 'access',
      render: renderAccess,
      sorter: by(x => x.access),
      width: '150px',
      responsive: ['sm']
    },
    {
      title: t('role'),
      dataIndex: 'role',
      key: 'role',
      render: renderRole,
      sorter: by(x => x.role),
      width: '100px'
    }
  ];

  const roomsRows = rooms.map(room => {
    const userAsMember = room.members.find(member => member.userId === user._id);

    return {
      _id: room._id,
      key: room._id,
      name: room.name,
      slug: room.slug,
      owner: room.owner,
      access: room.access,
      createdOn: room.createdOn,
      updatedOn: room.updatedOn,
      joinedOn: userAsMember ? userAsMember.joinedOn : null,
      role: userAsMember ? ROOM_ROLE.member : ROOM_ROLE.owner
    };
  });

  return (
    <div className="RoomsTab">
      <Table
        dataSource={[...roomsRows]}
        columns={columns}
        pagination
        />
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
