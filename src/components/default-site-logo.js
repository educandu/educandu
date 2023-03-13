import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export default function DefaultSiteLogo({ inverted }) {
  return (
    <div className={classNames('DefaultSiteLogo', { 'DefaultSiteLogo--inverted': inverted })}>educandu</div>
  );
}

DefaultSiteLogo.propTypes = {
  inverted: PropTypes.bool
};

DefaultSiteLogo.defaultProps = {
  inverted: false
};
