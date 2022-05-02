import { Popover } from 'antd';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import React, { Fragment, useState } from 'react';
import { default as iconsNs } from '@ant-design/icons';
import { useUser } from '../components/user-context.js';
import { hasUserPermission } from '../domain/permissions.js';

const Icon = iconsNs.default || iconsNs;

function LinkPopover({ children, items, placement, renderIfEmpty, renderSeparator, title, trigger }) {
  const user = useUser();
  const [isVisible, setIsVisible] = useState(false);

  const filteredItems = items.filter(item => {
    return !item.permission || hasUserPermission(user, item.permission);
  });

  if (!filteredItems.length && !renderIfEmpty) {
    return null;
  }

  const handleVisibleChange = newIsVisible => {
    setIsVisible(newIsVisible);
  };

  const handleItemClick = item => {
    setIsVisible(false);
    item.onClick?.();
  };

  const renderLinkItem = item => {
    return (
      <a
        href={item.disabled ? null : item.href}
        onClick={item.disabled ? null : () => handleItemClick(item)}
        className={classnames('LinkPopover-itemLink', { 'is-disabled': item.disabled })}
        >
        {item.icon && <span><Icon component={item.icon} />&nbsp;&nbsp;</span>}
        {item.text}
      </a>
    );
  };

  const content = (
    <ul className="LinkPopover">
      {filteredItems.map((item, index) => (
        <Fragment key={item.key}>
          <li key={item.key} className="LinkPopover-item">
            {!!(item.href || item.onClick) && renderLinkItem(item)}
          </li>
          {(!!item.separator || (renderSeparator === 'betweenAllItems' && index < filteredItems.length - 1)) && (
            <li key={`${item.key}-separator`} className="LinkPopover-itemSeparator">
              <span className="LinkPopover-itemSeparatorLine" />
            </li>
          )}
        </Fragment>
      ))}
    </ul>
  );

  return (
    <Popover
      title={title}
      content={content}
      placement={placement}
      trigger={trigger}
      visible={isVisible}
      onVisibleChange={handleVisibleChange}
      >
      {children}
    </Popover>
  );
}

LinkPopover.propTypes = {
  children: PropTypes.node,
  items: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      href: PropTypes.string,
      onClick: PropTypes.func,
      separator: PropTypes.bool,
      text: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
      permission: PropTypes.string,
      disabled: PropTypes.bool
    }),
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      permission: PropTypes.string
    })
  ])),
  placement: PropTypes.oneOf([
    'top',
    'left',
    'right',
    'bottom',
    'topLeft',
    'topRight',
    'bottomLeft',
    'bottomRight',
    'leftTop',
    'leftBottom',
    'rightTop',
    'rightBottom'
  ]),
  renderIfEmpty: PropTypes.bool,
  renderSeparator: PropTypes.oneOf(['betweenAllItems', 'onlyWhenSpecified']),
  title: PropTypes.node,
  trigger: PropTypes.oneOf(['hover', 'focus', 'click', 'contextMenu'])
};

LinkPopover.defaultProps = {
  children: null,
  items: [],
  placement: 'top',
  renderIfEmpty: false,
  renderSeparator: 'betweenAllItems',
  title: null,
  trigger: 'hover'
};

export default LinkPopover;
