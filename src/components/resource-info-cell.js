import React from 'react';
import PropTypes from 'prop-types';

function ResourceInfoCell({ title, url, shortDescription, subtext, onTitleClick }) {
  return (
    <div className="ResourceInfoCell" >
      <div className="ResourceInfoCell-content">
        <div>
          <a className="ResourceInfoCell-title" href={url} onClick={onTitleClick}>
            {title}
          </a>
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
  onTitleClick: PropTypes.func
};

ResourceInfoCell.defaultProps = {
  onTitleClick: null
};

export default ResourceInfoCell;
