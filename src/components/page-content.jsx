const React = require('react');
const PropTypes = require('prop-types');
const classNames = require('classnames');

function PageContent({ children }) {
  const classes = classNames({
    PageContent: true
  });

  return (
    <main className={classes}>
      {children}
    </main>
  );
}

PageContent.propTypes = {
  children: PropTypes.node
};

PageContent.defaultProps = {
  children: null
};

module.exports = PageContent;
