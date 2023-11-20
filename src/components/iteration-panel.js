import React from 'react';
import PropTypes from 'prop-types';
import { Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { ChevronLeftIcon, ChevronLeftPipeIcon, ChevronRightIcon } from './icons/icons.js';

function IterationPanel({ itemCount, selectedItemIndex, alwaysAllowPreviousClick, disabled, onNextClick, onPreviousClick, onResetClick }) {
  const { t } = useTranslation();

  return (
    <div className="IterationPanel">
      <Tooltip title={t('common:reset')} disabled={disabled}>
        <Button
          shape="circle"
          icon={<ChevronLeftPipeIcon />}
          disabled={disabled}
          onClick={onResetClick}
          />
      </Tooltip>
      <Button
        shape="circle"
        icon={<ChevronLeftIcon />}
        disabled={disabled || (!alwaysAllowPreviousClick && selectedItemIndex === 0)}
        onClick={onPreviousClick}
        />
      <Button
        shape="circle"
        icon={<ChevronRightIcon />}
        disabled={disabled || selectedItemIndex === itemCount - 1}
        onClick={onNextClick}
        />
    </div>
  );
}

IterationPanel.propTypes = {
  alwaysAllowPreviousClick: PropTypes.bool,
  disabled: PropTypes.bool,
  itemCount: PropTypes.number.isRequired,
  onNextClick: PropTypes.func.isRequired,
  onPreviousClick: PropTypes.func.isRequired,
  onResetClick: PropTypes.func.isRequired,
  selectedItemIndex: PropTypes.number.isRequired
};

IterationPanel.defaultProps = {
  alwaysAllowPreviousClick: false,
  disabled: false
};

export default IterationPanel;
