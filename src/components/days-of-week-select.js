import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import React, { useMemo, useState } from 'react';
import { Button, Checkbox, Popover } from 'antd';
import { CircleFilledIcon } from './icons/icons.js';
import { DAY_OF_WEEK } from '../domain/constants.js';

const ALL_VALUES = Object.values(DAY_OF_WEEK).map(val => String(val));

const valueToArray = filterValue => (filterValue || '').split('');
const arrayToValue = filterArray => filterArray.join('');

function DaysOfWeekSelect({ value, onChange, disabled }) {
  const currentDisplayValues = valueToArray(value);
  const { t } = useTranslation('daysOfWeekSelect');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentEditorValues, setCurrentEditorValues] = useState(ALL_VALUES);

  const dayOfWeekLabels = useMemo(() => Object.fromEntries(ALL_VALUES.map(val => [val, t(`dayOfWeek_${val}`)])), [t]);
  const daysOfWeekEditorOptions = useMemo(() => ALL_VALUES.map(val => ({ label: dayOfWeekLabels[val], value: val })), [dayOfWeekLabels]);

  const applyEditorChanges = () => {
    setIsEditorOpen(false);
    onChange(arrayToValue(currentEditorValues));
  };

  const handleEditorOpenChange = newOpen => {
    setIsEditorOpen(newOpen);
    if (newOpen) {
      setCurrentEditorValues(currentDisplayValues);
    }
  };

  const handleEditorSelectedValuesChange = newSelectedValues => {
    setCurrentEditorValues(oldValues => newSelectedValues.length ? newSelectedValues : oldValues);
  };

  const renderDayOfWeekDisplayItem = dayOfWeek => {
    const isSelected = currentDisplayValues.includes(dayOfWeek);
    const iconClasses = classNames({
      'DaysOfWeekSelect-displayIcon': true,
      'DaysOfWeekSelect-displayIcon--on': isSelected,
      'DaysOfWeekSelect-displayIcon--off': !isSelected,
      'is-disabled': disabled
    });

    return (
      <div key={dayOfWeek} className="DaysOfWeekSelect-displayItem">
        <div className="DaysOfWeekSelect-displayLetter">{dayOfWeekLabels[dayOfWeek]}</div>
        <div className={iconClasses}><CircleFilledIcon /></div>
      </div>
    );
  };

  const renderEditorTitle = () => {
    return (
      <div className="DaysOfWeekSelect-editorTitle">{t('editorTitle')}</div>
    );
  };

  const renderEditorContent = () => {
    return (
      <div className="DaysOfWeekSelect-editorContent">
        <div className="DaysOfWeekSelect-editorSubtitle">
          {t('editorSubtitle')}
        </div>
        <div className="DaysOfWeekSelect-editorControls">
          <Checkbox.Group
            disabled={disabled}
            value={currentEditorValues}
            options={daysOfWeekEditorOptions}
            className="DaysOfWeekSelect-editorCheckboxes"
            onChange={handleEditorSelectedValuesChange}
            />
        </div>
        <div className="DaysOfWeekSelect-editorCloseButton">
          <Button type="primary" onClick={applyEditorChanges}>{t('common:apply')}</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="DaysOfWeekSelect">
      <Popover
        trigger="click"
        disabled={disabled}
        open={isEditorOpen}
        title={renderEditorTitle()}
        content={renderEditorContent()}
        onOpenChange={handleEditorOpenChange}
        >
        <Button
          className="DaysOfWeekSelect-mainButton"
          disabled={disabled}
          type="default"
          >
          <div className="DaysOfWeekSelect-display">
            {ALL_VALUES.map(renderDayOfWeekDisplayItem)}
          </div>
        </Button>
      </Popover>
    </div>
  );
}

DaysOfWeekSelect.propTypes = {
  value: PropTypes.string,
  disabled: PropTypes.bool,
  onChange: PropTypes.func
};

DaysOfWeekSelect.defaultProps = {
  value: '',
  disabled: false,
  onChange: () => {}
};

export default DaysOfWeekSelect;
