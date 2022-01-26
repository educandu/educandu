import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import urls from '../../utils/urls.js';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import React, { useRef, useState } from 'react';
import { useDateFormat } from '../language-context.js';
import lessonsUtils from '../../utils/lessons-utils.js';
import RoomMetadataForm from '../room-metadata-form.js';
import { handleApiError } from '../../ui/error-helper.js';
import { ROOM_ACCESS_LEVEL } from '../../domain/constants.js';
import { confirmRoomDelete } from '../confirmation-dialogs.js';
import { Space, List, Button, Tabs, Card, message } from 'antd';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import RoomInvitationCreationModal from '../room-invitation-creation-modal.js';
import LessonMetadataModal, { LESSON_MODAL_MODE } from '../lesson-metadata-modal.js';
import { DeleteOutlined, LockOutlined, PlusOutlined, UnlockOutlined } from '@ant-design/icons';
import { roomShape, invitationShape, lessonMetadataShape } from '../../ui/default-prop-types.js';

const { TabPane } = Tabs;

const logger = new Logger(import.meta.url);

export default function Room({ PageTemplate, initialState }) {
  const user = useUser();
  const now = new Date();
  const formRef = useRef(null);
  const { t } = useTranslation('room');
  const { formatDate, formatTimeTo } = useDateFormat();
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  const [room, setRoom] = useState(initialState.room);
  const [isRoomUpdateButtonDisabled, setIsRoomUpdateButtonDisabled] = useState(true);
  const [isRoomInvitationModalVisible, setIsRoomInvitationModalVisible] = useState(false);
  const [isLessonMetadataModalVisible, setIsLessonMetadataModalVisible] = useState(false);

  const { invitations, lessons } = initialState;
  const isRoomOwner = user._id === room.owner.key;
  const isPrivateRoom = room.access === ROOM_ACCESS_LEVEL.private;
  const upcommingLesson = lessonsUtils.determineUpcomingLesson(now, lessons);

  const handleCreateInvitationButtonClick = event => {
    setIsRoomInvitationModalVisible(true);
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

  const handleDeleteRoomClick = () => {
    confirmRoomDelete(t, room.name, handleRoomDelete);
  };

  const handleInvitationModalClose = wasNewInvitationCreated => {
    setIsRoomInvitationModalVisible(false);

    if (!wasNewInvitationCreated) {
      return;
    }
    window.location.reload();
  };

  const handleNewLessonClick = () => {
    setIsLessonMetadataModalVisible(true);
  };

  const handleLessonMetadataModalClose = () => {
    setIsLessonMetadataModalVisible(false);
  };

  const handleUpdateRoomClick = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  const handleRoomMetadataFormSubmitted = async ({ name, slug, description }) => {
    try {
      const updatedRoom = { ...room, name, slug, description };
      await roomApiClient.updateRoom({ roomId: room._id, name, slug, description });

      setRoom(updatedRoom);
      setIsRoomUpdateButtonDisabled(true);
      message.success(t('updateRoomSuccessMessage'));
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleRoomMetadataFormFieldsChanged = () => {
    setIsRoomUpdateButtonDisabled(false);
  };

  const renderLesson = lesson => {
    const url = urls.getLessonUrl(lesson._id, lesson.slug);

    const startsOn = lesson.schedule?.startsOn;
    const isUpcomingLesson = upcommingLesson?._id === lesson._id;

    const timeUntil = isUpcomingLesson ? formatTimeTo(startsOn) : null;

    return (
      <div className="Room-lesson" key={lesson._id}>
        <div className={`Room-lessonInfo ${isUpcomingLesson ? 'isHighlighted' : ''}`}>
          <span className="Room-lessonStartsOn">{startsOn ? formatDate(startsOn) : t('notScheduled')}</span>
          <a className="Room-lessonTitle" href={url}>{lesson.title}</a>
          <span className="Room-lessonTimeUntil">{timeUntil}</span>
        </div>
      </div>);
  };

  const renderRoomMembers = () => {
    const title = isRoomOwner && t('roomMembersHeader', { count: room.members.length });
    return (
      <Card className="Room-card" title={title}>
        <List
          dataSource={room.members}
          renderItem={member => (
            <List.Item className="Room-membersRow">
              <Space>
                <span className="Room-membersRowDate">{formatDate(member.joinedOn)}</span>
                <span>{member.username}</span>
              </Space>
            </List.Item>)}
          />
      </Card>
    );
  };

  const renderRoomInvitations = () => (
    <Card
      className="Room-card"
      title={t('invitationsHeader', { count: invitations.length })}
      actions={[
        <Button
          className="Room-cardButton"
          key="createRoomInvitation"
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleCreateInvitationButtonClick}
          />
      ]}
      >
      <List
        dataSource={invitations}
        renderItem={invitation => (
          <List.Item className="Room-membersRow">
            <Space>
              <span className="Room-membersRowDate">{formatDate(invitation.sentOn)}</span>
              <span>{invitation.email}</span>
            </Space>
            <Space>
              <span>{t('expires')}:</span>
              <span className="Room-membersRowDate">{formatDate(invitation.expires)}</span>
            </Space>
          </List.Item>
        )}
        />
    </Card>
  );

  const renderRoomLessonsCard = () => (
    <Card
      className="Room-card"
      actions={isRoomOwner && [
        <Button
          className="Room-cardButton"
          key="createLesson"
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleNewLessonClick}
          />
      ]}
      >
      {room.description && <Markdown className="Room-description" renderMedia>{room.description}</Markdown>}
      {lessons.length ? lessons.map(renderLesson) : t('lessonsPlaceholder')}
    </Card>
  );

  return (
    <PageTemplate>
      <div className="Room">
        <h1 className="Room-title">{room.name}</h1>
        <div className="Room-subtitle">
          <div className="Room-subtitleIcon">
            {room.access === ROOM_ACCESS_LEVEL.private ? <LockOutlined /> : <UnlockOutlined />}
          </div>
          <span>{t(`${room.access}RoomSubtitle`)} | {t('common:owner')}: {room.owner.username}</span>
        </div>

        {!isRoomOwner && renderRoomLessonsCard()}

        {isRoomOwner && (
          <Tabs className="Tabs" defaultActiveKey="1" type="line" size="large">
            <TabPane className="Tabs-tabPane" tab={t('lessonsTabTitle')} key="1">
              {renderRoomLessonsCard()}
            </TabPane>

            {isPrivateRoom && (
              <TabPane className="Tabs-tabPane" tab={t('membersTabTitle')} key="2">
                {renderRoomMembers()}
                {renderRoomInvitations()}
                <RoomInvitationCreationModal isVisible={isRoomInvitationModalVisible} onClose={handleInvitationModalClose} roomId={room._id} />
              </TabPane>
            )}

            <TabPane className="Tabs-tabPane" tab={t('settingsTabTitle')} key="3">
              <Card className="Room-card" title={t('updateRoomCardTitle')}>
                <RoomMetadataForm
                  formRef={formRef}
                  room={room}
                  onSubmit={handleRoomMetadataFormSubmitted}
                  onFieldsChange={handleRoomMetadataFormFieldsChanged}
                  editMode
                  />
                <Button
                  className="Room-cardEditButton"
                  type="primary"
                  onClick={handleUpdateRoomClick}
                  disabled={isRoomUpdateButtonDisabled}
                  >
                  {t('common:update')}
                </Button>
              </Card>
              <Card className="Room-card Room-card--danger" title={t('roomDangerZoneCardTitle')}>
                <div className="Room-cardDangerAction">
                  <div>
                    <span className="Room-cardDangerActionTitle">{t('deleteRoomTitle')}</span>
                    <span className="Room-cardDangerActionDescription">{t('deleteRoomDescription')}</span>
                  </div>
                  <Button type="primary" icon={<DeleteOutlined />} onClick={handleDeleteRoomClick}>{t('deleteRoomButton')}</Button>
                </div>
              </Card>
            </TabPane>
          </Tabs>
        )}

        <LessonMetadataModal
          lesson={{ roomId: room._id }}
          mode={LESSON_MODAL_MODE.create}
          isVisible={isLessonMetadataModalVisible}
          onClose={handleLessonMetadataModalClose}
          />
      </div>
    </PageTemplate>);
}

Room.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    room: roomShape.isRequired,
    invitations: PropTypes.arrayOf(invitationShape).isRequired,
    lessons: PropTypes.arrayOf(lessonMetadataShape).isRequired
  }).isRequired
};
