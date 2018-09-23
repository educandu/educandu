const React = require('react');
const urls = require('../utils/urls');
const PropTypes = require('prop-types');
const LoginLogout = require('./login-logout.jsx');

function PageHeader({ children }) {
  return (
    <header className="PageHeader">
      <a className="PageHeader-logo" href={urls.getHomeUrl()}>elmu</a>
      <div className="PageHeader-links">
        {children}
      </div>
      <div className="PageHeader-user">
        <LoginLogout />
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
