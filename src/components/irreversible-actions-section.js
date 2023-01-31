import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

function IrreversibleActionsSection({ actions, className }) {
  const { t } = useTranslation('irreversibleActionsSection');

  return (
    <section>
      <div className={`IrreversibleActionsSection-headline ${className}`}>{t('title')}</div>
      <div className="IrreversibleActionsSection-content">
        {actions.map((action, index) => (
          <div key={index} className="IrreversibleActionsSection-action">
            <div className="IrreversibleActionsSection-actionTitle">{action.name}</div>
            <div>{action.description}</div>
            <div>
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
    </section>
  );
}

IrreversibleActionsSection.propTypes = {
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

IrreversibleActionsSection.defaultProps = {
  className: ''
};

export default IrreversibleActionsSection;
