import by from 'thenby';
import React from 'react';
import PropTypes from 'prop-types';

function Timeline({ length, parts, onPartAdd, onPartDelete, onStartTimecodeChange }) {
  const orderedParts = parts.sort(by(part => part.startTimecode));

  const renderBarPart = (part, index) => {
    const nextPart = orderedParts[index + 1];
    const stopTimecode = nextPart ? nextPart.startTimecode : length;
    const width = (stopTimecode * 100) / length;

    return (
      <div key={part.key} className="Timeline-barPart" style={{ width: `${width}%` }}>{part.title}</div>
    );
  };

  return (
    <div className="Timeline">
      <div className="Timeline-bar">
        {orderedParts.map(renderBarPart)}
      </div>
    </div>
  );
}

Timeline.propTypes = {
  length: PropTypes.number.isRequired,
  onPartAdd: PropTypes.func,
  onPartDelete: PropTypes.func,
  onStartTimecodeChange: PropTypes.func,
  parts: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    startTimecode: PropTypes.number.isRequired
  })).isRequired
};

Timeline.defaultProps = {
  onPartAdd: () => {},
  onPartDelete: () => {},
  onStartTimecodeChange: () => {}
};

export default Timeline;
