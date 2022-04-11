import by from 'thenby';
import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import urls from '../../utils/urls.js';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import FavoriteStar from '../favorite-star.js';
import DeleteButton from '../delete-button.js';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import MetadataTitle from '../metadata-title.js';
import { useDateFormat } from '../locale-context.js';
import lessonsUtils from '../../utils/lessons-utils.js';
import RoomMetadataForm from '../room-metadata-form.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import PublicIcon from '../icons/general/public-icon.js';
import { handleApiError } from '../../ui/error-helper.js';
import PrivateIcon from '../icons/general/private-icon.js';
import { ensureIsExcluded } from '../../utils/array-utils.js';
import DuplicateIcon from '../icons/general/duplicate-icon.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import LessonApiClient from '../../api-clients/lesson-api-client.js';
import { Space, List, Button, Tabs, Card, message, Tooltip } from 'antd';
import RoomInvitationCreationModal from '../room-invitation-creation-modal.js';
import { confirmLessonDelete, confirmRoomDelete } from '../confirmation-dialogs.js';
import LessonMetadataModal, { LESSON_MODAL_MODE } from '../lesson-metadata-modal.js';
import { roomShape, invitationShape, lessonMetadataShape } from '../../ui/default-prop-types.js';
import { FAVORITE_TYPE, LESSON_VIEW_QUERY_PARAM, ROOM_ACCESS_LEVEL } from '../../domain/constants.js';

const { TabPane } = Tabs;

const logger = new Logger(import.meta.url);

export default function Room({ PageTemplate, initialState }) {
  const user = useUser();
  const now = new Date();
  const formRef = useRef(null);
  const { t } = useTranslation('room');
  const { formatDate, formatTimeTo } = useDateFormat();
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);
  const lessonApiClient = useSessionAwareApiClient(LessonApiClient);

  const [room, setRoom] = useState(initialState.room);
  const [lessons, setLessons] = useState(initialState.lessons);
  const [invitations, setInvitations] = useState(initialState.invitations.sort(by(x => x.sentOn)));
  const [isRoomUpdateButtonDisabled, setIsRoomUpdateButtonDisabled] = useState(true);
  const [isRoomInvitationModalVisible, setIsRoomInvitationModalVisible] = useState(false);
  const [lessonMetadataModalState, setLessonMetadataModalState] = useState({
    isVisible: false,
    isCloning: false,
    templateLessonId: null,
    initialLessonMetadata: { roomId: room._id }
  });

  const isRoomOwner = user?._id === room.owner.key;
  const upcommingLesson = lessonsUtils.determineUpcomingLesson(now, lessons);

  useEffect(() => {
    history.replaceState(null, '', urls.getRoomUrl(room._id, room.slug));
  }, [room._id, room.slug]);

  const handleCreateInvitationButtonClick = event => {
    setIsRoomInvitationModalVisible(true);
    event.stopPropagation();
  };

  const handleRoomDelete = async () => {
    try {
      await roomApiClient.deleteRoom(room._id);
      window.location = urls.getDashboardUrl();
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  };

  const handleDeleteRoomClick = () => {
    confirmRoomDelete(t, room.name, handleRoomDelete);
  };

  const handleInvitationModalClose = newInvitation => {
    setIsRoomInvitationModalVisible(false);
    if (newInvitation) {
      setInvitations(currentInvitations => {
        const invitationsByEmail = new Map(currentInvitations.map(x => [x.email, x]));
        invitationsByEmail.set(newInvitation.email, newInvitation);
        return [...invitationsByEmail.values()].sort(by(x => x.sentOn));
      });
    }
  };

  const handleNewLessonClick = (lessonToClone = null) => {
    setLessonMetadataModalState({
      isVisible: true,
      isCloning: !!lessonToClone,
      templateLessonId: lessonToClone?._id || null,
      initialLessonMetadata: lessonToClone
        ? {
          ...lessonToClone,
          title: `${lessonToClone.title} ${t('common:copyTitleSuffix')}`,
          slug: lessonToClone.slug ? `${lessonToClone.slug}-${t('common:copySlugSuffix')}` : ''
        }
        : {
          roomId: room._id
        }
    });
  };

  const handleLessonMetadataModalSave = createdLessonOrLessons => {
    const lessonToShow = lessonMetadataModalState.isCloning ? createdLessonOrLessons : createdLessonOrLessons[0];
    window.location = urls.getLessonUrl({
      id: lessonToShow._id,
      slug: lessonToShow.slug,
      view: LESSON_VIEW_QUERY_PARAM.edit,
      templateLessonId: lessonMetadataModalState.isCloning ? lessonMetadataModalState.templateLessonId : null
    });

    setLessonMetadataModalState(prev => ({ ...prev, isVisible: false }));
  };

  const handleLessonMetadataModalCancel = () => {
    setLessonMetadataModalState(prev => ({ ...prev, isVisible: false }));
  };

  const handleUpdateRoomClick = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  const handleRoomMetadataFormSubmitted = async ({ name, slug, lessonsMode, description }) => {
    try {
      const updatedRoom = { ...room, name, slug, lessonsMode, description };
      await roomApiClient.updateRoom({ roomId: room._id, name, slug, lessonsMode, description });

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

  const handleDeleteLessonClick = lesson => {
    confirmLessonDelete(t, lesson.title, async () => {
      await lessonApiClient.deleteLesson(lesson._id);
      setLessons(ensureIsExcluded(lessons, lesson));
    });
  };

  const renderLesson = lesson => {
    const url = urls.getLessonUrl({ id: lesson._id, slug: lesson.slug });

    const startsOn = lesson.schedule?.startsOn;
    const isUpcomingLesson = upcommingLesson?._id === lesson._id;

    const timeUntil = isUpcomingLesson ? formatTimeTo(startsOn) : null;

    return (
      <div className="Room-lesson" key={lesson._id}>
        <div className={`Room-lessonInfo ${isUpcomingLesson ? 'is-highlighted' : ''}`}>
          {isRoomOwner && (
            <Fragment>
              <Tooltip title={t('common:clone')}>
                <Button size="small" type="link" icon={<DuplicateIcon />} onClick={() => handleNewLessonClick(lesson)} />
              </Tooltip>
              <Tooltip title={t('common:delete')}>
                <DeleteButton className="Room-lessonDeleteButton" onClick={() => handleDeleteLessonClick(lesson)} />
              </Tooltip>
            </Fragment>
          )}
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
          onClick={() => handleNewLessonClick()}
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
        <MetadataTitle
          text={room.name}
          extra={<FavoriteStar type={FAVORITE_TYPE.room} id={room._id} />}
          />
        <div className="Room-subtitle">
          {room.access === ROOM_ACCESS_LEVEL.private ? <PrivateIcon /> : <PublicIcon />}
          <span>{t(`${room.access}RoomSubtitle`)} | {t(`${room.lessonsMode}LessonsSubtitle`)} | {t('common:owner')}: {room.owner.username}</span>
        </div>

        {!isRoomOwner && renderRoomLessonsCard()}

        {isRoomOwner && (
          <Tabs className="Tabs" defaultActiveKey="1" type="line" size="middle">
            <TabPane className="Tabs-tabPane" tab={t('lessonsTabTitle')} key="1">
              {renderRoomLessonsCard()}
            </TabPane>

            <TabPane className="Tabs-tabPane" tab={t('membersTabTitle')} key="2">
              {renderRoomMembers()}
              {renderRoomInvitations()}
              <RoomInvitationCreationModal
                isVisible={isRoomInvitationModalVisible}
                onOk={handleInvitationModalClose}
                onCancel={handleInvitationModalClose}
                roomId={room._id}
                />
            </TabPane>

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
                  <Button className="Room-cardDangerActionButton" type="primary" icon={<DeleteIcon />} onClick={handleDeleteRoomClick}>{t('deleteRoomButton')}</Button>
                </div>
              </Card>
            </TabPane>
          </Tabs>
        )}

        <LessonMetadataModal
          mode={LESSON_MODAL_MODE.create}
          isVisible={lessonMetadataModalState.isVisible}
          allowMultiple={!lessonMetadataModalState.isCloning}
          initialLessonMetadata={lessonMetadataModalState.initialLessonMetadata}
          onSave={handleLessonMetadataModalSave}
          onCancel={handleLessonMetadataModalCancel}
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
