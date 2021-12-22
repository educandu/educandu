import by from 'thenby';
import PropTypes from 'prop-types';
import urls from '../utils/urls.js';
import Logger from '../common/logger.js';
import Restricted from './restricted.js';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import errorHelper from '../ui/error-helper.js';
import React, { useState, useRef } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import permissions from '../domain/permissions.js';
import { useService } from './container-context.js';
import { useDateFormat } from './language-context.js';
import { roomShape } from '../ui/default-prop-types.js';
import RoomApiClient from '../services/room-api-client.js';
import { ROOM_ACCESS_LEVEL } from '../common/constants.js';
import { Form, Button, Table, Modal, Input, Radio } from 'antd';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const logger = new Logger(import.meta.url);

function RoomsTab({ rooms }) {
  const user = useUser();
  const newRoomFormRef = useRef(null);
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('roomsTab');
  const roomApiClient = useService(RoomApiClient);

  const roomNameValidationRules = [
    {
      required: true,
      message: t('roomNameRequired'),
      whitespace: true
    }
  ];

  const isNewRoomFormValid = async () => {
    try {
      await newRoomFormRef.current.validateFields(['name'], { force: true });
      return true;
    } catch {
      return false;
    }
  };

  const createNewRoomState = () => {
    return {
      name: t('newRoom'),
      access: ROOM_ACCESS_LEVEL.private
    };
  };

  const [state, setState] = useState({
    isNewRoomModalVisible: false,
    isNewRoomBeingCreated: false,
    newRoom: createNewRoomState()
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

  const handleNewRoomClick = () => {
    const newRoom = createNewRoomState();
    setState(prevState => ({ ...prevState, isNewRoomModalVisible: true, newRoom }));
    if (newRoomFormRef.current) {
      newRoomFormRef.current.setFieldsValue({ name: newRoom.name });
    }
  };

  const handleNewRoomOk = async () => {
    try {
      const isValid = await isNewRoomFormValid();
      if (!isValid) {
        return;
      }

      setState(prevState => ({ ...prevState, isNewRoomBeingCreated: true }));
      const newRoom = await roomApiClient.addRoom({ name: state.newRoom.name, access: state.newRoom.access });
      setState(prevState => ({ ...prevState, isNewRoomBeingCreated: false, isNewRoomModalVisible: false }));

      window.location = urls.getRoomDetailsUrl(newRoom._id);
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
      setState(prevState => ({ ...prevState, isNewRoomBeingCreated: false }));
    }
  };

  const handleNewRoomCancel = () => {
    setState(prevState => ({ ...prevState, isNewRoomModalVisible: false }));
  };

  const handleNewRoomNameChange = event => {
    const { value } = event.target;
    setState(prevState => ({ ...prevState, newRoom: { ...prevState.newRoom, name: value } }));
  };

  const handleRoomAccessChange = event => {
    const { value } = event.target;
    setState(prevState => ({ ...prevState, newRoom: { ...prevState.newRoom, access: value } }));
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

      <Modal
        title={t('newRoom')}
        onOk={handleNewRoomOk}
        onCancel={handleNewRoomCancel}
        maskClosable={false}
        visible={state.isNewRoomModalVisible}
        okButtonProps={{ loading: state.isNewRoomBeingCreated }}
        >
        <Form name="new-room-form" ref={newRoomFormRef} layout="vertical">
          <FormItem label={t('name')} name="name" rules={roomNameValidationRules} initialValue={state.newRoom.name}>
            <Input onChange={handleNewRoomNameChange} />
          </FormItem>
          <FormItem label={t('access')}>
            <RadioGroup value={state.newRoom.access} onChange={handleRoomAccessChange}>
              <RadioButton value={ROOM_ACCESS_LEVEL.private}>{t('accessType_private')}</RadioButton>
              <RadioButton value={ROOM_ACCESS_LEVEL.public}>{t('accessType_public')}</RadioButton>
            </RadioGroup>
          </FormItem>
        </Form>
      </Modal>
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
