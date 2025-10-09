import React from 'react';
import PropTypes from 'prop-types';
import routes from '../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import ResourceInfoCell from './resource-info-cell.js';
import { documentRatingShape, otherUserShape } from '../ui/default-prop-types.js';

function ResourceTitleCell({ title, shortDescription, url, documentRating, createdOn, createdBy, updatedOn, updatedBy, deletedOn, deletedBy }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('resourceTitleCell');

  return (
    <ResourceInfoCell
      title={title}
      shortDescription={shortDescription}
      url={url}
      documentRating={documentRating}
      subtext={
        <div className="ResourceTitleCell">
          <div>
            <span>{`${t('common:createdOnDateBy', { date: formatDate(createdOn) })} `}</span>
            <a href={routes.getUserProfileUrl(createdBy._id)}>{createdBy.displayName}</a>
          </div>
          <div>
            <span>{`${t('common:updatedOnDateBy', { date: formatDate(updatedOn) })} `}</span>
            <a href={routes.getUserProfileUrl(updatedBy._id)}>{updatedBy.displayName}</a>
          </div>
          {!!deletedOn && !!deletedBy && (
            <div>
              <span>{`${t('common:deletedOnDateBy', { date: formatDate(deletedOn) })} `}</span>
              <a href={routes.getUserProfileUrl(deletedBy._id)}>{deletedBy.displayName}</a>
            </div>
          )}
        </div>
      }
      />
  );
}

ResourceTitleCell.propTypes = {
  title: PropTypes.string.isRequired,
  shortDescription: PropTypes.string.isRequired,
  url: PropTypes.string,
  documentRating: documentRatingShape,
  createdOn: PropTypes.string.isRequired,
  createdBy: otherUserShape.isRequired,
  updatedOn: PropTypes.string.isRequired,
  updatedBy: otherUserShape.isRequired,
  deletedOn: PropTypes.string,
  deletedBy: otherUserShape
};

ResourceTitleCell.defaultProps = {
  url: null,
  documentRating: null,
  deletedOn: null,
  deletedBy: null
};

export default ResourceTitleCell;
