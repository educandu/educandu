import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Card, Tooltip } from 'antd';
import routes from '../utils/routes.js';
import FavoriteStar from './favorite-star.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { FAVORITE_TYPE } from '../domain/constants.js';
import { InfoCircleOutlined, UserOutlined } from '@ant-design/icons';
import { contributedDocumentMetadataShape } from '../ui/default-prop-types.js';

function DocumentCard({ doc, favoritedByCount, onToggleFavorite }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentCard');

  const handleCardClick = () => {
    if (doc) {
      window.location = routes.getDocUrl({ id: doc._id, slug: doc.slug });
    }
  };

  const renderTitle = () => {
    const title = doc ? doc.title : `[${t('common:deletedDocument')}]`;

    return (
      <div
        className={classNames('DocumentCard-title', { 'DocumentCard-title--nonClickable': !doc })}
        onClick={handleCardClick}
        >
        {title}
      </div>
    );
  };

  const renderUserAction = tooltip => {
    return (
      <Tooltip title={tooltip}>
        <UserOutlined />
      </Tooltip>
    );
  };

  const renderInfoAction = tooltip => {
    return (
      <Tooltip title={tooltip}>
        <InfoCircleOutlined />
      </Tooltip>
    );
  };

  const actions = [];

  if (doc) {
    actions.push((
      <div key="favorite" className="UserCard-favoriteAction">
        <FavoriteStar
          id={doc._id}
          type={FAVORITE_TYPE.document}
          onToggle={isFavorite => onToggleFavorite(doc._id, isFavorite)}
          />
      </div>
    ));

    actions.push(renderUserAction((
      <div className="DocumentCard-infoTooltip">
        <div>{t('common:contributionsBy')}: {doc.contributors?.map(c => c.displayName).join(', ')}</div>
      </div>
    )));

    actions.push(renderInfoAction((
      <div className="DocumentCard-infoTooltip">
        {Number.isInteger(favoritedByCount) && (
          <div>{t('common:favoritedByTooltip', { count: favoritedByCount })}</div>
        )}
        <div>{t('common:createdOnBy', { date: formatDate(doc.createdOn) })} {doc.createdBy.displayName}</div>
        <div>{t('common:updatedOnBy', { date: formatDate(doc.updatedOn) })} {doc.updatedBy.displayName}</div>
      </div>
    )));
  }

  return (
    <Card className="DocumentCard" actions={actions} title={renderTitle()}>
      <div className={classNames('DocumentCard-content', { 'DocumentCard-content--nonClickable': !doc })} onClick={handleCardClick}>
        <div className="DocumentCard-details">
          <div className="DocumentCard-description">{doc?.shortDescription}</div>
        </div>
      </div>
    </Card>
  );
}

DocumentCard.propTypes = {
  doc: contributedDocumentMetadataShape,
  favoritedByCount: PropTypes.number,
  onToggleFavorite: PropTypes.func
};

DocumentCard.defaultProps = {
  doc: null,
  favoritedByCount: null,
  onToggleFavorite: () => {}
};

export default DocumentCard;
