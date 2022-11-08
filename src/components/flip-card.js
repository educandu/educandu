import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const FACE_TYPE = {
  front: 'front',
  back: 'back',
  standalone: 'standalone'
};

export function FlipCardFace({ content, color, faceType, disabled }) {
  const faceStyle = color ? { backgroundColor: color } : null;

  const classes = classNames(
    'FlipCard-face',
    { 'FlipCard-face--front': faceType === FACE_TYPE.front },
    { 'FlipCard-face--back': faceType === FACE_TYPE.back },
    { 'is-disabled': disabled }
  );

  return (
    <div className={classes} style={faceStyle}>
      <div className="FlipCard-faceContent">
        {content}
      </div>
    </div>
  );
}

function FlipCard({ flipped, frontContent, frontColor, backContent, backColor, onClick, disabled }) {
  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <div className="FlipCard" onClick={handleClick}>
      <div className={classNames('FlipCard-content', { 'is-flipped': flipped })}>
        <FlipCardFace content={backContent} color={backColor} disabled={disabled} faceType={FACE_TYPE.back} />
        <FlipCardFace content={frontContent} color={frontColor} disabled={disabled} faceType={FACE_TYPE.front} />
      </div>
    </div>
  );
}

FlipCardFace.propTypes = {
  color: PropTypes.string,
  content: PropTypes.any,
  disabled: PropTypes.bool,
  faceType: PropTypes.oneOf(Object.values(FACE_TYPE))
};

FlipCardFace.defaultProps = {
  color: '',
  content: null,
  disabled: false,
  faceType: FACE_TYPE.standalone
};

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
