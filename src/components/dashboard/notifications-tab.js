import React from 'react';
import PropTypes from 'prop-types';
import Spinner from '../spinner.js';
import { Button, Tooltip } from 'antd';
import routes from '../../utils/routes.js';
import EmptyState from '../empty-state.js';
import { useTranslation } from 'react-i18next';
import { BellOutlined } from '@ant-design/icons';
import { useDateFormat } from '../locale-context.js';
import CloseIcon from '../icons/general/close-icon.js';
import { EVENT_TYPE } from '../../domain/constants.js';
import CommentIcon from '../icons/general/comment-icon.js';
import MessageIcon from '../icons/general/message-icon.js';
import WriteIconIcon from '../icons/general/write-icon.js';
import { notificationGroupShape } from '../../ui/default-prop-types.js';

function NotificationsTab({ loading, notificationGroups, onRemoveNotificationGroup, onRemoveNotifications }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('notificationsTab');

  const renderNotificationGroup = notificationGroup => {
    let icon;
    let href;
    let title;
    let description;

    const roomNotAvailable = !notificationGroup.eventParams.room;
    const documentNotAvailable = !notificationGroup.eventParams.document;

    if (notificationGroup.eventType === EVENT_TYPE.documentRevisionCreated) {
      icon = <WriteIconIcon />;
      title = documentNotAvailable ? t('common:documentNotAvailable') : notificationGroup.eventParams.document.title;
      href = documentNotAvailable ? null : routes.getDocUrl({ id: notificationGroup.eventParams.document._id });

      if (!notificationGroup.eventParams.document) {
        description = t('documentRevisionCreatedNotification');
      } else {
        description = notificationGroup.eventParams.document.roomId ? t('roomDocumentRevisionCreatedNotification') : t('publicDocumentRevisionCreatedNotification');
      }
    }

    if (notificationGroup.eventType === EVENT_TYPE.documentCommentCreated) {
      icon = <CommentIcon />;
      title = documentNotAvailable ? t('common:documentNotAvailable') : notificationGroup.eventParams.document.title;
      href = documentNotAvailable ? null : routes.getDocUrl({ id: notificationGroup.eventParams.document._id });

      if (!notificationGroup.eventParams.document) {
        description = t('documentCommentCreatedNotification');
      } else {
        description = notificationGroup.eventParams.document.roomId ? t('roomDocumentCommentCreatedNotification') : t('publicDocumentCommentCreatedNotification');
      }
    }

    if (notificationGroup.eventType === EVENT_TYPE.roomMessageCreated) {
      icon = <MessageIcon />;
      title = roomNotAvailable ? t('common:roomNotAvailable') : notificationGroup.eventParams.room.name;
      href = roomNotAvailable ? null : routes.getRoomUrl({ id: notificationGroup.eventParams.room._id });
      description = t('roomMessageCreatedNotification');
    }

    return (
      <div className="NotificationsTab-notification" key={notificationGroup.notificationIds[0]} >
        <div className="NotificationsTab-notificationContent">
          <div className="NotificationsTab-notificationContentIcon">{icon}</div>
          <div className="NotificationsTab-notificationContentText">
            <div className="NotificationsTab-notificationContentTextMain">
              <span className="NotificationsTab-notificationDescription">{description}:</span>
              {!href && <span className="NotificationsTab-notificationMissingDataTitle">{title}</span>}
              {!!href && <span className="NotificationsTab-notificationLink"><a href={href}>{title}</a></span>}
            </div>
            <span className="NotificationsTab-notificationContentTextSecondary">{formatDate(notificationGroup.lastCreatedOn)}</span>
          </div>
        </div>
        <Tooltip title={t('remove')}>
          <Button
            type="text"
            className="NotificationsTab-notificationRemoveButton"
            onClick={() => onRemoveNotificationGroup(notificationGroup)}
            >
            <CloseIcon />
          </Button>
        </Tooltip>
      </div>
    );
  };

  const renderNotificationGroups = () => {
    return (
      <div className="NotificationsTab-notifications">
        {notificationGroups.map(renderNotificationGroup)}
      </div>
    );
  };

  const showEmptyState = !notificationGroups.length;

  return (
    <div>
      {!!loading && <Spinner />}

      {!loading && !!showEmptyState && (
        <EmptyState icon={<BellOutlined />} title={t('emptyStateTitle')} subtitle={t('emptyStateSubtitle')} />
      )}

      {!loading && !showEmptyState && (
        <div>
          <Button
            icon={<CloseIcon />}
            disabled={!notificationGroups.length}
            className="NotificationsTab-removeAllNotificationsButton"
            onClick={onRemoveNotifications}
            >
            {t('removeAll')}
          </Button>
          {renderNotificationGroups()}
        </div>
      )}
    </div>
  );
}

NotificationsTab.propTypes = {
  loading: PropTypes.bool.isRequired,
  notificationGroups: PropTypes.arrayOf(notificationGroupShape).isRequired,
  onRemoveNotificationGroup: PropTypes.func.isRequired,
  onRemoveNotifications: PropTypes.func.isRequired
};

export default NotificationsTab;
