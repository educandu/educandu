import React from 'react';
import classNames from 'classnames';
import routes from '../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import RoomJoinedIcon from './icons/user-activities/room-joined-icon.js';
import { documentMetadataShape, roomMinimalMetadataShape } from '../ui/default-prop-types.js';

function DocumentInfoCell({ doc, room }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentInfoCell');

  const showFrame = !!room;
  const dates = [
    `${t('common:created')}: ${formatDate(doc.createdOn)}`,
    `${t('updatedOn')}: ${formatDate(doc.updatedOn)}`
  ];

  return (
    <div className="DocumentInfoCell" >
      {showFrame && (
        <a href={routes.getRoomUrl(room._id, room.slug)} className="DocumentInfoCell-topFrame">
          <RoomJoinedIcon />{room.name}
        </a>
      )}

      <div className="DocumentInfoCell-infoContainer">
        {showFrame && <div className="DocumentInfoCell-leftFrame" />}
        <a
          href={routes.getDocUrl({ id: doc._id, slug: doc.slug })}
          className={classNames('DocumentInfoCell-infoContent', { 'DocumentInfoCell-infoContent--framed': showFrame })}
          >
          <div>
            <div className="DocumentInfoCell-mainText">{doc.title}</div>
            {doc.description && <div className="DocumentInfoCell-description">{doc.description}</div>}
            <div className="DocumentInfoCell-subtext">{dates.join(' | ')}</div>
          </div>
        </a>
      </div>
    </div>
  );
}

DocumentInfoCell.propTypes = {
  doc: documentMetadataShape.isRequired,
  room: roomMinimalMetadataShape
};

DocumentInfoCell.defaultProps = {
  room: null
};

export default DocumentInfoCell;
