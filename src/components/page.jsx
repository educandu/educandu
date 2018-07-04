const React = require('react');
const PropTypes = require('prop-types');
const classNames = require('classnames');

function Page({ children, fullScreen }) {
  const classes = classNames({
    'Page': true,
    'Page-fullScreen': fullScreen
  });

  return (
    <div className={classes}>
      {children}
    </div>
  );
}

Page.propTypes = {
  children: PropTypes.node,
  fullScreen: PropTypes.bool
};

Page.defaultProps = {
  children: null,
  fullScreen: false
};

module.exports = Page;
