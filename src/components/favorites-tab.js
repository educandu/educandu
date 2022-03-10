import React from 'react';
import PropTypes from 'prop-types';
import urls from '../utils/urls.js';
import { useTranslation } from 'react-i18next';
import { FAVORITE_TYPE } from '../domain/constants.js';

const mockFavorites = [
  {
    type: FAVORITE_TYPE.document,
    setOn: '2022-03-10T10:00:30.000Z',
    data: {
      key: '1',
      slug: '1',
      title: 'A song of dance and fire'
    }
  },
  {
    type: FAVORITE_TYPE.document,
    setOn: '2022-03-10T10:00:30.000Z',
    data: {
      key: '2',
      slug: '2',
      title: 'Wonders of the earth'
    }
  },
  {
    type: FAVORITE_TYPE.room,
    setOn: '2022-03-10T10:00:40.000Z',
    data: {
      _id: '11',
      name: 'Playroom for all'
    }
  },
  {
    type: FAVORITE_TYPE.lesson,
    setOn: '2022-03-10T10:00:50.000Z',
    data: {
      _id: '22',
      slug: '22',
      title: 'Teachings of music and such'
    }
  }
];

function FavoritesTab({ favorites }) {
  const { t } = useTranslation('favoritesTab');

  const documentFavorites = mockFavorites.filter(f => f.type === FAVORITE_TYPE.document);
  const roomFavorites = mockFavorites.filter(f => f.type === FAVORITE_TYPE.room);
  const lessonFavorites = mockFavorites.filter(f => f.type === FAVORITE_TYPE.lesson);

  const renderDocumentLink = documentFavorit => {
    const doc = documentFavorit.data;
    const url = urls.getDocUrl({ key: doc.key, slug: doc.slug });
    return <a href={url} key={doc.key}>{doc.title}</a>;
  };

  const renderRoomLink = roomFavorit => {
    const room = roomFavorit.data;
    const url = urls.getRoomUrl(room._id);
    return <a href={url} key={room._id}>{room.name}</a>;
  };

  const renderLessonLink = lessonFavorit => {
    const lesson = lessonFavorit.data;
    const url = urls.getLessonUrl({ id: lesson._id, slug: lesson.slug });
    return <a href={url} key={lesson._id}>{lesson.title}</a>;
  };

  return (
    <div className="FavoritesTab">
      <section className="FavoritesTab-section">
        <h5 className="FavoritesTab-sectionHeading">{t('documentsHeading')}</h5>
        <div className="FavoritesTab-sectionContent">
          {!documentFavorites.length && <span className="FavoritesTab-emptySectionText">{t('noFavoriteDocuments')}</span>}
          {!!documentFavorites.length && documentFavorites.map(renderDocumentLink)}
        </div>
      </section>

      <section className="FavoritesTab-section">
        <h5 className="FavoritesTab-sectionHeading">{t('roomsHeading')}</h5>
        <div className="FavoritesTab-sectionContent">
          {!roomFavorites.length && <span className="FavoritesTab-emptySectionText">{t('noFavoriteRooms')}</span>}
          {!!roomFavorites.length && roomFavorites.map(renderRoomLink)}
        </div>
      </section>

      <section className="FavoritesTab-section" >
        <h5 className="FavoritesTab-sectionHeading">{t('lessonsHeading')}</h5>
        <div className="FavoritesTab-sectionContent">
          {!lessonFavorites.length && <span className="FavoritesTab-emptySectionText">{t('noFavoriteLessons')}</span>}
          {!!lessonFavorites.length && lessonFavorites.map(renderLessonLink)}
        </div>
      </section>
    </div>
  );
}

FavoritesTab.propTypes = {
  favorites: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default FavoritesTab;
