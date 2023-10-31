import PropTypes from 'prop-types';
import { Button, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import EditIcon from '../icons/general/edit-icon.js';
import SaveIcon from '../icons/general/save-icon.js';
import CloseIcon from '../icons/general/close-icon.js';
import React, { Fragment, useEffect, useState } from 'react';
import { formatMillisecondsAsDuration, tryConvertDurationToMilliseconds } from '../../utils/media-utils.js';

const getDuration = milliseconds => {
  return formatMillisecondsAsDuration(milliseconds, { millisecondsLength: 3 });
};

function TimecodeFineTunningInput({
  value,
  lowerLimit,
  upperLimit,
  disabled,
  onValueChange
}) {
  const { t } = useTranslation('timecodeFineTunningInput');

  const [isEditing, setIsEditing] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [valueAsDuration, setValueAsDuration] = useState(null);

  useEffect(() => {
    setIsInvalid(false);
    setValueAsDuration(getDuration(value));
  }, [value]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCloseClick = () => {
    setIsEditing(false);
    setIsInvalid(false);
    setValueAsDuration(getDuration(value));
  };

  const handleInputChange = event => {
    const typedInDuration = event.target.value;

    setIsInvalid(false);
    setValueAsDuration(typedInDuration);
  };

  const handleSaveClick = () => {
    let milliseconds = tryConvertDurationToMilliseconds(valueAsDuration);
    if (milliseconds === null) {
      setIsInvalid(true);
      return;
    }

    if (milliseconds < lowerLimit) {
      milliseconds = lowerLimit;
    }
    if (milliseconds > upperLimit) {
      milliseconds = upperLimit;
    }

    setIsEditing(false);
    onValueChange(milliseconds);
    setValueAsDuration(getDuration(milliseconds));
  };

  return (
    <div className="TimecodeFineTunningInput">
      <div className="TimecodeFineTunningInput-value">
        {!isEditing && (
          <div>{valueAsDuration}</div>
        )}
        {!!isEditing && (
          <Input value={valueAsDuration} onChange={handleInputChange} onPressEnter={handleSaveClick} />
        )}
        {!!isInvalid && (
          <div className="TimecodeFineTunningInput-valueInvalidMessage">{t('invalidValue')}</div>
        )}
      </div>
      <div className="TimecodeFineTunningInput-controls">
        {!isEditing && (
          <Button icon={<EditIcon />} disabled={disabled} onClick={handleEditClick} />
        )}
        {!!isEditing && (
          <Fragment>
            <Button icon={<SaveIcon />} onClick={handleSaveClick} />
            <Button icon={<CloseIcon />} onClick={handleCloseClick} />
          </Fragment>
        )}
      </div>
    </div>
  );
}

TimecodeFineTunningInput.propTypes = {
  value: PropTypes.number.isRequired,
  lowerLimit: PropTypes.number.isRequired,
  upperLimit: PropTypes.number.isRequired,
  disabled: PropTypes.bool,
  onValueChange: PropTypes.func.isRequired
};

TimecodeFineTunningInput.defaultProps = {
  disabled: false
};

export default TimecodeFineTunningInput;
