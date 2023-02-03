import PropTypes from 'prop-types';
import React, { useRef } from 'react';

// Dom Manipulation of antd switch did not work as intended
export default function CustomSwitch({ handleSwitchClick, pianoId }) {

  const inputSwitch = useRef(null);

  const onClick = () => {
    inputSwitch.current.classList.toggle('MidiPiano-SwitchChecked');
    const isChecked = inputSwitch.current.classList.contains('MidiPiano-SwitchChecked');
    handleSwitchClick(isChecked);
  };

  return (
    <div ref={inputSwitch} className={`${pianoId} MidiPiano-Switch`} onClick={onClick} >
      <div className="MidiPiano-SwitchHandle" />
    </div>
  );
}

CustomSwitch.propTypes = {
  handleSwitchClick: PropTypes.func.isRequired,
  pianoId: PropTypes.string
};

CustomSwitch.defaultProps = {
  pianoId: ''
};
