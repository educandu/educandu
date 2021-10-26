import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import urls from '../utils/urls.js';

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

export default ElmuLogo;
