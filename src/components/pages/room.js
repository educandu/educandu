import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import React, { useState } from 'react';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import { DeleteOutlined } from '@ant-design/icons';
import { useService } from '../container-context.js';
import { useDateFormat } from '../language-context.js';
import { handleApiError } from '../../ui/error-helper.js';
import { Space, List, Collapse, Button, Tabs } from 'antd';
import { ROOM_ACCESS_LEVEL } from '../../domain/constants.js';
import { confirmRoomDelete } from '../confirmation-dialogs.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import RoomInvitationCreationModal from '../room-invitation-creation-modal.js';
import { roomShape, invitationShape, lessonShape } from '../../ui/default-prop-types.js';

const { TabPane } = Tabs;

const logger = new Logger(import.meta.url);

export default function Room({ PageTemplate, initialState }) {
  const user = useUser();
  const { t } = useTranslation('room');
  const { formatDate } = useDateFormat();
  const [isRoomInvitationModalOpen, setIsRoomInvitationModalOpen] = useState(false);
  const roomApiClient = useService(RoomApiClient);

  const { room, invitations, lessons } = initialState;
  const isRoomOwner = user._id === room.owner.key;
  const isPrivateRoom = room.access === ROOM_ACCESS_LEVEL.private;

  const handleOpenInvitationModalClick = event => {
    setIsRoomInvitationModalOpen(true);
    event.stopPropagation();
  };

  const handleRoomDelete = async () => {
    try {
      await roomApiClient.deleteRoom(room._id);
      window.location = urls.getMySpaceUrl();
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  };

  const handleRoomDeleteClick = () => {
    confirmRoomDelete(t, room.name, handleRoomDelete);
  };

  const handleInvitationModalClose = wasNewInvitationCreated => {
    setIsRoomInvitationModalOpen(false);

    if (!wasNewInvitationCreated) {
      return;
    }
    window.location.reload();
  };

  const headerActions = [];
  if (isRoomOwner) {
    headerActions.push({
      key: 'delete',
      type: 'primary',
      icon: DeleteOutlined,
      text: t('deleteRoomButton'),
      handleClick: handleRoomDeleteClick
    });
  }

  const renderLesson = (lesson, index) => {
    const urlParts = ['lessons', encodeURIComponent(lesson._id)];
    if (lesson.slug) {
      urlParts.push(encodeURIComponent(lesson.slug));
    }
    const url = urlParts.join('/');

    const hightlightedLessonIndex = 1;

    return (
      <div className="Room-lesson" key={lesson._id}>
        {index === hightlightedLessonIndex && (<hr />)}
        <div className="Room-lessonInfo">
          <span className="Room-lessonWeek">{index === hightlightedLessonIndex && t('thisWeek')}</span>
          <a rel="noopener noreferrer" target="_blank" href={url}>{lesson.title}</a>
        </div>
        {index === hightlightedLessonIndex && (<hr />)}
      </div>
    );
  };

  const renderRoomMembers = () => (
    <Collapse className="Room-sectionCollapse">
      <Collapse.Panel header={t('roomMembersHeader', { count: room.members.length })} >
        <List
          dataSource={room.members}
          renderItem={member => (
            <List.Item className="Room-sectionCollapseRow">
              <Space>
                <span>{formatDate(member.joinedOn)}</span>
                <span>{member.username}</span>
              </Space>
            </List.Item>)}
          />
      </Collapse.Panel>
    </Collapse>
  );

  const renderRoomInvitations = () => (
    <Collapse className="Room-sectionCollapse">
      <Collapse.Panel
        header={t('invitationsHeader', { count: invitations.length })}
        extra={<Button onClick={handleOpenInvitationModalClick}>{t('createInvitationButton')}</Button>}
        >
        <List
          dataSource={invitations}
          renderItem={invitation => (
            <List.Item className="Room-sectionCollapseRow">
              <Space>
                <span>{formatDate(invitation.sentOn)}</span>
                <span>{invitation.email}</span>
              </Space>

              <Space>
                <span>{t('expires')}:</span>
                <span>{formatDate(invitation.expires)}</span>
              </Space>
            </List.Item>
          )}
          />
      </Collapse.Panel>
    </Collapse>
  );

  return (
    <PageTemplate headerActions={headerActions}>
      <div className="Room">
        <h1> {t('pageNames:room', { roomName: room.name })}</h1>
        <Tabs className="Tabs" defaultActiveKey="1" type="line" size="large">
          <TabPane className="Tabs-tabPane" tab={t('lessonsTabTitle')} key="1">
            {lessons.map(renderLesson)}
          </TabPane>

          <TabPane className="Tabs-tabPane" tab={t('membersTabTitle')} key="2">
            <span>{t('roomOwner')}: {room.owner.username}</span>
            {isPrivateRoom && renderRoomMembers()}
            {isPrivateRoom && isRoomOwner && renderRoomInvitations()}
            <RoomInvitationCreationModal isVisible={isRoomInvitationModalOpen} onClose={handleInvitationModalClose} roomId={room._id} />
          </TabPane>

          {isRoomOwner && (<TabPane className="Tabs-tabPane" tab={t('settingsTabTitle')} key="3" />)}
        </Tabs>
      </div>
    </PageTemplate>);
}

Room.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    room: roomShape.isRequired,
    invitations: PropTypes.arrayOf(invitationShape).isRequired,
    lessons: PropTypes.arrayOf(lessonShape).isRequired
  }).isRequired
};
