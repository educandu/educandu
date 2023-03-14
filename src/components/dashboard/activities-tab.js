import React from 'react';
import PropTypes from 'prop-types';
import { Spin, Timeline } from 'antd';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '../locale-context.js';
import { USER_ACTIVITY_TYPE } from '../../domain/constants.js';
import { userActivitiesShape } from '../../ui/default-prop-types.js';
import ItemEditedIcon from '../icons/user-activities/item-edited-icon.js';
import RoomJoinedIcon from '../icons/user-activities/room-joined-icon.js';
import RoomCreatedIcon from '../icons/user-activities/room-created-icon.js';
import DocumentCreatedIcon from '../icons/user-activities/document-created-icon.js';
import RoomMarkedFavoriteIcon from '../icons/user-activities/room-marked-favorite-icon.js';
import UserMarkedFavoriteIcon from '../icons/user-activities/user-marked-favorite-icon.js';
import DocumentMarkedFavoriteIcon from '../icons/user-activities/document-marked-favorite-icon.js';

function ActivitiesTab({ activities, loading }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('activitiesTab');

  const getActivityItem = ({ type, icon, timestamp, description, title, href, isDeprecated }) => {
    let deprecatedTitle;
    if (isDeprecated) {
      switch (type) {
        case USER_ACTIVITY_TYPE.documentCreated:
        case USER_ACTIVITY_TYPE.documentUpdated:
        case USER_ACTIVITY_TYPE.documentMarkedFavorite:
          deprecatedTitle = t('common:documentNotAvailable');
          break;
        case USER_ACTIVITY_TYPE.roomCreated:
        case USER_ACTIVITY_TYPE.roomUpdated:
        case USER_ACTIVITY_TYPE.roomMarkedFavorite:
        case USER_ACTIVITY_TYPE.roomJoined:
          deprecatedTitle = t('common:roomNotAvailable');
          break;
        default:
          throw new Error(`Invalid activity type: ${type}`);
      }
    } else {
      deprecatedTitle = null;
    }

    return (
      {
        label: (
          <span className="ActivitiesTab-activityLabel">{formatDate(timestamp)}</span>
        ),
        dot: (
          <div className="ActivitiesTab-activityIcon">{icon}</div>
        ),
        children: (
          <div className="ActivitiesTab-activity">
            <span className="ActivitiesTab-activityDescription">{description}: </span>
            {!!isDeprecated && <span className="ActivitiesTab-activityDeprecatedTitle">{deprecatedTitle}</span>}
            {!isDeprecated && <span className="ActivitiesTab-activityLink"><a href={href}>{title}</a></span>}
          </div>
        )
      }
    );
  };

  const getDocumentCreatedActivityItem = activity => {
    return getActivityItem({
      icon: <DocumentCreatedIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('documentCreatedActivity'),
      title: activity.data.title,
      href: routes.getDocUrl({ id: activity.data._id }),
      isDeprecated: activity.isDeprecated
    });
  };

  const getDocumentUpdatedActivityItem = activity => {
    return getActivityItem({
      icon: <ItemEditedIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('documentUpdatedActivity'),
      title: activity.data.title,
      href: routes.getDocUrl({ id: activity.data._id }),
      isDeprecated: activity.isDeprecated
    });
  };

  const getDocumentMarkedFavoriteActivityItem = activity => {
    return getActivityItem({
      icon: <DocumentMarkedFavoriteIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('documentMarkedFavoriteActivity'),
      title: activity.data.title,
      href: routes.getDocUrl({ id: activity.data._id }),
      isDeprecated: activity.isDeprecated
    });
  };

  const getRoomCreatedActivityItem = activity => {
    return getActivityItem({
      icon: <RoomCreatedIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('roomCreatedActivity'),
      title: activity.data.name,
      href: routes.getRoomUrl(activity.data._id),
      isDeprecated: activity.isDeprecated
    });
  };

  const getRoomUpdatedActivityItem = activity => {
    return getActivityItem({
      icon: <ItemEditedIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('roomUpdatedActivity'),
      title: activity.data.name,
      href: routes.getRoomUrl(activity.data._id),
      isDeprecated: activity.isDeprecated
    });
  };

  const getRoomMarkedFavoriteActivityItem = activity => {
    return getActivityItem({
      icon: <RoomMarkedFavoriteIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('roomMarkedFavoriteActivity'),
      title: activity.data.name,
      href: routes.getRoomUrl(activity.data._id),
      isDeprecated: activity.isDeprecated
    });
  };

  const getRoomJoinedActivityItem = activity => {
    return getActivityItem({
      icon: <RoomJoinedIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('roomJoinedActivity'),
      title: activity.data.name,
      href: routes.getRoomUrl(activity.data._id),
      isDeprecated: activity.isDeprecated
    });
  };

  const getUserMarkedFavoriteActivityItem = activity => {
    return getActivityItem({
      icon: <UserMarkedFavoriteIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('userMarkedFavoriteActivity'),
      title: activity.data.displayName,
      href: routes.getUserProfileUrl(activity.data._id),
      isDeprecated: activity.isDeprecated
    });
  };

  const getActivityItemByType = activity => {
    switch (activity.type) {
      case USER_ACTIVITY_TYPE.documentCreated:
        return getDocumentCreatedActivityItem(activity);
      case USER_ACTIVITY_TYPE.documentUpdated:
        return getDocumentUpdatedActivityItem(activity);
      case USER_ACTIVITY_TYPE.documentMarkedFavorite:
        return getDocumentMarkedFavoriteActivityItem(activity);
      case USER_ACTIVITY_TYPE.roomCreated:
        return getRoomCreatedActivityItem(activity);
      case USER_ACTIVITY_TYPE.roomUpdated:
        return getRoomUpdatedActivityItem(activity);
      case USER_ACTIVITY_TYPE.roomMarkedFavorite:
        return getRoomMarkedFavoriteActivityItem(activity);
      case USER_ACTIVITY_TYPE.roomJoined:
        return getRoomJoinedActivityItem(activity);
      case USER_ACTIVITY_TYPE.userMarkedFavorite:
        return getUserMarkedFavoriteActivityItem(activity);
      default:
        return null;
    }
  };

  const timelineItems = activities.map(getActivityItemByType).filter(activity => activity);

  return (
    <div>
      <section>
        <div className="ActivitiesTab-info">{t('info')}</div>
        <div className="ActivitiesTab-timeline">
          {!!loading && <Spin className="u-spin" />}
          {!loading && <Timeline mode="left" items={timelineItems} />}
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
