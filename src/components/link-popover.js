import React from 'react';
import { Popover } from 'antd';
import PropTypes from 'prop-types';
import Icon from '@ant-design/icons';
import permissions from '../domain/permissions';
import { useUser } from '../components/user-context';

function LinkPopover({ children, items, placement, renderIfEmpty, title, trigger }) {
  const user = useUser();

  const filteredItems = items.filter(item => {
    return !item.permission || permissions.hasUserPermission(user, item.permission);
  });

  if (!filteredItems.length && !renderIfEmpty) {
    return null;
  }

  const content = (
    <ul className="LinkPopover">
      {filteredItems.map(item => (
        <li key={item.key} className="LinkPopover-item">
          <a href={item.href} className="LinkPopover-itemLink">
            {item.icon && <span><Icon component={item.icon} />&nbsp;&nbsp;</span>}
            {item.text}
          </a>
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
  items: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    icon: PropTypes.elementType,
    permission: PropTypes.string
  })),
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
