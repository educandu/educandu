import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useState } from 'react';

function FlipCard({ frontContent, frontColor, backContent, backColor }) {
  const [isFrontVisible, setIsFrontVisible] = useState(false);

  const handleClick = () => {
    setIsFrontVisible(prevState => !prevState);
  };

  const frontFaceStyle = frontColor ? { backgroundColor: frontColor } : null;
  const backFaceStyle = backColor ? { backgroundColor: backColor } : null;

  return (
    <div className="FlipCard" onClick={handleClick}>
      <div className={classNames('FlipCard-content', { 'is-flipped': isFrontVisible })}>
        <div className="FlipCard-face FlipCard-face--front" style={frontFaceStyle}>
          <div className="FlipCard-faceContent">
            {frontContent}
          </div>
        </div>
        <div className="FlipCard-face FlipCard-face--back" style={backFaceStyle}>
          <div className="FlipCard-faceContent">
            {backContent}
          </div>
        </div>
      </div>
    </div>
  );
}

FlipCard.propTypes = {
  backColor: PropTypes.string,
  backContent: PropTypes.any,
  frontColor: PropTypes.string,
  frontContent: PropTypes.any
};

FlipCard.defaultProps = {
  backColor: '',
  backContent: null,
  frontColor: '',
  frontContent: null
};

export default FlipCard;
