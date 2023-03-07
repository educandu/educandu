import React from 'react';
import PropTypes from 'prop-types';

function ResourceInfoCell({ title, url, description, subtext, onTitleClick }) {
  const handleTitleClick = event => {
    if (onTitleClick) {
      event.preventDefault();
      event.stopPropagation();
      onTitleClick();
    } else {
      window.location = url;
    }
  };

  return (
    <div className="ResourceInfoCell" >
      <div className="ResourceInfoCell-content">
        <div>
          <a className="ResourceInfoCell-title" onClick={handleTitleClick}>
            {title}
          </a>
          {!!description && <div className="ResourceInfoCell-description">{description}</div>}
          <div className="ResourceInfoCell-subtext">{subtext}</div>
        </div>
      </div>
    </div>
  );
}

ResourceInfoCell.propTypes = {
  title: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  subtext: PropTypes.node.isRequired,
  onTitleClick: PropTypes.func
};

ResourceInfoCell.defaultProps = {
  onTitleClick: null
};

export default ResourceInfoCell;
