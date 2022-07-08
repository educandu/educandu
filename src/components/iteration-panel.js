import React from 'react';
import PropTypes from 'prop-types';
import { Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { LeftOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';

function IterationPanel({ items, selectedItemIndex, onNextClick, onPreviousClick, onResetClick }) {
  const { t } = useTranslation();

  return (
    <div className="IterationPanel">
      <Button
        shape="circle"
        icon={<LeftOutlined />}
        disabled={selectedItemIndex === 0}
        onClick={onPreviousClick}
        />
      <Tooltip title={t('common:reset')}>
        <Button
          shape="circle"
          icon={<ReloadOutlined />}
          onClick={onResetClick}
          />
      </Tooltip>
      <Button
        shape="circle"
        icon={<RightOutlined />}
        disabled={selectedItemIndex === items.length - 1}
        onClick={onNextClick}
        />
    </div>
  );
}

IterationPanel.propTypes = {
  items: PropTypes.array.isRequired,
  onNextClick: PropTypes.func.isRequired,
  onPreviousClick: PropTypes.func.isRequired,
  onResetClick: PropTypes.func.isRequired,
  selectedItemIndex: PropTypes.number.isRequired
};

export default IterationPanel;
