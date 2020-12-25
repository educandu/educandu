const React = require('react');
const PropTypes = require('prop-types');
const { default: ReactCountdown } = require('react-countdown');

const formatSeconds = seconds => `${seconds} ${seconds === 1 ? 'Sekunde' : 'Sekunden'}`;

function Countdown({ seconds, isRunning, onComplete }) {
  if (!isRunning) {
    return formatSeconds(seconds);
  }

  return (
    <ReactCountdown
      date={Date.now() + (seconds * 1000)}
      precision={3}
      intervalDelay={1000}
      renderer={props => formatSeconds(props.seconds)}
      onComplete={onComplete}
      />
  );
}

Countdown.propTypes = {
  isRunning: PropTypes.bool,
  onComplete: PropTypes.func,
  seconds: PropTypes.number.isRequired
};

Countdown.defaultProps = {
  isRunning: true,
  onComplete: () => {}
};

module.exports = Countdown;
