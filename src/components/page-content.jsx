const React = require('react');
const PropTypes = require('prop-types');
const classNames = require('classnames');

function PageContent({ children, fullScreen }) {
  const classes = classNames({
    'PageContent': true,
    'PageContent--fullScreen': fullScreen
  });

  return (
    <main className={classes}>
      {children}
    </main>
  );
}

PageContent.propTypes = {
  children: PropTypes.node,
  fullScreen: PropTypes.bool
};

PageContent.defaultProps = {
  children: null,
  fullScreen: false
};

module.exports = PageContent;
