import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

function DialogFooterButtons({
  allowOk,
  allowCancel,
  okDisabled,
  cancelDisabled,
  okButtonText,
  cancelButtonText,
  onOk,
  onCancel,
  extraButtons
}) {
  const { t } = useTranslation();
  return (
    <div className="DialogFooterButtons">
      <div className="DialogFooterButtons-buttonsGroup">
        {extraButtons.map((button, index) => (
          <Button
            key={index.toString()}
            icon={button.icon}
            disabled={!!button.disabled}
            onClick={evt => button.onClick?.(evt)}
            >
            {button.text}
          </Button>
        ))}
      </div>
      <div className="DialogFooterButtons-buttonsGroup">
        {!!allowCancel && <Button onClick={onCancel} disabled={!!cancelDisabled}>{cancelButtonText ?? t('common:cancel')}</Button>}
        {!!allowOk && <Button type="primary" onClick={onOk} disabled={!!okDisabled}>{okButtonText ?? t('common:ok')}</Button>}
      </div>
    </div>
  );
}

DialogFooterButtons.propTypes = {
  allowCancel: PropTypes.any,
  allowOk: PropTypes.any,
  cancelButtonText: PropTypes.string,
  cancelDisabled: PropTypes.any,
  extraButtons: PropTypes.arrayOf(PropTypes.shape({
    text: PropTypes.string.isRequired,
    icon: PropTypes.node,
    disabled: PropTypes.any,
    onClick: PropTypes.func
  })),
  okButtonText: PropTypes.string,
  okDisabled: PropTypes.any,
  onCancel: PropTypes.func,
  onOk: PropTypes.func
};

DialogFooterButtons.defaultProps = {
  allowCancel: true,
  allowOk: true,
  cancelButtonText: null,
  cancelDisabled: false,
  extraButtons: [],
  okButtonText: null,
  okDisabled: false,
  onCancel: () => {},
  onOk: () => {}
};

export default DialogFooterButtons;
