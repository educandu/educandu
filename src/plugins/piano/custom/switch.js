import PropTypes from 'prop-types';
import React, { useRef } from 'react';

export default function Switch({ handleSwitchClick, pianoId, isNoteInputEnabled }) {

  const inputSwitch = useRef(null);

  const onClick = () => {
    inputSwitch.current.classList.toggle('Piano-switchChecked');
    const isChecked = inputSwitch.current.classList.contains('Piano-switchChecked');
    handleSwitchClick(isChecked);
  };

  return (
    <div ref={inputSwitch} className={`${pianoId} Piano-switch ${isNoteInputEnabled.current && 'Piano-switchChecked'}`} onClick={onClick} >
      <div className="Piano-switchHandle" />
    </div>
  );
}

Switch.propTypes = {
  handleSwitchClick: PropTypes.func.isRequired,
  isNoteInputEnabled: PropTypes.object,
  pianoId: PropTypes.string
};

Switch.defaultProps = {
  isNoteInputEnabled: { current: false },
  pianoId: ''
};
