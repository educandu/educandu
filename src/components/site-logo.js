import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import urls from '../utils/urls.js';

function SiteLogo({ readonly, size }) {
  const classes = classNames({
    'SiteLogo': true,
    'SiteLogo--readonly': readonly,
    'SiteLogo--big': size === 'big'
  });

  return readonly
    ? <span className={classes}>elmu</span>
    : <a className={classes} href={urls.getHomeUrl()}>elmu</a>;
}

SiteLogo.propTypes = {
  readonly: PropTypes.bool,
  size: PropTypes.oneOf(['default', 'big'])
};

SiteLogo.defaultProps = {
  readonly: false,
  size: 'default'
};

export default SiteLogo;
