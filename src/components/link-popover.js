import React from 'react';
import { Popover } from 'antd';
import PropTypes from 'prop-types';
import { default as iconsNs } from '@ant-design/icons';
import { useUser } from '../components/user-context.js';
import { hasUserPermission } from '../domain/permissions.js';

const Icon = iconsNs.default || iconsNs;

function LinkPopover({ children, items, placement, renderIfEmpty, title, trigger }) {
  const user = useUser();

  const filteredItems = items.filter(item => {
    return !item.permission || hasUserPermission(user, item.permission);
  });

  if (!filteredItems.length && !renderIfEmpty) {
    return null;
  }

  const renderLinkItem = item => (
    <a href={item.href} className="LinkPopover-itemLink">
      {item.icon && <span><Icon component={item.icon} />&nbsp;&nbsp;</span>}
      {item.text}
    </a>);

  const content = (
    <ul className="LinkPopover">
      {filteredItems.map(item => (
        <li key={item.key} className="LinkPopover-item">
          {!!item.href && renderLinkItem(item)}
          {!!item.node && item.node}
        </li>
      ))}
    </ul>
  );

  return (
    <Popover
      title={title}
      content={content}
      placement={placement}
      trigger={trigger}
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
      href: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
      permission: PropTypes.string
    }),
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      node: PropTypes.node.isRequired,
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
  title: PropTypes.node,
  trigger: PropTypes.oneOf(['hover', 'focus', 'click', 'contextMenu'])
};

LinkPopover.defaultProps = {
  children: null,
  items: [],
  placement: 'top',
  renderIfEmpty: false,
  title: null,
  trigger: 'hover'
};

export default LinkPopover;
