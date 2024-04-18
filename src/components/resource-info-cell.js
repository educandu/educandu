import React from 'react';
import PropTypes from 'prop-types';
import DocumentRating from './document-rating.js';

function ResourceInfoCell({ title, url, shortDescription, subtext, rating, onTitleClick }) {
  return (
    <div className="ResourceInfoCell" >
      <div className="ResourceInfoCell-content">
        <div>
          <a className="ResourceInfoCell-title" href={url} onClick={onTitleClick}>
            {title}
          </a>
          {!!rating && (
            <div className="ResourceInfoCell-rating">
              <DocumentRating
                compact
                value={rating.averageRating}
                totalCount={rating.userRatingsCount}
                />
            </div>
          )}
          {!!shortDescription && <div className="ResourceInfoCell-description">{shortDescription}</div>}
          <div className="ResourceInfoCell-subtext">{subtext}</div>
        </div>
      </div>
    </div>
  );
}

ResourceInfoCell.propTypes = {
  title: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  shortDescription: PropTypes.string.isRequired,
  subtext: PropTypes.node.isRequired,
  rating: PropTypes.shape({
    userRatingsCount: PropTypes.number.isRequired,
    averageRating: PropTypes.number
  }),
  onTitleClick: PropTypes.func
};

ResourceInfoCell.defaultProps = {
  rating: null,
  onTitleClick: null
};

export default ResourceInfoCell;
