import React from 'react';
import PropTypes from 'prop-types';
import { Spin, Timeline } from 'antd';
import routes from '../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { USER_ACTIVITY_TYPE } from '../domain/constants.js';
import { userActivitiesShape } from '../ui/default-prop-types.js';
import ItemEditedIcon from './icons/user-activities/item-edited-icon.js';
import RoomJoinedIcon from './icons/user-activities/room-joined-icon.js';
import RoomCreatedIcon from './icons/user-activities/room-created-icon.js';
import DocumentCreatedIcon from './icons/user-activities/document-created-icon.js';
import RoomMarkedFavoriteIcon from './icons/user-activities/room-marked-favorite-icon.js';
import UserMarkedFavoriteIcon from './icons/user-activities/user-marked-favorite-icon.js';
import DocumentMarkedFavoriteIcon from './icons/user-activities/document-marked-favorite-icon.js';

const TimelineItem = Timeline.Item;

function ActivitiesTab({ activities, loading }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('activitiesTab');

  const renderActivity = ({ type, icon, timestamp, description, title, href, isDeprecated }) => {
    let deprecatedTitle;
    if (isDeprecated) {
      switch (type) {
        case USER_ACTIVITY_TYPE.documentCreated:
        case USER_ACTIVITY_TYPE.documentUpdated:
        case USER_ACTIVITY_TYPE.documentMarkedFavorite:
          deprecatedTitle = t('common:deletedDocument');
          break;
        case USER_ACTIVITY_TYPE.roomCreated:
        case USER_ACTIVITY_TYPE.roomUpdated:
        case USER_ACTIVITY_TYPE.roomMarkedFavorite:
        case USER_ACTIVITY_TYPE.roomJoined:
          deprecatedTitle = t('common:deletedRoom');
          break;
        default:
          throw new Error(`Invalid activity type: ${type}`);
      }
    } else {
      deprecatedTitle = null;
    }

    return (
      <TimelineItem
        dot={icon}
        key={timestamp}
        label={<span className="ActivitiesTab-activityLabel">{formatDate(timestamp)}</span>}
        >
        <div>
          <span className="ActivitiesTab-activityDescription">{description}: </span>
          {!!isDeprecated && <span>[{deprecatedTitle}]</span>}
          {!isDeprecated && <span className="ActivitiesTab-activityLink"><a href={href}>{title}</a></span>}
        </div>
      </TimelineItem>
    );
  };

  const renderDocumentCreatedActivity = activity => {
    return renderActivity({
      icon: <DocumentCreatedIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('documentCreatedActivity'),
      title: activity.data.title,
      href: routes.getDocUrl({ id: activity.data._id }),
      isDeprecated: activity.isDeprecated
    });
  };

  const renderDocumentUpdatedActivity = activity => {
    return renderActivity({
      icon: <ItemEditedIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('documentUpdatedActivity'),
      title: activity.data.title,
      href: routes.getDocUrl({ id: activity.data._id }),
      isDeprecated: activity.isDeprecated
    });
  };

  const renderDocumentMarkedFavoriteActivity = activity => {
    return renderActivity({
      icon: <DocumentMarkedFavoriteIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('documentMarkedFavoriteActivity'),
      title: activity.data.title,
      href: routes.getDocUrl({ id: activity.data._id }),
      isDeprecated: activity.isDeprecated
    });
  };

  const renderRoomCreatedActivity = activity => {
    return renderActivity({
      icon: <RoomCreatedIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('roomCreatedActivity'),
      title: activity.data.name,
      href: routes.getRoomUrl(activity.data._id),
      isDeprecated: activity.isDeprecated
    });
  };

  const renderRoomUpdatedActivity = activity => {
    return renderActivity({
      icon: <ItemEditedIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('roomUpdatedActivity'),
      title: activity.data.name,
      href: routes.getRoomUrl(activity.data._id),
      isDeprecated: activity.isDeprecated
    });
  };

  const renderRoomMarkedFavoriteActivity = activity => {
    return renderActivity({
      icon: <RoomMarkedFavoriteIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('roomMarkedFavoriteActivity'),
      title: activity.data.name,
      href: routes.getRoomUrl(activity.data._id),
      isDeprecated: activity.isDeprecated
    });
  };

  const renderRoomJoinedActivity = activity => {
    return renderActivity({
      icon: <RoomJoinedIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('roomJoinedActivity'),
      title: activity.data.name,
      href: routes.getRoomUrl(activity.data._id),
      isDeprecated: activity.isDeprecated
    });
  };

  const renderUserMarkedFavoriteActivity = activity => {
    return renderActivity({
      icon: <UserMarkedFavoriteIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('userMarkedFavoriteActivity'),
      title: activity.data.displayName,
      href: routes.getUserUrl(activity.data._id),
      isDeprecated: activity.isDeprecated
    });
  };

  const renderActivityByType = activity => {
    switch (activity.type) {
      case USER_ACTIVITY_TYPE.documentCreated:
        return renderDocumentCreatedActivity(activity);
      case USER_ACTIVITY_TYPE.documentUpdated:
        return renderDocumentUpdatedActivity(activity);
      case USER_ACTIVITY_TYPE.documentMarkedFavorite:
        return renderDocumentMarkedFavoriteActivity(activity);
      case USER_ACTIVITY_TYPE.roomCreated:
        return renderRoomCreatedActivity(activity);
      case USER_ACTIVITY_TYPE.roomUpdated:
        return renderRoomUpdatedActivity(activity);
      case USER_ACTIVITY_TYPE.roomMarkedFavorite:
        return renderRoomMarkedFavoriteActivity(activity);
      case USER_ACTIVITY_TYPE.roomJoined:
        return renderRoomJoinedActivity(activity);
      case USER_ACTIVITY_TYPE.userMarkedFavorite:
        return renderUserMarkedFavoriteActivity(activity);
      default:
        return null;
    }
  };

  const renderActivities = () => {
    return (
      <Timeline mode="left">
        {activities.map(renderActivityByType).filter(activity => activity)}
      </Timeline>
    );
  };

  return (
    <div>
      <section>
        <div className="ActivitiesTab-info">{t('info')}</div>
        <div className="ActivitiesTab-timeline">
          {!!loading && <Spin className="u-spin" />}
          {!loading && renderActivities()}
          {!loading && !activities.length && <span>{t('noActivities')}</span>}
        </div>
      </section>
    </div>
  );
}

ActivitiesTab.propTypes = {
  activities: PropTypes.arrayOf(userActivitiesShape).isRequired,
  loading: PropTypes.bool.isRequired
};

export default ActivitiesTab;
