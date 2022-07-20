import React from 'react';
import PropTypes from 'prop-types';
import { Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { LeftOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';

function IterationPanel({ itemCount, selectedItemIndex, alwaysAllowPreviousClick, disabled, onNextClick, onPreviousClick, onResetClick }) {
  const { t } = useTranslation();

  return (
    <div className="IterationPanel">
      <Button
        shape="circle"
        icon={<LeftOutlined />}
        disabled={disabled || (!alwaysAllowPreviousClick && selectedItemIndex === 0)}
        onClick={onPreviousClick}
        />
      <Tooltip title={t('common:reset')} disabled={disabled}>
        <Button
          shape="circle"
          icon={<ReloadOutlined />}
          disabled={disabled}
          onClick={onResetClick}
          />
      </Tooltip>
      <Button
        shape="circle"
        icon={<RightOutlined />}
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
