const PropTypes = require('prop-types');
const React = require('react');

function PageHeader({ children }) {
  return (
    <header className="PageHeader">
      <a className="PageHeader-logo" href="/">elmu</a>
      <div className="PageHeader-links">
        {children}
      </div>
    </header>
  );
}

PageHeader.propTypes = {
  children: PropTypes.node
};

PageHeader.defaultProps = {
  children: null
};

module.exports = PageHeader;
