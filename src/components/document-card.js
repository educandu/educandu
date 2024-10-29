import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Card, Tooltip } from 'antd';
import routes from '../utils/routes.js';
import DeleteButton from './delete-button.js';
import { useTranslation } from 'react-i18next';
import FavoriteToggle from './favorite-toggle.js';
import { useDateFormat } from './locale-context.js';
import { FAVORITE_TYPE } from '../domain/constants.js';
import { InfoCircleOutlined, UserOutlined } from '@ant-design/icons';
import { contributedDocumentMetadataShape, favoriteDocumentShape } from '../ui/default-prop-types.js';
import { TrafficConeIcon } from './icons/icons.js';

function DocumentCard({ doc, favoriteDocument, onToggleFavorite, isDraft }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentCard');

  const documentId = doc?._id || favoriteDocument?.id;
  const userAccessibleDocument = doc || favoriteDocument?.data;

  const handleCardClick = () => {
    if (userAccessibleDocument) {
      window.location = routes.getDocUrl({ id: documentId });
    }
  };

  const renderTitle = () => {
    const title = userAccessibleDocument?.title || t('common:documentNotAvailable');

    const classes = classNames(
      'DocumentCard-title',
      { 'DocumentCard-title--draft': isDraft },
      { 'DocumentCard-title--deletedDocument': !userAccessibleDocument }
    );

    return (
      <div className={classes} onClick={handleCardClick}>
        <span>{title}</span>
        {!!isDraft && <div className="DocumentCard-draftIcon">ENTWURF</div>}
      </div>
    );
  };

  const renderUserAction = tooltip => {
    return (
      <Tooltip title={tooltip}>
        <div className="DocumentCard-helpAction"><UserOutlined /></div>
      </Tooltip>
    );
  };

  const renderInfoAction = tooltip => {
    return (
      <Tooltip title={tooltip}>
        <div className="DocumentCard-helpAction"><InfoCircleOutlined /></div>
      </Tooltip>
    );
  };

  const actions = [];

  if (isDraft) {
    actions.push((
      <div key="delete">
        <DeleteButton onClick={() => {}} />
      </div>
    ));
  } else {
    actions.push((
      <div key="favorite">
        <FavoriteToggle
          id={documentId}
          type={FAVORITE_TYPE.document}
          onToggle={isFavorite => onToggleFavorite(documentId, isFavorite)}
          />
      </div>
    ));
  }

  if (userAccessibleDocument) {
    const contributors = userAccessibleDocument.contributors?.map(c => c.displayName).join(', ');

    actions.push(renderUserAction((
      <div className="DocumentCard-infoTooltip">
        <div>{t('common:contributionsBy')} {contributors}.</div>
      </div>
    )));

    const createdOn = formatDate(userAccessibleDocument.createdOn);
    const updatedOn = formatDate(userAccessibleDocument.updatedOn);
    const createdBy = userAccessibleDocument.createdBy.displayName;
    const updatedBy = userAccessibleDocument.updatedBy.displayName;

    actions.push(renderInfoAction((
      <div className="DocumentCard-infoTooltip">
        {!!favoriteDocument && (
          <div>{t('common:favoritedByTooltip', { count: favoriteDocument.favoritedByCount })}</div>
        )}
        <div>{t('createdOnDateByUser', { date: createdOn, user: createdBy })}</div>
        <div>{t('updatedOnDateByUser', { date: updatedOn, user: updatedBy })}</div>
      </div>
    )));
  }

  const contentClasses = classNames(
    'DocumentCard-content',
    { 'DocumentCard-content--deletedDocument': !userAccessibleDocument }
  );

  return (
    <Card className={classNames('DocumentCard', { 'is-draft': isDraft })} actions={actions} title={renderTitle()}>
      <div className={contentClasses} onClick={handleCardClick}>
        <div className="DocumentCard-details">
          <div className="DocumentCard-description">{userAccessibleDocument?.shortDescription}</div>
        </div>
      </div>
    </Card>
  );
}

DocumentCard.propTypes = {
  doc: contributedDocumentMetadataShape,
  isDraft: PropTypes.bool,
  favoriteDocument: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    setOn: PropTypes.string.isRequired,
    favoritedByCount: PropTypes.number,
    data: favoriteDocumentShape
  }),
  onToggleFavorite: PropTypes.func
};

DocumentCard.defaultProps = {
  doc: null,
  isDraft: false,
  favoriteDocument: null,
  onToggleFavorite: () => {}
};

export default DocumentCard;
