import React from 'react';
import urls from '../utils/urls.js';
import { useTranslation } from 'react-i18next';
import EditIcon from './icons/general/edit-icon.js';
import { useDateFormat } from './locale-context.js';
import { USER_ACTIVITY_TYPE } from '../domain/constants.js';
import DuplicateIcon from './icons/general/duplicate-icon.js';
import { StarFilled, UsergroupAddOutlined } from '@ant-design/icons';

function NewsTab() {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('newsTab');

  const activities = [
    { type: USER_ACTIVITY_TYPE.documentCreated, timestamp: new Date(), data: { title: 'My document', _id: '' } },
    { type: USER_ACTIVITY_TYPE.documentUpdated, timestamp: new Date(), data: { title: 'My document', _id: '' } },
    { type: USER_ACTIVITY_TYPE.documentMarkedFavorite, timestamp: new Date(), data: { title: 'Some document', _id: '' } },
    { type: USER_ACTIVITY_TYPE.roomCreated, timestamp: new Date(), data: { title: 'My room', _id: '' } },
    { type: USER_ACTIVITY_TYPE.roomUpdated, timestamp: new Date(), data: { title: 'My room', _id: '' } },
    { type: USER_ACTIVITY_TYPE.roomMarkedFavorite, timestamp: new Date(), data: { title: 'Some room', _id: '' } },
    { type: USER_ACTIVITY_TYPE.roomJoined, timestamp: new Date(), data: { title: 'Other room', _id: '' } },
    { type: USER_ACTIVITY_TYPE.lessonCreated, timestamp: new Date(), data: { title: 'My lesson', _id: '' } },
    { type: USER_ACTIVITY_TYPE.lessonUpdated, timestamp: new Date(), data: { title: 'My lesson', _id: '' } },
    { type: USER_ACTIVITY_TYPE.lessonMarkedFavorite, timestamp: new Date(), data: { title: 'Some lesson', _id: '' } }
  ];

  const renderActivity = ({ icon, timestamp, description, linkText, linkHref }) => (
    <div className="NewsTab-activity">
      <div className="NewsTab-activityMetadata">
        <div className="NewsTab-activityMetadataIcon">{icon}</div>
        <div>{formatDate(timestamp)}</div>
      </div>
      <div className="NewsTab-activityData">
        <span className="NewsTab-activityDataDescription">{description}:</span>
        <a className="NewsTab-activityDataLink" href={linkHref}>{linkText}</a>
      </div>
    </div>
  );

  const renderDocumentCreatedActivity = activity => {
    return renderActivity({
      icon: <DuplicateIcon />,
      timestamp: activity.timestamp,
      description: t('documentCreatedActivity'),
      linkText: activity.data.title,
      linkHref: urls.getDocUrl({ key: activity.data._id })
    });
  };

  const renderDocumentUpdatedActivity = activity => {
    return renderActivity({
      icon: <EditIcon />,
      timestamp: activity.timestamp,
      description: t('documentUpdatedActivity'),
      linkText: activity.data.title,
      linkHref: urls.getDocUrl({ key: activity.data._id })
    });
  };

  const renderDocumentMarkedFavoriteActivity = activity => {
    return renderActivity({
      icon: <StarFilled className="NewsTab-activityMetadataIcon--lighter" />,
      timestamp: activity.timestamp,
      description: t('documentMarkedFavoriteActivity'),
      linkText: activity.data.title,
      linkHref: urls.getDocUrl({ key: activity.data._id })
    });
  };

  const renderRoomCreatedActivity = activity => {
    return renderActivity({
      icon: <DuplicateIcon />,
      timestamp: activity.timestamp,
      description: t('roomCreatedActivity'),
      linkText: activity.data.title,
      linkHref: urls.getRoomUrl(activity.data._id)
    });
  };

  const renderRoomUpdatedActivity = activity => {
    return renderActivity({
      icon: <EditIcon />,
      timestamp: activity.timestamp,
      description: t('roomUpdatedActivity'),
      linkText: activity.data.title,
      linkHref: urls.getRoomUrl(activity.data._id)
    });
  };

  const renderRoomMarkedFavoriteActivity = activity => {
    return renderActivity({
      icon: <StarFilled className="NewsTab-activityMetadataIcon--lighter" />,
      timestamp: activity.timestamp,
      description: t('roomMarkedFavoriteActivity'),
      linkText: activity.data.title,
      linkHref: urls.getRoomUrl(activity.data._id)
    });
  };

  const renderRoomJoinedActivity = activity => {
    return renderActivity({
      icon: <UsergroupAddOutlined />,
      timestamp: activity.timestamp,
      description: t('roomJoinedActivity'),
      linkText: activity.data.title,
      linkHref: urls.getRoomUrl(activity.data._id)
    });
  };

  const renderLessonCreatedActivity = activity => {
    return renderActivity({
      icon: <DuplicateIcon />,
      timestamp: activity.timestamp,
      description: t('lessonCreatedActivity'),
      linkText: activity.data.title,
      linkHref: urls.getLessonUrl(activity.data._id)
    });
  };

  const renderLessonUpdatedActivity = activity => {
    return renderActivity({
      icon: <EditIcon />,
      timestamp: activity.timestamp,
      description: t('lessonUpdatedActivity'),
      linkText: activity.data.title,
      linkHref: urls.getLessonUrl(activity.data._id)
    });
  };

  const renderLessonMarkedFavoriteActivity = activity => {
    return renderActivity({
      icon: <StarFilled className="NewsTab-activityMetadataIcon--lighter" />,
      timestamp: activity.timestamp,
      description: t('lessonMarkedFavoriteActivity'),
      linkText: activity.data.title,
      linkHref: urls.getLessonUrl(activity.data._id)
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
      .map(activity => <div key={activity.timestamp}>{renderActivityByType(activity)}</div>)
      .filter(activity => activity);
  };

  return (
    <section>
      <h5 className="NewsTab-activitiesHeader">{t('latestActivitiesHeader')}</h5>
      <div className="NewsTab-activities">
        {renderActivities()}
      </div>
    </section>
  );
}

export default NewsTab;
