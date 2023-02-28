import React from 'react';
import PropTypes from 'prop-types';
import { Spin, Timeline } from 'antd';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { CommentOutlined } from '@ant-design/icons';
import { useDateFormat } from '../locale-context.js';
import { EVENT_TYPE } from '../../domain/constants.js';
import { notificationGroupShape } from '../../ui/default-prop-types.js';
import ItemEditedIcon from '../icons/user-activities/item-edited-icon.js';

const TimelineItem = Timeline.Item;

function NotificationsTab({ notificationGroups, loading }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('notificationsTab');

  const renderNotificationGroup = notificationGroup => {
    const isDeprecated = !notificationGroup.eventParams.document;

    const title = isDeprecated
      ? t('common:deletedDocument')
      : notificationGroup.eventParams.document.title;

    const href = isDeprecated
      ? null
      : routes.getDocUrl({ id: notificationGroup.eventParams.document._id });

    let icon;
    let description;
    switch (notificationGroup.eventType) {
      case EVENT_TYPE.revisionCreated:
        icon = <ItemEditedIcon />;
        description = t('revisionCreatedNotification');
        break;
      case EVENT_TYPE.commentCreated:
        icon = <CommentOutlined />;
        description = t('commentCreatedNotification');
        break;
      default:
        throw new Error(`Unsupported event type '${notificationGroup.eventType}'`);
    }

    return (
      <TimelineItem
        dot={icon}
        key={notificationGroup.notificationIds[0]}
        label={<span className="NotificationsTab-notificationLabel">{formatDate(notificationGroup.lastCreatedOn)}</span>}
        >
        <div className="NotificationsTab-notification">
          <span className="NotificationsTab-notificationDescription">{description}: </span>
          {!!isDeprecated && <span>[{title}]</span>}
          {!isDeprecated && <span className="NotificationsTab-notificationLink"><a href={href}>{title}</a></span>}
        </div>
      </TimelineItem>
    );
  };

  const renderNotificationGroups = () => {
    return (
      <Timeline mode="left">
        {notificationGroups.map(renderNotificationGroup)}
      </Timeline>
    );
  };

  return (
    <div>
      <section>
        <div className="NotificationsTab-info">{t('info')}</div>
        <div className="NotificationsTab-timeline">
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
