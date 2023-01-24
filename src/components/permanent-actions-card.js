import React from 'react';
import PropTypes from 'prop-types';
import { Button, Card } from 'antd';
import { useTranslation } from 'react-i18next';

function PermanentActionsCard({ actions, className }) {
  const { t } = useTranslation('permanentActionsCard');

  return (
    <Card className={`PermanentActionsCard ${className}`} title={t('title')}>
      <div className="PermanentActionsCard-content">
        {actions.map((action, index) => (
          <div className="PermanentActionsCard-action" key={index}>
            <div>
              <span className="PermanentActionsCard-actionTitle">{action.name}</span>
              <span className="PermanentActionsCard-actionDescription">{action.description}</span>
            </div>
            <div className="PermanentActionsCard-actionButtonContainer">
              <Button
                danger
                type="primary"
                icon={action.button.icon || null}
                onClick={action.button.onClick || (() => {})}
                >
                {action.button.text}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

PermanentActionsCard.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    button: PropTypes.shape({
      text: PropTypes.string,
      icon: PropTypes.node,
      onClick: PropTypes.func
    })
  })).isRequired,
  className: PropTypes.string
};

PermanentActionsCard.defaultProps = {
  className: ''
};

export default PermanentActionsCard;
