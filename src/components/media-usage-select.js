import memoizee from 'memoizee';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useState } from 'react';
import { Button, Popover, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import { CircleFilledIcon } from './icons/icons.js';
import {
  MEDIA_USAGE_KEYS,
  MEDIA_USAGE_FILTER_CRITERIA_VALUES,
  usageFilterValueToUsageFilterMap,
  usageFilterMapToUsageFilterValue
} from '../utils/media-usage-utils.js';

const stringToMapMemoized = memoizee(usageFilterValueToUsageFilterMap, { max: 1 });
const mapToStringMemoized = memoizee(usageFilterMapToUsageFilterValue, { max: 1 });

const defaultPopoverOptionValues = usageFilterValueToUsageFilterMap('');

function MediaUsageSelect({ value, onChange, disabled }) {
  const { t } = useTranslation('mediaUsageSelect');
  const optionValues = stringToMapMemoized(value);
  const [isEditorPopoverOpen, setIsEditorPopoverOpen] = useState(false);
  const [editorPopoverOptionValues, setEditorPopoverOptionValues] = useState(defaultPopoverOptionValues);

  const applyEditorPopoverChanges = () => {
    setIsEditorPopoverOpen(false);
    onChange(mapToStringMemoized(editorPopoverOptionValues));
  };

  const handleEditorPopoverOpenChange = newOpen => {
    setIsEditorPopoverOpen(newOpen);
    if (newOpen) {
      setEditorPopoverOptionValues(optionValues);
    }
  };

  const handleEditorPopoverOptionChange = (key, newValue) => {
    setEditorPopoverOptionValues({ ...editorPopoverOptionValues, [key]: newValue });
  };

  const renderUsageOptionDisplay = optionKey => {
    const iconClasses = classNames([
      'MediaUsageSelect-usageOptionDisplayIcon',
      `MediaUsageSelect-usageOptionDisplayIcon--${optionValues[optionKey]}`,
      { 'is-disabled': disabled }
    ]);

    return (
      <div key={optionKey} className="MediaUsageSelect-usageOptionDisplay">
        <div className="MediaUsageSelect-usageOptionDisplayLetter">{optionKey}</div>
        <div className={iconClasses}><CircleFilledIcon /></div>
      </div>
    );
  };

  const renderUsageOptionEditor = optionKey => (
    <div key={optionKey} className="MediaUsageSelect-usageOptionEditor">
      <div className="MediaUsageSelect-usageOptionEditorLetter">{optionKey}</div>
      <div className="MediaUsageSelect-usageOptionEditorOptionText">{t(`usageOptionEditorOptionText_${optionKey}`)}</div>
      <div className="MediaUsageSelect-usageOptionEditorRadioGroup">
        <Radio.Group
          name={optionKey}
          disabled={disabled}
          value={editorPopoverOptionValues[optionKey]}
          onChange={event => handleEditorPopoverOptionChange(optionKey, event.target.value)}
          options={MEDIA_USAGE_FILTER_CRITERIA_VALUES.map(val => ({ label: t(`usageOptionRadioLabel_${val}`), value: val }))}
          />
      </div>
    </div>
  );

  const renderEditorPopoverTitle = () => {
    return (
      <div className="MediaUsageSelect-editorPopoverTitle">{t('editorPopoverTitle')}</div>
    );
  };

  const renderEditorPopoverContent = () => {
    return (
      <div className="MediaUsageSelect-editorPopoverContent">
        <div className="MediaUsageSelect-editorPopoverStartingPhrase">
          {t('usageOptionStartingPhrase')}
        </div>
        <div>
          {MEDIA_USAGE_KEYS.map(renderUsageOptionEditor)}
        </div>
        <div className="MediaUsageSelect-editorPopoverCloseButton">
          <Button type="primary" onClick={applyEditorPopoverChanges}>{t('common:apply')}</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="MediaUsageSelect">
      <Popover
        trigger="click"
        disabled={disabled}
        open={isEditorPopoverOpen}
        title={renderEditorPopoverTitle()}
        content={renderEditorPopoverContent()}
        onOpenChange={handleEditorPopoverOpenChange}
        >
        <Button
          className="MediaUsageSelect-usageOptionsButton"
          disabled={disabled}
          type="default"
          >
          <div className="MediaUsageSelect-usageOptions">
            {MEDIA_USAGE_KEYS.map(renderUsageOptionDisplay)}
          </div>
        </Button>
      </Popover>
    </div>
  );
}

MediaUsageSelect.propTypes = {
  value: PropTypes.string,
  disabled: PropTypes.bool,
  onChange: PropTypes.func
};

MediaUsageSelect.defaultProps = {
  value: '',
  disabled: false,
  onChange: () => {}
};

export default MediaUsageSelect;
