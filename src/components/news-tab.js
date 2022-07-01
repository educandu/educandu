import React from 'react';
import PropTypes from 'prop-types';
import urls from '../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { USER_ACTIVITY_TYPE } from '../domain/constants.js';
import { userActivitiesShape } from '../ui/default-prop-types.js';
import ItemEditedIcon from './icons/user-activities/item-edited-icon.js';
import RoomJoinedIcon from './icons/user-activities/room-joined-icon.js';
import RoomCreatedIcon from './icons/user-activities/room-created-icon.js';
import LessonCreatedIcon from './icons/user-activities/lesson-created-icon.js';
import DocumentCreatedIcon from './icons/user-activities/document-created-icon.js';
import RoomMarkedFavoriteIcon from './icons/user-activities/room-marked-favorite-icon.js';
import LessonMarkedFavoriteIcon from './icons/user-activities/lesson-marked-favorite-icon.js';
import DocumentMarkedFavoriteIcon from './icons/user-activities/document-marked-favorite-icon.js';

function NewsTab({ activities }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('newsTab');

  const renderActivity = ({ type, icon, timestamp, description, title, href, isDeprecated }) => {
    let deprecatedTitle;
    if (isDeprecated) {
      switch (type) {
        case USER_ACTIVITY_TYPE.roomCreated:
        case USER_ACTIVITY_TYPE.roomUpdated:
        case USER_ACTIVITY_TYPE.roomMarkedFavorite:
        case USER_ACTIVITY_TYPE.roomJoined:
          deprecatedTitle = t('common:deletedRoom');
          break;
        case USER_ACTIVITY_TYPE.lessonCreated:
        case USER_ACTIVITY_TYPE.lessonUpdated:
        case USER_ACTIVITY_TYPE.lessonMarkedFavorite:
          deprecatedTitle = t('common:deletedLesson');
          break;
        default:
          throw new Error(`Invalid activity type: ${type}`);
      }
    } else {
      deprecatedTitle = null;
    }

    return (
      <div className="NewsTab-activity">
        <div className="NewsTab-activityMetadata">
          <div className="NewsTab-activityMetadataIcon">{icon}</div>
          <div>{formatDate(timestamp)}</div>
        </div>
        <div className="NewsTab-activityData">
          <span className="NewsTab-activityDataDescription">{description}:</span>
          {isDeprecated && <span>[{deprecatedTitle}]</span>}
          {!isDeprecated && <a className="NewsTab-activityDataLink" href={href}>{title}</a>}
        </div>
      </div>
    );
  };

  const renderDocumentCreatedActivity = activity => {
    return renderActivity({
      icon: <DocumentCreatedIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('documentCreatedActivity'),
      title: activity.data.title,
      href: urls.getDocUrl({ key: activity.data._id }),
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
      href: urls.getDocUrl({ key: activity.data._id }),
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
      href: urls.getDocUrl({ key: activity.data._id }),
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
      href: urls.getRoomUrl(activity.data._id),
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
      href: urls.getRoomUrl(activity.data._id),
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
      href: urls.getRoomUrl(activity.data._id),
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
      href: urls.getRoomUrl(activity.data._id),
      isDeprecated: activity.isDeprecated
    });
  };

  const renderLessonCreatedActivity = activity => {
    return renderActivity({
      icon: <LessonCreatedIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('lessonCreatedActivity'),
      title: activity.data.title,
      href: urls.getLessonUrl({ id: activity.data._id }),
      isDeprecated: activity.isDeprecated
    });
  };

  const renderLessonUpdatedActivity = activity => {
    return renderActivity({
      icon: <ItemEditedIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('lessonUpdatedActivity'),
      title: activity.data.title,
      href: urls.getLessonUrl({ id: activity.data._id }),
      isDeprecated: activity.isDeprecated
    });
  };

  const renderLessonMarkedFavoriteActivity = activity => {
    return renderActivity({
      icon: <LessonMarkedFavoriteIcon />,
      type: activity.type,
      timestamp: activity.timestamp,
      description: t('lessonMarkedFavoriteActivity'),
      title: activity.data.title,
      href: urls.getLessonUrl({ id: activity.data._id }),
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
      case USER_ACTIVITY_TYPE.lessonCreated:
        return renderLessonCreatedActivity(activity);
      case USER_ACTIVITY_TYPE.lessonUpdated:
        return renderLessonUpdatedActivity(activity);
      case USER_ACTIVITY_TYPE.lessonMarkedFavorite:
        return renderLessonMarkedFavoriteActivity(activity);
      default:
        return null;
    }
  };

  const renderActivities = () => {
    return activities
      .map(activity => <div key={JSON.stringify(activity)}>{renderActivityByType(activity)}</div>)
      .filter(activity => activity);
  };

  return (
    <div>
      {!!activities.length && (
        <section>
          <h5 className="NewsTab-activitiesHeader">{t('latestActivitiesHeader')}</h5>
          <div className="NewsTab-activities">
            {renderActivities()}
          </div>
        </section>
      )}
    </div>
  );
}

NewsTab.propTypes = {
  activities: PropTypes.arrayOf(userActivitiesShape).isRequired
};

export default NewsTab;
