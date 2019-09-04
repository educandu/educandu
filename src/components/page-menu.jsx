const React = require('react');
const Menu = require('antd/lib/menu');
const PropTypes = require('prop-types');
const classNames = require('classnames');

const MenuItem = Menu.Item;

function PageMenu({ mode }) {
  const classes = classNames({
    'PageMenu': true,
    'PageMenu--horizontal': mode === 'horizontal',
    'PageMenu--vertical': mode === 'vertical'
  });

  return (
    <div className={classes}>
      <Menu mode={mode} selectable={false}>
        <MenuItem key="docs">Dokumente</MenuItem>
        <MenuItem key="menus">Menüs</MenuItem>
        <MenuItem key="users">Benutzer</MenuItem>
      </Menu>
    </div>
  );
}

PageMenu.propTypes = {
  mode: PropTypes.oneOf(['horizontal', 'vertical'])
};

PageMenu.defaultProps = {
  mode: 'horizontal'
};

module.exports = PageMenu;
