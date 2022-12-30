import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const FACE_TYPE = {
  front: 'front',
  back: 'back',
  standalone: 'standalone'
};

export function FlipCardFace({ content, color, faceType, locked, disabled, hidden }) {
  const faceStyle = color ? { backgroundColor: color } : null;

  const classes = classNames(
    'FlipCard-face',
    { 'FlipCard-face--front': faceType === FACE_TYPE.front },
    { 'FlipCard-face--back': faceType === FACE_TYPE.back },
    { 'is-disabled': disabled },
    { 'is-locked': locked }
  );

  return (
    <div className={classes} style={faceStyle}>
      <div className="FlipCard-faceContent">
        {content}
      </div>
      {!!disabled && <div className="FlipCard-disabledOverlay" />}
      {/* Ensures card face is not revealed in browser print or screenshot tools */}
      {!!hidden && <div className="FlipCard-hiddenOverlay" />}
    </div>
  );
}

function FlipCard({ flipped, frontContent, frontColor, backContent, backColor, onClick, locked, disabled }) {
  const handleClick = () => {
    if (!locked && !disabled) {
      onClick();
    }
  };

  return (
    <div className="FlipCard" onClick={handleClick}>
      <div className={classNames('FlipCard-content', { 'is-flipped': flipped })}>
        <FlipCardFace content={backContent} color={backColor} locked={locked} disabled={disabled} hidden={flipped} faceType={FACE_TYPE.back} />
        <FlipCardFace content={frontContent} color={frontColor} locked={locked} disabled={disabled} hidden={!flipped} faceType={FACE_TYPE.front} />
      </div>
    </div>
  );
}

FlipCardFace.propTypes = {
  color: PropTypes.string,
  content: PropTypes.any,
  disabled: PropTypes.bool,
  hidden: PropTypes.bool,
  faceType: PropTypes.oneOf(Object.values(FACE_TYPE)),
  locked: PropTypes.bool
};

FlipCardFace.defaultProps = {
  color: '',
  content: null,
  disabled: false,
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
  locked: false,
  onClick: () => {}
};

export default FlipCard;
