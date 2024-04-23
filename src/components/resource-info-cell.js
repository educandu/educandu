import React from 'react';
import PropTypes from 'prop-types';
import DocumentRating from './document-rating.js';
import { documentRatingShape } from '../ui/default-prop-types.js';

function ResourceInfoCell({ title, url, shortDescription, subtext, documentRating, onTitleClick }) {
  return (
    <div className="ResourceInfoCell" >
      <div className="ResourceInfoCell-content">
        <div>
          <a className="ResourceInfoCell-title" href={url} onClick={onTitleClick}>
            {title}
          </a>
          {!!documentRating && (
            <div className="ResourceInfoCell-documentRating">
              <DocumentRating
                compact
                value={documentRating.averageRatingValue}
                totalCount={documentRating.ratingsCount}
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
  documentRating: documentRatingShape,
  onTitleClick: PropTypes.func
};

ResourceInfoCell.defaultProps = {
  documentRating: null,
  onTitleClick: null
};

export default ResourceInfoCell;
