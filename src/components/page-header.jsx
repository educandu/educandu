const PropTypes = require('prop-types');
const React = require('react');

function PageHeader({ children }) {
  return (
    <div className="PageHeader">
      <a className="PageHeader-logo" href="/">elmu</a>
      <div className="PageHeader-links">
        {children}
      </div>
    </div>
  );
}

PageHeader.propTypes = {
  children: PropTypes.node
};

PageHeader.defaultProps = {
  children: null
};

module.exports = PageHeader;
