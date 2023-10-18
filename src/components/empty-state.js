import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Result } from 'antd';
import WarningIcon from './icons/general/warning-icon.js';
import InformationIcon from './icons/general/information-icon.js';
import ConfirmationIcon from './icons/general/confirmation-icon.js';

export const EMPTY_STATE_STATUS = {
  success: 'success',
  info: 'info',
  warning: 'warning',
  error: 'error'
};

function EmptyState({ icon, title, subtitle, button, compact, status }) {

  const actions = [];

  if (button) {
    actions.push((
      <div key="button">
        <Button
          type={button.isDefaultType ? 'default' : 'primary'}
          icon={button.icon || null}
          disabled={!!button.isDisabled}
          onClick={event => button.onClick(event)}
          >
          {button.text}
        </Button>
        {!!button.subtext && (
          <div className="EmptyState-buttonSubtext">{button.subtext}</div>
        )}
      </div>
    ));
  }

  let defaultIcon;

  if (!icon) {
    switch (status) {
      case EMPTY_STATE_STATUS.success:
        defaultIcon = <ConfirmationIcon />;
        break;
      case EMPTY_STATE_STATUS.warning:
        defaultIcon = <WarningIcon />;
        break;
      case EMPTY_STATE_STATUS.error:
        defaultIcon = <WarningIcon />;
        break;
      case EMPTY_STATE_STATUS.info:
      default:
        defaultIcon = <InformationIcon />;
        break;
    }
  }

  return (
    <div className={classNames('EmptyState', { 'EmptyState--compact': compact })}>
      <Result
        icon={icon || defaultIcon}
        title={title}
        status={status}
        subTitle={subtitle}
        extra={actions}
        />
    </div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string,
  subtitle: PropTypes.node,
  button: PropTypes.shape({
    icon: PropTypes.node,
    text: PropTypes.node.isRequired,
    subtext: PropTypes.string,
    isDisabled: PropTypes.bool,
    isDefaultType: PropTypes.bool,
    onClick: PropTypes.func.isRequired
  }),
  compact: PropTypes.bool,
  status: PropTypes.oneOf(Object.values(EMPTY_STATE_STATUS))
};

EmptyState.defaultProps = {
  icon: null,
  title: null,
  subtitle: null,
  button: null,
  compact: false,
  status: EMPTY_STATE_STATUS.info
};

export default EmptyState;
