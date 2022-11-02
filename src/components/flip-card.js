import React from 'react';
import PropTypes from 'prop-types';

function FlipCard({ frontContent }) {

  return (
    <div className="FlipCard">
      <div className="FlipCard-frontContent">
        {frontContent}
      </div>
    </div>
  );
}

FlipCard.propTypes = {
  frontContent: PropTypes.any.isRequired
};

export default FlipCard;
