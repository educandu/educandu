const React = require('react');
const urls = require('../utils/urls');
const PropTypes = require('prop-types');
const classNames = require('classnames');

function ElmuLogo({ readonly, size }) {
  const classes = classNames({
    'ElmuLogo': true,
    'ElmuLogo--readonly': readonly,
    'ElmuLogo--big': size === 'big'
  });

  return readonly
    ? <span className={classes}>elmu</span>
    : <a className={classes} href={urls.getHomeUrl()}>elmu</a>;
}

ElmuLogo.propTypes = {
  readonly: PropTypes.bool,
  size: PropTypes.oneOf(['default', 'big'])
};

ElmuLogo.defaultProps = {
  readonly: false,
  size: 'default'
};

module.exports = ElmuLogo;
