import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import { Tabs, Breadcrumb } from 'antd';
import EmptyState from '../empty-state.js';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import RoomMedia from '../room/room-media.js';
import { InputsIcon } from '../icons/icons.js';
import { useTranslation } from 'react-i18next';
import RoomMembers from '../room/room-members.js';
import { useRequest } from '../request-context.js';
import FavoriteToggle from '../favorite-toggle.js';
import MessageBoard from '../room/message-board.js';
import RoomSettings from '../room/room-settings.js';
import RoomIcon from '../icons/general/room-icon.js';
import RoomDocuments from '../room/room-documents.js';
import WriteIcon from '../icons/general/write-icon.js';
import { handleApiError } from '../../ui/error-helper.js';
import { FAVORITE_TYPE } from '../../domain/constants.js';
import PrivateIcon from '../icons/general/private-icon.js';
import React, { Fragment, useMemo, useState } from 'react';
import { confirmLeaveRoom } from '../confirmation-dialogs.js';
import SettingsIcon from '../icons/main-menu/settings-icon.js';
import { TeamOutlined, UserOutlined } from '@ant-design/icons';
import RoomApiClient from '../../api-clients/room-api-client.js';
import RoomDocumentInputs from '../room/room-document-inputs.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { RoomMediaContextProvider } from '../room-media-context.js';
import RoomExitedIcon from '../icons/user-activities/room-exited-icon.js';
import { isRoomInvitedCollaborator, isRoomOwner } from '../../utils/room-utils.js';
import { roomShape, roomInvitationShape, roomMediaContextShape, roomDocumentMetadataShape } from '../../ui/default-prop-types.js';

const logger = new Logger(import.meta.url);

const VIEW_MODE = {
  owner: 'owner',
  collaboratingMember: 'collaborating-member',
  nonCollaboratingMember: 'non-collaborating-member'
};

const TAB_KEYS = {
  view: 'view',
  media: 'media',
  documentInputs: 'documentInputs',
  members: 'members',
  settings: 'settings'
};

export default function Room({ PageTemplate, initialState }) {
  const user = useUser();
  const request = useRequest();
  const { t } = useTranslation('room');
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  const initialTab = request.query.tab || TAB_KEYS.view;

  const [room, setRoom] = useState(initialState.room);
  const [membersCount, setMembersCount] = useState(initialState.room.members.length);
  const [invitationsCount, setInvitationsCount] = useState(initialState.invitations.length);

  const viewMode = useMemo(() => {
    if (isRoomOwner({ room, userId: user?._id })) {
      return VIEW_MODE.owner;
    }
    if (isRoomInvitedCollaborator({ room, userId: user?._id })) {
      return VIEW_MODE.collaboratingMember;
    }
    return VIEW_MODE.nonCollaboratingMember;
  }, [room, user]);

  const handleTabChange = tab => {
    history.replaceState(null, '', routes.getRoomUrl({ id: room._id, slug: room.slug, tab }));
  };

  const handleLeaveRoom = async () => {
    try {
      await roomApiClient.deleteRoomMember({ roomId: room._id, memberUserId: user._id });
      window.location = routes.getDashboardUrl({ tab: 'rooms' });
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  };

  const handleLeaveRoomClick = () => {
    confirmLeaveRoom(t, room.name, handleLeaveRoom);
  };

  const handleRoomSettingsChange = updatedRoom => {
    if (room.slug !== updatedRoom.slug) {
      history.replaceState(null, '', routes.getRoomUrl({ id: room._id, slug: room.slug, tab: TAB_KEYS.settings }));
    }

    setRoom(updatedRoom);
  };

  const handleRoomMembersChange = membersInfo => {
    setMembersCount(membersInfo.membersCount);
    setInvitationsCount(membersInfo.invitationsCount);
  };

  const renderSubtitleLink = () => {
    const ownerProfileUrl = routes.getUserProfileUrl(room.ownedBy);

    return (
      <div>
        {t('common:by')} <a className="RoomPage-subtitleLink" href={ownerProfileUrl}>{room.owner.displayName}</a>
      </div>
    );
  };

  const renderLeaveRoomLink = () => {
    return (
      <a className="RoomPage-leaveRoomLink" onClick={handleLeaveRoomClick}>
        <RoomExitedIcon />{t('cancelRoomMembership')}
      </a>
    );
  };

  const renderRoomOverview = () => {
    const showEmptyState = viewMode === VIEW_MODE.owner && !room.overview;

    if (showEmptyState) {
      return (
        <EmptyState
          icon={<WriteIcon />}
          title={t('overviewEmptyStateTitle')}
          subtitle={t('overviewEmptyStateSubtitle')}
          />
      );
    }

    return <Markdown className="RoomPage-overview">{room.overview}</Markdown>;
  };

  const renderRoomView = () => {
    return (
      <Fragment>
        {renderRoomOverview()}
        <RoomDocuments
          roomId={room._id}
          initialRoomDocumentIds={initialState.room.documents}
          initialRoomDocuments={initialState.documents}
          canDeleteDocuments={viewMode === VIEW_MODE.owner}
          canPublishDocuments={viewMode === VIEW_MODE.owner}
          canManageDocuments={viewMode === VIEW_MODE.owner || viewMode === VIEW_MODE.collaboratingMember}
          canManageDraftDocuments={viewMode === VIEW_MODE.owner}
          />
        <MessageBoard
          roomId={room._id}
          initialMessages={initialState.room.messages}
          canManageMessages={viewMode === VIEW_MODE.owner}
          />
      </Fragment>
    );
  };

  const getMembersTabTitle = () => {
    const count = invitationsCount
      ? `${membersCount}/${membersCount + invitationsCount}`
      : membersCount;

    const text = room.isCollaborative
      ? `${t('common:collaborators')} (${count})`
      : `${t('common:members')} (${count})`;

    return text;
  };

  const tabItems = [
    {
      key: TAB_KEYS.view,
      icon: <RoomIcon />,
      label: t('roomViewTitle'),
      children: (
        <div className="Tabs-tabPane">
          {renderRoomView()}
        </div>
      ),
      isVisible: true
    },
    {
      key: TAB_KEYS.media,
      icon: <PrivateIcon />,
      label: t('roomMediaTitle'),
      children: (
        <div className="Tabs-tabPane">
          <RoomMedia roomId={room._id} />
        </div>
      ),
      isVisible: true
    },
    {
      key: TAB_KEYS.documentInputs,
      icon: <InputsIcon />,
      label: t('roomDocumentInputsTitle'),
      children: (
        <div className="Tabs-tabPane">
          <RoomDocumentInputs roomId={room._id} />
        </div>
      ),
      isVisible: viewMode === VIEW_MODE.collaboratingMember || viewMode === VIEW_MODE.owner
    },
    {
      key: TAB_KEYS.members,
      icon: room.isCollaborative ? <TeamOutlined /> : <UserOutlined />,
      label: getMembersTabTitle(),
      children: (
        <div className="Tabs-tabPane">
          <RoomMembers
            roomId={room._id}
            roomIsCollaborative={room.isCollaborative}
            initialRoomMembers={initialState.room.members}
            initialRoomInvitations={initialState.invitations}
            onChange={handleRoomMembersChange}
            />
        </div>
      ),
      isVisible: viewMode === VIEW_MODE.owner
    },
    {
      key: TAB_KEYS.settings,
      icon: <SettingsIcon />,
      label: t('common:settings'),
      children: (
        <div className="Tabs-tabPane" >
          <RoomSettings room={room} onChange={handleRoomSettingsChange} />
        </div>
      ),
      isVisible: viewMode === VIEW_MODE.owner
    }
  ].filter(tab => !!tab.isVisible);

  return (
    <RoomMediaContextProvider context={initialState.roomMediaContext}>
      <PageTemplate>
        <div className="RoomPage">
          <Breadcrumb
            className="Breadcrumbs"
            items={[
              {
                title: t('common:roomsBreadcrumbPart'),
                href: routes.getDashboardUrl({ tab: 'rooms' })
              }, {
                title: room.name
              }
            ]}
            />
          <div className="RoomPage-title">
            <div>{room.name}</div>
            <div className="RoomPage-titleFavoriteToggle">
              <FavoriteToggle type={FAVORITE_TYPE.room} id={room._id} showAsButton />
            </div>
          </div>
          <div className="RoomPage-subtitle">
            {renderSubtitleLink()}
            {viewMode !== VIEW_MODE.owner && renderLeaveRoomLink()}
          </div>
          <Tabs
            type="line"
            size="middle"
            className="Tabs"
            destroyInactiveTabPane
            defaultActiveKey={initialTab}
            onChange={handleTabChange}
            items={tabItems}
            />
        </div>
      </PageTemplate>
    </RoomMediaContextProvider>
  );
}

Room.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    room: roomShape.isRequired,
    invitations: PropTypes.arrayOf(roomInvitationShape).isRequired,
    documents: PropTypes.arrayOf(roomDocumentMetadataShape).isRequired,
    roomMediaContext: roomMediaContextShape
  }).isRequired
};
