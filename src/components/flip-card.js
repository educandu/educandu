
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const FACE_TYPE = {
  front: 'front',
  back: 'back',
  standalone: 'standalone'
};

export function FlipCardFace({ content, color, faceType, locked, hidden, highlighted }) {
  const faceStyle = color ? { backgroundColor: color } : null;

  const classes = classNames(
    'FlipCard-face',
    { 'FlipCard-face--front': faceType === FACE_TYPE.front },
    { 'FlipCard-face--back': faceType === FACE_TYPE.back },
    { 'is-locked': locked },
    { 'is-highlighted': highlighted }
  );

  return (
    <div className={classes} style={faceStyle}>
      <div className="FlipCard-faceContent">
        {content}
      </div>
      {/* Ensures card face is not revealed in browser print or screenshot tools */}
      {!!hidden && <div className="FlipCard-hiddenOverlay" />}
    </div>
  );
}

function FlipCard({ flipped, frontContent, frontColor, backContent, backColor, onClick, locked, disabled, highlighted }) {
  const handleClick = () => {
    if (!locked && !disabled) {
      onClick();
    }
  };

  const contentClasses = classNames(
    'FlipCard-content',
    { 'is-flipped': flipped },
    { 'is-highlighted': highlighted }
  );

  return (
    <div className="FlipCard" onClick={handleClick}>
      <div className={contentClasses}>
        <FlipCardFace content={backContent} color={backColor} locked={locked} hidden={flipped} faceType={FACE_TYPE.back} />
        <FlipCardFace content={frontContent} color={frontColor} locked={locked} hidden={!flipped} highlighted={highlighted} faceType={FACE_TYPE.front} />
      </div>
      {!!disabled && <div className="FlipCard-disabledOverlay" />}
    </div>
  );
}

FlipCardFace.propTypes = {
  color: PropTypes.string,
  content: PropTypes.any,
  hidden: PropTypes.bool,
  highlighted: PropTypes.bool,
  faceType: PropTypes.oneOf(Object.values(FACE_TYPE)),
  locked: PropTypes.bool
};

FlipCardFace.defaultProps = {
  color: '',
  content: null,
  hidden: false,
  highlighted: false,
  faceType: FACE_TYPE.standalone,
  locked: false
};

FlipCard.propTypes = {
  backColor: PropTypes.string,
  backContent: PropTypes.any,
  disabled: PropTypes.bool,
  flipped: PropTypes.bool,
  frontColor: PropTypes.string,
  frontContent: PropTypes.any,
  highlighted: PropTypes.bool,
  locked: PropTypes.bool,
  onClick: PropTypes.func
};

FlipCard.defaultProps = {
  backColor: '',
  backContent: null,
  disabled: false,
  flipped: false,
  frontColor: '',
  frontContent: null,
  highlighted: false,
  locked: false,
  onClick: () => {}
};

export default FlipCard;
