import React from 'react';
import PropTypes from 'prop-types';
import routes from '../../utils/routes.js';
import { Button, Spin, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '../locale-context.js';
import CloseIcon from '../icons/general/close-icon.js';
import { EVENT_TYPE } from '../../domain/constants.js';
import CommentIcon from '../icons/general/comment-icon.js';
import MessageIcon from '../icons/general/message-icon.js';
import EditDocIcon from '../icons/general/edit-doc-icon.js';
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
      icon = <EditDocIcon />;
      title = documentNotAvailable ? t('documentNotAvailable') : notificationGroup.eventParams.document.title;
      href = documentNotAvailable ? null : routes.getDocUrl({ id: notificationGroup.eventParams.document._id });

      if (!notificationGroup.eventParams.document) {
        description = t('documentRevisionCreatedNotification');
      } else {
        description = notificationGroup.eventParams.document.roomId ? t('roomDocumentRevisionCreatedNotification') : t('publicDocumentRevisionCreatedNotification');
      }
    }

    if (notificationGroup.eventType === EVENT_TYPE.documentCommentCreated) {
      icon = <CommentIcon />;
      title = documentNotAvailable ? t('documentNotAvailable') : notificationGroup.eventParams.document.title;
      href = documentNotAvailable ? null : routes.getDocUrl({ id: notificationGroup.eventParams.document._id });

      if (!notificationGroup.eventParams.document) {
        description = t('documentCommentCreatedNotification');
      } else {
        description = notificationGroup.eventParams.document.roomId ? t('roomDocumentCommentCreatedNotification') : t('publicDocumentCommentCreatedNotification');
      }
    }

    if (notificationGroup.eventType === EVENT_TYPE.roomMessageCreated) {
      icon = <MessageIcon />;
      title = roomNotAvailable ? t('roomNotAvailable') : notificationGroup.eventParams.room.name;
      href = roomNotAvailable ? null : routes.getRoomUrl(notificationGroup.eventParams.room._id);
      description = t('roomMessageCreatedNotification');
    }

    return (
      <div className="NotificationsTab-notification" key={notificationGroup.notificationIds[0]} >
        <div className="NotificationsTab-notificationContent">
          <div className="NotificationsTab-notificationContentIcon">{icon}</div>
          <div className="NotificationsTab-notificationContentText">
            <div className="NotificationsTab-notificationContentTextMain">
              <span className="NotificationsTab-notificationDescription">{description}:</span>
              {!href && <span className="NotificationsTab-notificationTitle">[{ title }]</span>}
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

  return (
    <div>
      <section>
        <div className="NotificationsTab-info">{t('info')}</div>
        <Button
          icon={<CloseIcon />}
          disabled={!notificationGroups.length}
          className="NotificationsTab-removeAllNotificationsButton"
          onClick={onRemoveNotifications}
          >
          {t('removeAll')}
        </Button>
        <div>
          {!!loading && <Spin className="u-spin" />}
          {!loading && renderNotificationGroups()}
          {!loading && !notificationGroups.length && <span>{t('noNotifications')}</span>}
        </div>
      </section>
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
