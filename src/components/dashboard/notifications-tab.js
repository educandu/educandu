import React from 'react';
import PropTypes from 'prop-types';
import { Button, Spin, Tooltip } from 'antd';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '../locale-context.js';
import CloseIcon from '../icons/general/close-icon.js';
import { EVENT_TYPE } from '../../domain/constants.js';
import { notificationGroupShape } from '../../ui/default-prop-types.js';
import CommentsIcon from '../icons/user-notifications/comments-icon.js';
import { EditDocIconComponent } from '../icons/user-notifications/edit-doc-icon.js';

function NotificationsTab({ notificationGroups, loading }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('notificationsTab');

  const handleDismissNotificationsClick = () => {

  };

  const renderNotificationGroup = notificationGroup => {
    const isDeprecated = !notificationGroup.eventParams.document;

    const title = isDeprecated ? t('documentNotAvailable') : notificationGroup.eventParams.document.title;
    const href = isDeprecated ? null : routes.getDocUrl({ id: notificationGroup.eventParams.document._id });

    let icon;
    let description;

    if (notificationGroup.eventType === EVENT_TYPE.revisionCreated) {
      icon = <EditDocIconComponent />;
      description = notificationGroup.eventParams.document.roomId ? t('roomRevisionCreatedNotification') : t('publicRevisionCreatedNotification');
    }

    if (notificationGroup.eventType === EVENT_TYPE.commentCreated) {
      icon = <CommentsIcon />;
      description = notificationGroup.eventParams.document.roomId ? t('roomCommentCreatedNotification') : t('publicCommentCreatedNotification');
    }

    return (
      <div className="NotificationsTab-notification" key={notificationGroup.notificationIds[0]} >
        <div className="NotificationsTab-notificationContent">
          <div className="NotificationsTab-notificationContentIcon">{icon}</div>
          <div className="NotificationsTab-notificationContentText">
            <div className="NotificationsTab-notificationContentTextMain">
              <span className="NotificationsTab-notificationDescription">{description}:</span>
              {!!isDeprecated && <span className="NotificationsTab-notificationTitle">[{ title }]</span>}
              {!isDeprecated && <span className="NotificationsTab-notificationLink"><a href={href}>{title}</a></span>}
            </div>
            <span className="NotificationsTab-notificationContentTextSecondary">{formatDate(notificationGroup.lastCreatedOn)}</span>
          </div>
        </div>
        <Tooltip title={t('dismiss')}>
          <Button type="text" className="NotificationsTab-notificationDismissButton">
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
          className="NotificationsTab-dismissAllNotificationsButton"
          onClick={handleDismissNotificationsClick}
          >
          {t('dismissAll')}
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
  notificationGroups: PropTypes.arrayOf(notificationGroupShape).isRequired,
  loading: PropTypes.bool.isRequired
};

export default NotificationsTab;
