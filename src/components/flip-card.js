import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

function FlipCard({ flipped, frontContent, frontColor, backContent, backColor, onClick, disabled }) {
  const frontFaceStyle = frontColor ? { backgroundColor: frontColor } : null;
  const backFaceStyle = backColor ? { backgroundColor: backColor } : null;

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <div className="FlipCard" onClick={handleClick}>
      <div className={classNames('FlipCard-content', { 'is-flipped': flipped })}>
        <div className={classNames('FlipCard-face', 'FlipCard-face--back', { 'is-disabled': disabled })} style={backFaceStyle}>
          <div className="FlipCard-faceContent">
            {backContent}
          </div>
        </div>
        <div className={classNames('FlipCard-face', 'FlipCard-face--front', { 'is-disabled': disabled })} style={frontFaceStyle}>
          <div className="FlipCard-faceContent">
            {frontContent}
          </div>
        </div>
      </div>
    </div>
  );
}

FlipCard.propTypes = {
  backColor: PropTypes.string,
  backContent: PropTypes.any,
  disabled: PropTypes.bool,
  flipped: PropTypes.bool,
  frontColor: PropTypes.string,
  frontContent: PropTypes.any,
  onClick: PropTypes.func
};

FlipCard.defaultProps = {
  backColor: '',
  backContent: null,
  disabled: false,
  flipped: false,
  frontColor: '',
  frontContent: null,
  onClick: () => {}
};

export default FlipCard;
