import React from 'react';
import PropTypes from 'prop-types';
import ReactCountdown from 'react-countdown';

function Countdown({ children, seconds, isRunning, onComplete }) {
  if (!isRunning) {
    return children(seconds);
  }

  return (
    <ReactCountdown
      date={Date.now() + (seconds * 1000)}
      precision={3}
      intervalDelay={1000}
      renderer={props => children(props.seconds)}
      onComplete={onComplete}
      />
  );
}

Countdown.propTypes = {
  children: PropTypes.func.isRequired,
  isRunning: PropTypes.bool,
  onComplete: PropTypes.func,
  seconds: PropTypes.number.isRequired
};

Countdown.defaultProps = {
  isRunning: true,
  onComplete: () => {}
};

export default Countdown;
