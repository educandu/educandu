import PropTypes from 'prop-types';
import classNames from 'classnames';
import { RightOutlined } from '@ant-design/icons';
import React, { Fragment, useState } from 'react';

export const COLLAPSIBLE_COLOR = {
  green: 'green',
  blue: 'blue',
  orange: 'orange',
  red: 'red'
};

export default function Collapsible({ title, icon, color, width, children, isCollapsible, isCollapsed }) {

  const [isExpanded, setIsExpanded] = useState((isCollapsible && !isCollapsed) || !isCollapsed);

  const handleHeaderClick = () => {
    setIsExpanded(!isExpanded);
  };

  const renderIcon = ({ standalone }) => {
    if (!icon) {
      return null;
    }

    const iconClasses = classNames({
      'Collapsible-icon': true,
      'Collapsible-icon--standalone': standalone
    });

    return (<div className={iconClasses}>{icon}</div>);
  };

  const renderContent = ({ standalone }) => {
    const contentClasses = classNames({
      'Collapsible-content': true,
      'Collapsible-content--standalone': standalone,
      'Collapsible-content--green': color === COLLAPSIBLE_COLOR.green,
      'Collapsible-content--blue': color === COLLAPSIBLE_COLOR.blue,
      'Collapsible-content--orange': color === COLLAPSIBLE_COLOR.orange,
      'Collapsible-content--red': color === COLLAPSIBLE_COLOR.red
    });

    return (
      <div className={contentClasses}>
        {!!standalone && renderIcon({ standalone: true })}
        {children}
      </div>
    );
  };

  const headerClasses = classNames({
    'Collapsible-header': true,
    'Collapsible-header--green': color === COLLAPSIBLE_COLOR.green,
    'Collapsible-header--blue': color === COLLAPSIBLE_COLOR.blue,
    'Collapsible-header--orange': color === COLLAPSIBLE_COLOR.orange,
    'Collapsible-header--red': color === COLLAPSIBLE_COLOR.red,
    'is-above-content': isExpanded || (!isCollapsible && title)
  });

  return (
    <div className={`Collapsible u-width-${width}`}>
      {!isCollapsible && !title && renderContent({ standalone: true })}

      {!isCollapsible && !!title && (
        <Fragment>
          <div className={headerClasses}>
            {renderIcon({ standalone: false })}
            {title}
          </div>
          { renderContent({ standalone: false }) }
        </Fragment>
      )}

      {!!isCollapsible && (
        <Fragment>
          <a className={headerClasses} onClick={handleHeaderClick}>
            {renderIcon({ standalone: false })}
            {title}
            <RightOutlined className={classNames('Collapsible-headerArrow', { 'is-rotated-downwards': isExpanded })} />
          </a>
          {!!isExpanded && renderContent({ standalone: false }) }
        </Fragment>
      )}
    </div>
  );
}

Collapsible.propTypes = {
  children: PropTypes.node,
  color: PropTypes.oneOf(Object.values(COLLAPSIBLE_COLOR)),
  icon: PropTypes.node,
  isCollapsed: PropTypes.bool,
  isCollapsible: PropTypes.bool,
  title: PropTypes.node,
  width: PropTypes.number
};

Collapsible.defaultProps = {
  children: null,
  color: null,
  icon: null,
  isCollapsed: true,
  isCollapsible: true,
  title: null,
  width: 100
};
